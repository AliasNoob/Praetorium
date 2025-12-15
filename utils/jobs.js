const schedule = require('node-schedule');
const getExternalWeather = require('./getExternalWeather');
const clearWeatherData = require('./clearWeatherData');
const Sockets = require('../Sockets');
const Logger = require('./Logger');
const loadConfig = require('./loadConfig');
const logger = new Logger();

module.exports = async function () {
  const { WEATHER_API_KEY, weatherProvider = 'weatherapi', lat, long } =
    await loadConfig();

  const shouldRunWeatherJob =
    (weatherProvider === 'weatherapi' && WEATHER_API_KEY) ||
    (weatherProvider === 'open-meteo' && lat && long);

  if (shouldRunWeatherJob) {
    // Update weather data every 15 minutes
    schedule.scheduleJob('updateWeather', '0 */15 * * * *', async () => {
      try {
        const weatherData = await getExternalWeather();

        Sockets.getSocket('weather').socket.send(JSON.stringify(weatherData));
      } catch (err) {
        logger.log(err.message, 'ERROR');
      }
    });

    // Clear old weather data every 4 hours
    schedule.scheduleJob('clearWeather', '0 5 */4 * * *', async () => {
      clearWeatherData();
    });
  }
};
