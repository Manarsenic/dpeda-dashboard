let ghiData = [];
let ghiChart = null;

const BAR_COLORS = [
  "#00FFFF", "#FF00FF", "#FFA500", "#7FFF00",
  "#FF6347", "#ADFF2F", "#FFD700", "#00CED1",
  "#FF69B4", "#1E90FF"
];

function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      const val = values[i]?.trim();
      obj[h] = val === "" ? null : isNaN(val) ? val : parseFloat(val);
    });
    return obj;
  });
}

async function loadCSV(file) {
  const res = await fetch(file);
  const text = await res.text();
  return parseCSV(text);
}

function getLatestYearColumn(headers) {
  const yearCols = headers.filter(h => /^\d{4}$/.test(h.trim()));
  if (yearCols.length === 0) return null;
  return yearCols.sort((a, b) => parseInt(a) - parseInt(b)).at(-1);
}

function renderChart() {
  const msg = document.getElementById("loading-message-ghi");
  msg.style.display = "none";

  if (!ghiData.length) {
    msg.textContent = "No data available.";
    return;
  }

  const headers = Object.keys(ghiData[0]);
  const latestYear = getLatestYearColumn(headers);
  if (!latestYear) {
    msg.textContent = "No valid year columns found in CSV.";
    return;
  }

  const validData = ghiData
    .filter(d => d[latestYear] !== null && !isNaN(d[latestYear]))
    .sort((a, b) => b[latestYear] - a[latestYear])
    .slice(0, 10);

  const ctx = document.getElementById("ghiBarChart").getContext("2d");
  if (ghiChart) ghiChart.destroy();

  ghiChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: validData.map(d => d.Country || d.country || "Unknown"),
      datasets: [{
        label: `GHI Score (${latestYear})`,
        data: validData.map(d => d[latestYear]),
        backgroundColor: BAR_COLORS.map(c => `linear-gradient(90deg, ${c}80, ${c}FF)`),
        borderColor: BAR_COLORS,
        borderWidth: 2,
        borderRadius: 8,
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `Top 10 GHI Scores (${latestYear})`,
          color: "#fff",
          font: { size: 18, weight: "bold" }
        },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          callbacks: {
            label: (ctx) => `${ctx.parsed.x}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#ccc" },
          grid: { color: "rgba(255,255,255,0.1)" },
          title: { display: true, text: "GHI Score", color: "#fff" }
        },
        y: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" }
        }
      }
    }
  });
}

function renderTable() {
  const table = document.getElementById("ghi-table");
  const headers = Object.keys(ghiData[0]);
  table.innerHTML = "";

  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });

  const tbody = table.createTBody();
  ghiData.forEach(row => {
    const r = tbody.insertRow();
    headers.forEach(h => {
      const cell = r.insertCell();
      cell.textContent = row[h];
    });
  });
}

async function init() {
  ghiData = await loadCSV("ghi_wiki_cleaned.csv");
  renderChart();
  renderTable();
}

document.addEventListener("DOMContentLoaded", init);
