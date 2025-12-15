const Weather = require('../models/Weather');
const axios = require('axios');
const loadConfig = require('./loadConfig');

const openMeteoToWeatherApi = {
  0: 1000, // Clear sky
  1: 1003, // Mainly clear
  2: 1003, // Partly cloudy
  3: 1006, // Overcast
  45: 1135, // Fog
  48: 1147, // Depositing rime fog
  51: 1150, // Light drizzle
  53: 1153, // Moderate drizzle
  55: 1153, // Dense drizzle
  56: 1168, // Freezing drizzle
  57: 1171, // Freezing drizzle heavy
  61: 1183, // Slight rain
  63: 1186, // Moderate rain
  65: 1195, // Heavy rain
  66: 1204, // Freezing rain
  67: 1207, // Heavy freezing rain
  71: 1210, // Slight snow fall
  73: 1213, // Moderate snow fall
  75: 1219, // Heavy snow fall
  77: 1114, // Snow grains
  80: 1180, // Rain showers
  81: 1189, // Rain showers moderate
  82: 1195, // Violent rain showers
  85: 1210, // Snow showers slight
  86: 1219, // Snow showers heavy
  95: 1087, // Thunderstorm
  96: 1273, // Thunderstorm with hail
  99: 1276, // Thunderstorm with heavy hail
};

const openMeteoConditionText = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

const fetchFromWeatherApi = async ({ secret, lat, long }) => {
  const res = await axios.get(
    `http://api.weatherapi.com/v1/current.json?key=${secret}&q=${lat},${long}`
  );

  const cursor = res.data.current;
  const weatherData = await Weather.create({
    externalLastUpdate: cursor.last_updated,
    tempC: cursor.temp_c,
    tempF: cursor.temp_f,
    isDay: cursor.is_day,
    cloud: cursor.cloud,
    conditionText: cursor.condition.text,
    conditionCode: cursor.condition.code,
    humidity: cursor.humidity,
    windK: cursor.wind_kph,
    windM: cursor.wind_mph,
  });
  return weatherData;
};

const fetchFromOpenMeteo = async ({ lat, long }) => {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: long,
    current:
      'temperature_2m,relative_humidity_2m,cloud_cover,is_day,wind_speed_10m,weather_code',
    wind_speed_unit: 'kmh',
    timezone: 'auto',
  });

  const res = await axios.get(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  const current = res.data?.current;

  if (!current) {
    throw new Error('External API request failed');
  }

  const tempC = current.temperature_2m ?? 0;
  const tempF = Number(((tempC * 9) / 5 + 32).toFixed(2));
  const windK = current.wind_speed_10m ?? 0;
  const windM = Number((windK * 0.621371).toFixed(2));
  const conditionCode = openMeteoToWeatherApi[current.weather_code] || 1000;

  const weatherData = await Weather.create({
    externalLastUpdate: current.time,
    tempC,
    tempF,
    isDay: current.is_day ? 1 : 0,
    cloud: current.cloud_cover ?? 0,
    conditionText: openMeteoConditionText[current.weather_code] || 'Clear sky',
    conditionCode,
    humidity: current.relative_humidity_2m ?? 0,
    windK,
    windM,
  });

  return weatherData;
};

const getExternalWeather = async () => {
  const {
    WEATHER_API_KEY: secret,
    lat,
    long,
    weatherProvider = 'weatherapi',
  } = await loadConfig();

  if (!lat && !long) {
    throw new Error('Latitude and longitude are required for weather updates');
  }

  try {
    if (weatherProvider === 'open-meteo') {
      return await fetchFromOpenMeteo({ lat, long });
    }

    if (!secret) {
      throw new Error('External API request failed');
    }

    return await fetchFromWeatherApi({ secret, lat, long });
  } catch (err) {
    throw new Error('External API request failed');
  }
};

module.exports = getExternalWeather;
