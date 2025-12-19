import axios from 'axios';
import { Fragment, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { ApiResponse, Weather, WeatherForecast } from '../../../interfaces';
import { State } from '../../../store/reducers';
import { weatherTemplate } from '../../../utility/templateObjects/weatherTemplate';
import { WeatherIcon } from '../../UI';
import classes from './WeatherWidget.module.css';

// Redux
// Typescript
// CSS
// UI
export const WeatherWidget = (): JSX.Element => {
  const { loading: configLoading, config } = useSelector(
    (state: State) => state.config
  );

  const [weather, setWeather] = useState<Weather>(weatherTemplate);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [openMeteoCurrent, setOpenMeteoCurrent] = useState<{
    tempC: number;
    apparentTempC: number;
    windK: number;
    humidity: number;
    cloud: number;
    weatherCode: number;
    isDay: number;
    precipitationProbability: number;
    nextPrecip: { probability: number; time: string; type: 'rain' | 'snow' | 'mixed' } | null;
  } | null>(null);

  // Initial request to get data
  useEffect(() => {
    axios
      .get<ApiResponse<Weather[]>>('/api/weather')
      .then((data) => {
        const weatherData = data.data.data[0];
        if (weatherData) {
          setWeather(weatherData);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  // Open socket for data updates
  useEffect(() => {
    const socketProtocol =
      document.location.protocol === 'http:' ? 'ws:' : 'wss:';
    const socketAddress = `${socketProtocol}//${window.location.host}/socket`;
    const webSocketClient = new WebSocket(socketAddress);

    webSocketClient.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setWeather((prev) => ({
        ...prev,
        ...data,
      }));
    };

    return () => webSocketClient.close();
  }, []);

  const provider = config.weatherProvider || 'weatherapi';
  const design = config.weatherWidgetDesign || 'design1';
  const detailUrl =
    provider === 'open-meteo' ? config.weatherDetailsUrl || '' : '';

  // Fetch Open-Meteo forecast/current when needed
  useEffect(() => {
    const hasLocation = !!config.lat && !!config.long;
    if (provider !== 'open-meteo' || !hasLocation) {
      setForecast([]);
      setOpenMeteoCurrent(null);
      return;
    }

    const fetchForecast = async () => {
      const params = new URLSearchParams({
        latitude: String(config.lat),
        longitude: String(config.long),
        current:
          'temperature_2m,apparent_temperature,relative_humidity_2m,cloud_cover,is_day,wind_speed_10m,weather_code',
        hourly:
          'precipitation_probability,weather_code',
        daily:
          'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,wind_speed_10m_max',
        forecast_days: '5',
        timezone: 'auto',
        models: 'best_match',  // Uses best model for the location (GEM for Canada)
      });

      try {
        const res = await axios.get(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`
        );
        const current = res.data?.current;
        const daily = res.data?.daily;
        const hourly = res.data?.hourly;

        // Find next significant precipitation event
        // Use weather_code to determine precipitation type:
        // 51-57: Drizzle, 61-67: Rain, 71-77: Snow, 80-82: Rain showers, 85-86: Snow showers, 95-99: Thunderstorm
        let nextPrecip: { probability: number; time: string; type: 'rain' | 'snow' | 'mixed' } | null = null;
        if (hourly?.time?.length) {
          const now = new Date();
          for (let i = 0; i < hourly.time.length; i++) {
            const hourTime = new Date(hourly.time[i]);
            const prob = hourly.precipitation_probability?.[i] ?? 0;
            const weatherCode = hourly.weather_code?.[i] ?? 0;
            
            // Only consider future times with >= 30% probability (more meaningful threshold)
            if (hourTime > now && prob >= 30) {
              // Determine precip type from weather code
              let precipType: 'rain' | 'snow' | 'mixed' = 'rain';
              
              // Snow codes: 71-77 (snow), 85-86 (snow showers), 56-57 (freezing drizzle), 66-67 (freezing rain)
              const isSnow = (weatherCode >= 71 && weatherCode <= 77) || 
                             (weatherCode >= 85 && weatherCode <= 86);
              const isFreezing = (weatherCode >= 56 && weatherCode <= 57) || 
                                 (weatherCode >= 66 && weatherCode <= 67);
              
              if (isSnow) {
                precipType = 'snow';
              } else if (isFreezing) {
                precipType = 'mixed';  // Freezing rain/drizzle shown as mixed
              }
              // else: rain (drizzle 51-55, rain 61-65, showers 80-82, thunderstorm 95-99)

              nextPrecip = {
                probability: prob,
                time: hourTime.toLocaleTimeString([], { hour: 'numeric' }),
                type: precipType,
              };
              break;
            }
          }
        }

        if (current) {
          setOpenMeteoCurrent({
            tempC: current.temperature_2m ?? 0,
            apparentTempC: current.apparent_temperature ?? current.temperature_2m ?? 0,
            windK: current.wind_speed_10m ?? 0,
            humidity: current.relative_humidity_2m ?? 0,
            cloud: current.cloud_cover ?? 0,
            weatherCode: current.weather_code ?? 1000,
            isDay: current.is_day ? 1 : 0,
            precipitationProbability: daily?.precipitation_probability_max?.[0] ?? 0,
            nextPrecip,
          });
        }

        if (daily?.time?.length) {
          const items: WeatherForecast[] = daily.time.map(
            (_: string, idx: number) => ({
              date: daily.time[idx],
              tempMaxC: daily.temperature_2m_max?.[idx] ?? 0,
              tempMinC: daily.temperature_2m_min?.[idx] ?? 0,
              apparentMaxC: daily.apparent_temperature_max?.[idx] ?? 0,
              apparentMinC: daily.apparent_temperature_min?.[idx] ?? 0,
              precipitationProbability:
                daily.precipitation_probability_max?.[idx] ?? 0,
              windKph: daily.wind_speed_10m_max?.[idx] ?? 0,
              windMph: Number(
                ((daily.wind_speed_10m_max?.[idx] ?? 0) * 0.621371).toFixed(2)
              ),
              weatherCode: daily.weather_code?.[idx] ?? 1000,
            })
          );
          // Skip current day; show next 5 days
          setForecast(items.slice(1, 6));
        }
      } catch (err) {
        console.error('Open-Meteo request failed', err);
      }
    };

    fetchForecast();
  }, [config.lat, config.long, provider]);

  const currentTempC =
    provider === 'open-meteo' && openMeteoCurrent
      ? openMeteoCurrent.tempC
      : weather.tempC;
  const currentTempF = Number(((currentTempC * 9) / 5 + 32).toFixed(2));
  const apparentTempC =
    provider === 'open-meteo' && openMeteoCurrent
      ? openMeteoCurrent.apparentTempC
      : null;
  const currentConditionCode =
    provider === 'open-meteo' && openMeteoCurrent
      ? openMeteoCurrent.weatherCode
      : weather.conditionCode;
  const currentIsDay =
    provider === 'open-meteo' && openMeteoCurrent
      ? openMeteoCurrent.isDay
      : weather.isDay;
  
  // Get extra value - handle precipitation separately since WeatherAPI doesn't have it
  const getExtraValue = () => {
    if (provider === 'open-meteo' && openMeteoCurrent) {
      if (config.weatherData === 'humidity') return openMeteoCurrent.humidity;
      if (config.weatherData === 'precipitation') return null;
      return openMeteoCurrent.cloud;
    }
    // For WeatherAPI, only cloud and humidity are valid
    if (config.weatherData === 'precipitation') return weather.cloud;
    return weather[config.weatherData as 'cloud' | 'humidity'];
  };
  const extraValue = getExtraValue();

  // Format next precipitation display
  const precipDisplay =
    provider === 'open-meteo' && config.weatherData === 'precipitation' && openMeteoCurrent?.nextPrecip
      ? `${openMeteoCurrent.nextPrecip.probability}% ${openMeteoCurrent.nextPrecip.type === 'snow' ? '❄️' : openMeteoCurrent.nextPrecip.type === 'mixed' ? '🌨️' : '🌧️'} @ ${openMeteoCurrent.nextPrecip.time}`
      : provider === 'open-meteo' && config.weatherData === 'precipitation'
      ? 'No precip'
      : null;

  const formatTemp = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '--';
    return config.isCelsius
      ? `${Math.round(value)}°C`
      : `${Math.round(((value * 9) / 5 + 32))}°F`;
  };

  const formatWind = (valueKph: number | null | undefined) => {
    if (valueKph === null || valueKph === undefined) return '--';
    return config.isCelsius
      ? `${Math.round(valueKph)} km/h`
      : `${Math.round((valueKph ?? 0) * 0.621371)} mph`;
  };

  const design1Content = (
    <Fragment>
      <div className={classes.WeatherIcon}>
        <WeatherIcon weatherStatusCode={currentConditionCode} isDay={currentIsDay} />
      </div>
      <div className={classes.WeatherDetails}>
        {/* TEMPERATURE */}
        {config.isCelsius ? (
          <span>{currentTempC}°C</span>
        ) : (
          <span>{Math.round(currentTempF)}°F</span>
        )}

        {/* ADDITIONAL DATA */}
        {precipDisplay ? (
          <span>{precipDisplay}</span>
        ) : (
          <span>{extraValue}%</span>
        )}
      </div>
      {/* FORECAST ROW - shown when precipitation is selected and we have forecast */}
      {provider === 'open-meteo' && config.weatherData === 'precipitation' && forecast.length > 0 && (
        <div className={classes.Design1ForecastRow}>
          {forecast.slice(0, 4).map((day) => {
            const date = new Date(day.date);
            const label = date.toLocaleDateString(undefined, { weekday: 'short' });
            return (
              <div className={classes.Design1ForecastItem} key={day.date}>
                <span className={classes.Design1ForecastDay}>{label}</span>
                <span className={classes.Design1ForecastTemp}>
                  {formatTemp(day.tempMaxC)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Fragment>
  );

  const design2Content =
    provider === 'open-meteo' && forecast.length ? (
      <div className={classes.Design2}>
        <div className={classes.Design2Row}>
          <WeatherIcon weatherStatusCode={currentConditionCode} isDay={currentIsDay} />
          <div className={classes.Design2Stats}>
            <span className={classes.StatEmphasis}>{formatTemp(currentTempC)}</span>
            {apparentTempC !== null && (
              <>
                <span className={classes.Separator}>|</span>
                <span>Feels {formatTemp(apparentTempC)}</span>
              </>
            )}
            {forecast[0] && (
              <>
                <span className={classes.Separator}>|</span>
                <span>
                  {formatTemp(forecast[0].tempMinC)} to {formatTemp(forecast[0].tempMaxC)}
                </span>
                <span className={classes.Separator}>|</span>
                <span>{formatWind(forecast[0].windKph)}</span>
                <span className={classes.Separator}>|</span>
                <span>{precipDisplay || `${forecast[0].precipitationProbability ?? 0}%`}</span>
              </>
            )}
          </div>
        </div>
        <div className={classes.ForecastRow}>
          {forecast.slice(0, 5).map((day) => {
            const date = new Date(day.date);
            const label = date.toLocaleDateString(undefined, {
              weekday: 'short',
            });
            return (
              <div className={classes.ForecastItem} key={day.date}>
                <div className={classes.DayLabel}>{label}</div>
                <div className={classes.DayTemps}>
                  <span>{formatTemp(day.tempMinC)}</span>
                  <span className={classes.Separator}>/</span>
                  <span>{formatTemp(day.tempMaxC)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ) : null;

  const design3Content =
    provider === 'open-meteo' && forecast.length ? (
      <div className={classes.Design3}>
        <div className={classes.Design3Header}>
          <WeatherIcon weatherStatusCode={currentConditionCode} isDay={currentIsDay} />
          <div className={classes.Design3Temps}>
            <div className={classes.Design3Primary}>{formatTemp(currentTempC)}</div>
            <div className={classes.Design3Secondary}>
              {apparentTempC !== null ? `Feels ${formatTemp(apparentTempC)}` : ''}
            </div>
            <div className={classes.Design3Meta}>
              {forecast[0]
                ? `${formatTemp(forecast[0].tempMinC)} / ${formatTemp(
                    forecast[0].tempMaxC
                  )} · ${formatWind(forecast[0].windKph)} · ${
                    precipDisplay || `${forecast[0].precipitationProbability ?? 0}%`
                  }`
                : ''}
            </div>
          </div>
        </div>
        <div className={classes.Design3Grid}>
          {forecast.slice(0, 5).map((day) => {
            const date = new Date(day.date);
            const label = date.toLocaleDateString(undefined, { weekday: 'short' });
            return (
              <div className={classes.Design3Card} key={day.date}>
                <div className={classes.Design3CardHeader}>
                  <span className={classes.DayLabel}>{label}</span>
                  <span className={classes.Design3Precip}>
                    {day.precipitationProbability ?? 0}%
                  </span>
                </div>
                <div className={classes.Design3TempsRow}>
                  <span>{formatTemp(day.apparentMinC)}</span>
                  <span className={classes.Separator}>·</span>
                  <span>{formatTemp(day.apparentMaxC)}</span>
                </div>
                <div className={classes.Design3Wind}>{formatWind(day.windKph)}</div>
              </div>
            );
          })}
        </div>
      </div>
    ) : null;

  const hasCurrent =
    provider === 'open-meteo'
      ? !!openMeteoCurrent || weather.id > 0
      : weather.id > 0;
  const canShowWeather =
    !configLoading &&
    hasCurrent &&
    (provider === 'open-meteo' || !!config.WEATHER_API_KEY);

  let content: JSX.Element | null = null;
  if (canShowWeather) {
    if (design === 'design3' && design3Content) {
      content = design3Content;
    } else if (design === 'design2' && design2Content) {
      content = design2Content;
    } else {
      content = design1Content;
    }
  }

  const handleClick = () => {
    if (detailUrl) {
      window.open(detailUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`${classes.WeatherWidget} ${
        detailUrl ? classes.WeatherWidgetClickable : ''
      } ${config.weatherGlass ? classes.Glass : ''}`}
      onClick={handleClick}
      role={detailUrl ? 'button' : undefined}
    >
      {content}
    </div>
  );
};
