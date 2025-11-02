const COLORS = [
  "#00FFFF", "#FF00FF", "#FFA500", "#7FFF00", "#FF6347",
  "#ADFF2F", "#FF69B4", "#1E90FF", "#FFD700", "#00CED1"
];

const METRIC_COLUMNS = {
  undernourishment_rate: { label: "Prevalence of Undernourishment (%)", yTitle: "Undernourishment (%)" },
  calorie_supply_per_person: { label: "Daily Calorie Supply (kcal/person/day)", yTitle: "Calories (kcal)" },
  stunting_rate: { label: "Child Stunting Rate (%)", yTitle: "Stunting (%)" },
  agri_employment_share: { label: "Agricultural Employment Share (%)", yTitle: "Employment (%)" },
};

let trendsData = [];
let trendsChart = null;

function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => obj[h] = isNaN(values[i]) ? values[i].trim() : parseFloat(values[i]));
    return obj;
  });
}

async function loadCSV(file) {
  const res = await fetch(file);
  const text = await res.text();
  return parseCSV(text);
}

function populateDropdowns() {
  const countries = [...new Set(trendsData.map(d => d.country))].sort();
  const c1 = document.getElementById("country1");
  const c2 = document.getElementById("country2");
  [c1, c2].forEach(dd => dd.innerHTML = '<option value="">Select Country</option>');
  countries.forEach(c => {
    c1.add(new Option(c, c));
    c2.add(new Option(c, c));
  });
}

function getCountryData(country, metric) {
  return trendsData
    .filter(d => d.country === country && !isNaN(d.year) && d[metric])
    .sort((a, b) => a.year - b.year);
}

function updateChart() {
  const metric = document.getElementById("metric").value;
  const c1 = document.getElementById("country1").value;
  const c2 = document.getElementById("country2").value;
  const msg = document.getElementById("loading-message-trends");
  msg.style.display = "none";

  if (!metric || !c1) {
    msg.style.display = "block";
    msg.textContent = "Please select at least one country.";
    return;
  }

  const d1 = getCountryData(c1, metric);
  const d2 = getCountryData(c2, metric);
  const allYears = [...new Set([...d1, ...d2].map(d => d.year))].sort((a, b) => a - b);
  const formatYear = (y) => parseInt(y);

  const datasets = [];
  [d1, d2].forEach((data, i) => {
    if (data.length)
      datasets.push({
        label: i === 0 ? c1 : c2,
        data: data.map(d => ({ x: formatYear(d.year), y: d[metric] })),
        borderColor: COLORS[i % COLORS.length],
        backgroundColor: COLORS[i % COLORS.length] + "55",
        borderWidth: 3,
        tension: 0.4
      });
  });

  if (trendsChart) trendsChart.destroy();
  const ctx = document.getElementById("trendsChart").getContext("2d");
  trendsChart = new Chart(ctx, {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#fff" } },
        title: {
          display: true,
          text: METRIC_COLUMNS[metric].label,
          color: "#fff",
          font: { size: 18, weight: "bold" }
        }
      },
      scales: {
        x: {
          type: "linear",
          ticks: {
            color: "#ddd",
            callback: v => v.toFixed(0)
          },
          grid: { color: "rgba(255,255,255,0.1)" },
          title: { display: true, text: "Year", color: "#fff" }
        },
        y: {
          ticks: { color: "#ddd" },
          grid: { color: "rgba(255,255,255,0.1)" },
          title: { display: true, text: METRIC_COLUMNS[metric].yTitle, color: "#fff" }
        }
      }
    }
  });
}

async function init() {
  trendsData = await loadCSV("output.csv");
  populateDropdowns();
  ["metric", "country1", "country2"].forEach(id =>
    document.getElementById(id).addEventListener("change", updateChart)
  );
}

document.addEventListener("DOMContentLoaded", init);
