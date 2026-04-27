require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;

// --------------------------------------------------
// 1. FETCH WEATHER FROM WeatherAPI
// --------------------------------------------------
async function getWeather(place) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(
    place
  )}&days=7&aqi=no&alerts=no`;

  const res = await axios.get(url);
  return res.data;
}

// --------------------------------------------------
// 2. MAIN ENDPOINT
// --------------------------------------------------
app.get("/api/weather", async (req, res) => {
  try {
    const place = req.query.q;
    if (!place) return res.status(400).json({ error: "Missing ?q=placeName" });

    const data = await getWeather(place);

    // -------------------------
    // LOCATION INFO
    // -------------------------
    const location = {
      name: data.location.name,
      country: data.location.country,
      lat: data.location.lat,
      lon: data.location.lon,
      localtime: data.location.localtime
    };

    // --------------------------
    // SUNRISE SUNSET TIMES
    // --------------------------
    const astro = {
    sunrise: data.forecast.forecastday[0].astro.sunrise,
    sunset: data.forecast.forecastday[0].astro.sunset
    };

    // -------------------------
    // NEXT 12 HOURS (today + tomorrow)
    // -------------------------
    const allHours = [
      ...data.forecast.forecastday[0].hour, // today
      ...data.forecast.forecastday[1].hour  // tomorrow
    ];

    const now = new Date(data.location.localtime);

    // Find the first hour >= now
    const startIndex = allHours.findIndex(h => {
      return new Date(h.time).getTime() >= now.getTime();
    });

    // Slice next 12 hours
    const next12Hours = allHours.slice(startIndex, startIndex + 12).map(h => ({
      time: h.time,
      temp: h.temp_c,
      feels_like: h.feelslike_c,
      condition: h.condition.text,
      icon: h.condition.icon,
      wind_kph: h.wind_kph,
      wind_dir: h.wind_dir,
      rain_chance: h.chance_of_rain,
      humidity: h.humidity
    }));

    // -------------------------
    // NEXT 7 DAYS
    // -------------------------
    const next7Days = data.forecast.forecastday.map(d => ({
      date: d.date,
      min: d.day.mintemp_c,
      max: d.day.maxtemp_c,
      condition: d.day.condition.text,
      icon: d.day.condition.icon
    }));

    // -------------------------
    // SEND CLEAN JSON
    // -------------------------
    res.json({
      location,
      next12Hours,
      next7Days,
      astro
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not fetch weather data" });
  }
});

// --------------------------------------------------
// 3. START SERVER
// --------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Weather API running on port ${PORT}`));
