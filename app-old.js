const API_URL = "https://weather-backend-production-0667.up.railway.app/api/weather?q=";

const placeInput = document.getElementById("placeInput");
const searchBtn = document.getElementById("searchBtn");
const statusEl = document.getElementById("status");
const next12El = document.getElementById("next12");
const next7El = document.getElementById("next7");

searchBtn.addEventListener("click", () => {
  const q = placeInput.value.trim();
  if (!q) {
    statusEl.textContent = "Please type a place name.";
    return;
  }
  fetchWeather(q);
});

placeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

async function fetchWeather(place) {
  statusEl.textContent = "Loading...";
  next12El.innerHTML = "";
  next7El.innerHTML = "";

  try {
    const res = await fetch(API_URL + encodeURIComponent(place));
    if (!res.ok) throw new Error("Request failed");
    const data = await res.json();

    if (data.error) {
      statusEl.textContent = "Error: " + data.error;
      return;
    }

    statusEl.textContent = `Weather for ${data.location.name}, ${data.location.country}`;
    document.getElementById("astroInfo").innerHTML =
  `🌅 Sunrise: ${data.astro.sunrise} &nbsp;&nbsp; 🌇 Sunset: ${data.astro.sunset}`;
    renderNext12(data.next12Hours);
    renderTempChart(data.next12Hours);
    renderRainChart(data.next12Hours);
    renderNext7(data.next7Days);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Could not load weather. Try another place.";
  }
}

function renderNext12(hours) {
  next12El.innerHTML = "";
  hours.forEach((h) => {
    const time = new Date(h.time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div><strong>${time}</strong></div>
      <img src="https:${h.icon}" alt="${h.condition}" style="width:50px;height:50px;">
      <div>Temp: ${h.temp.toFixed(1)} °C</div>
      <div>Feels like: ${h.feels_like.toFixed(1)} °C</div>
      <div>${h.condition}</div>
      <div>Wind: ${h.wind_kph} kph ${windArrow(h.wind_dir)}</div>
      <div>Humidity: ${h.humidity}%</div>
    `;

    next12El.appendChild(div);
  });
}

function renderNext7(days) {
  next7El.innerHTML = "";
  days.forEach((d) => {
    const date = new Date(d.date).toLocaleDateString();

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div><strong>${date}</strong></div>
      <img src="https:${d.icon}" alt="${d.condition}" style="width:50px;height:50px;">
      <div>Min: ${d.min.toFixed(1)} °C</div>
      <div>Max: ${d.max.toFixed(1)} °C</div>
      <div>${d.condition}</div>
    `;

    next7El.appendChild(div);
  });
}

let tempChart = null;

function renderTempChart(hours) {
  const labels = hours.map(h => new Date(h.time).toLocaleTimeString([], { hour: "2-digit" }));
  const temps = hours.map(h => h.temp);

  const ctx = document.getElementById("tempChart").getContext("2d");

  if (tempChart) tempChart.destroy();

  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Temperature (°C)",
        data: temps,
        borderColor: "#007bff",
        backgroundColor: "rgba(0,123,255,0.2)",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#007bff"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

let rainChart = null;

function renderRainChart(hours) {
  const labels = hours.map(h => new Date(h.time).toLocaleTimeString([], { hour: "2-digit" }));
  const rain = hours.map(h => h.rain_chance);

  const ctx = document.getElementById("rainChart").getContext("2d");

  if (rainChart) rainChart.destroy();

  rainChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Rain Chance (%)",
        data: rain,
        borderColor: "#007bff",
        backgroundColor: "rgba(0,150,136,0.6)",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#007bff"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

function windArrow(dir) {
  const map = {
    N: "↑", NE: "↗", E: "→", SE: "↘",
    S: "↓", SW: "↙", W: "←", NW: "↖"
  };
  return map[dir] || "•";
}
