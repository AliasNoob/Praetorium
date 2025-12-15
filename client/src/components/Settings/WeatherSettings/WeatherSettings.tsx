import axios from 'axios';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';

import { ApiResponse, Weather, WeatherForm } from '../../../interfaces';
import { actionCreators } from '../../../store';
import { State } from '../../../store/reducers';
import { inputHandler, weatherSettingsTemplate } from '../../../utility';
import { Button, InputGroup, SettingsHeadline } from '../../UI';

// Redux
// Typescript
// UI
// Utils
export const WeatherSettings = (): JSX.Element => {
  const { loading, config } = useSelector((state: State) => state.config);

  const dispatch = useDispatch();
  const { createNotification, updateConfig } = bindActionCreators(
    actionCreators,
    dispatch
  );

  // Initial state
  const [formData, setFormData] = useState<WeatherForm>(
    weatherSettingsTemplate
  );
  const usingWeatherApi = formData.weatherProvider === 'weatherapi';

  // Get config
  useEffect(() => {
    setFormData({
      ...config,
      weatherProvider: config.weatherProvider || 'weatherapi',
      weatherWidgetDesign: config.weatherWidgetDesign || 'design1',
      weatherDetailsUrl: config.weatherDetailsUrl || '',
      weatherGlass:
        typeof config.weatherGlass === 'boolean' ? config.weatherGlass : true,
    });
  }, [config, loading]);

  // Form handler
  const formSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();

    const hasLocation = !!formData.lat && !!formData.long;

    // Check for api key input
    if (
      usingWeatherApi &&
      (formData.lat || formData.long) &&
      !formData.WEATHER_API_KEY
    ) {
      createNotification({
        title: 'Warning',
        message: 'API key is missing. Weather Module will NOT work',
      });
    }

    if (!hasLocation) {
      createNotification({
        title: 'Warning',
        message: 'Latitude and longitude are required to refresh weather data',
      });
    }

    // Save settings
    await updateConfig(formData);

    const canRefresh =
      hasLocation && (!usingWeatherApi || !!formData.WEATHER_API_KEY);
    if (!canRefresh) {
      return;
    }

    // Update weather
    axios
      .get<ApiResponse<Weather>>('/api/weather/update')
      .then(() => {
        createNotification({
          title: 'Success',
          message: 'Weather updated',
        });
      })
      .catch((err) => {
        createNotification({
          title: 'Error',
          message: err.response.data.error,
        });
      });
  };

  // Input handler
  const inputChangeHandler = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    options?: { isNumber?: boolean; isBool?: boolean }
  ) => {
    inputHandler<WeatherForm>({
      e,
      options,
      setStateHandler: setFormData,
      state: formData,
    });
  };

  // Get user location
  const getLocation = () => {
    window.navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setFormData({
          ...formData,
          lat: latitude,
          long: longitude,
        });
      }
    );
  };

  return (
    <form onSubmit={(e) => formSubmitHandler(e)}>
      <SettingsHeadline text="Provider" />
      <InputGroup>
        <label htmlFor="weatherProvider">Weather provider</label>
        <select
          id="weatherProvider"
          name="weatherProvider"
          value={formData.weatherProvider}
          onChange={(e) => inputChangeHandler(e)}
        >
          <option value="weatherapi">WeatherAPI.com</option>
          <option value="open-meteo">Open-Meteo (no API key)</option>
        </select>
        <span>
          Choose between the existing WeatherAPI.com integration or the keyless
          Open-Meteo service.
        </span>
      </InputGroup>

      {usingWeatherApi && (
        <InputGroup>
          <label htmlFor="WEATHER_API_KEY">WeatherAPI.com key</label>
          <input
            type="text"
            id="WEATHER_API_KEY"
            name="WEATHER_API_KEY"
            placeholder="secret"
            value={formData.WEATHER_API_KEY}
            onChange={(e) => inputChangeHandler(e)}
          />
          <span>
            Using
            <a href="https://www.weatherapi.com/pricing.aspx" target="blank">
              {' '}
              Weather API
            </a>
            . Key is required for this provider.
          </span>
        </InputGroup>
      )}

      {!usingWeatherApi && (
        <InputGroup>
          <label>Open-Meteo</label>
          <span>
            Open-Meteo requires only latitude and longitude. API key is not
            needed. Docs:{' '}
            <a href="https://open-meteo.com/en/docs" target="blank">
              open-meteo.com/en/docs
            </a>
          </span>
        </InputGroup>
      )}

      <SettingsHeadline text="Location" />
      {/* LAT */}
      <InputGroup>
        <label htmlFor="lat">Latitude</label>
        <input
          type="number"
          id="lat"
          name="lat"
          placeholder="52.22"
          value={formData.lat}
          onChange={(e) => inputChangeHandler(e, { isNumber: true })}
          step="any"
          lang="en-150"
        />
        <span>
          <button
            type="button"
            onClick={getLocation}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'inherit',
              textDecoration: 'underline',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            Click to get current location
          </button>
        </span>
      </InputGroup>

      {/* LONG */}
      <InputGroup>
        <label htmlFor="long">Longitude</label>
        <input
          type="number"
          id="long"
          name="long"
          placeholder="21.01"
          value={formData.long}
          onChange={(e) => inputChangeHandler(e, { isNumber: true })}
          step="any"
          lang="en-150"
        />
      </InputGroup>

      <SettingsHeadline text="Other" />
      <InputGroup>
        <label htmlFor="weatherWidgetDesign">Widget design</label>
        <select
          id="weatherWidgetDesign"
          name="weatherWidgetDesign"
          value={formData.weatherWidgetDesign}
          onChange={(e) => inputChangeHandler(e)}
        >
          <option value="design1">Design 1 (current conditions)</option>
          <option value="design2">Design 2 (5-day compact)</option>
          <option value="design3">Design 3 (5-day rich)</option>
        </select>
        <span>
          Designs 2 and 3 use Open-Meteo forecast data for multi-day display.
        </span>
      </InputGroup>

      {!usingWeatherApi && (
        <InputGroup>
          <label htmlFor="weatherDetailsUrl">Detailed weather link</label>
          <input
            type="text"
            id="weatherDetailsUrl"
            name="weatherDetailsUrl"
            placeholder="https://www.yr.no/..."
            value={formData.weatherDetailsUrl}
            onChange={(e) => inputChangeHandler(e)}
          />
          <span>
            Optional: clicking the widget opens this URL in a new tab. Leave
            empty to disable click-through.
          </span>
        </InputGroup>
      )}

      <InputGroup>
        <label htmlFor="weatherGlass">Glass outline</label>
        <select
          id="weatherGlass"
          name="weatherGlass"
          value={formData.weatherGlass ? 1 : 0}
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
        >
          <option value={1}>On</option>
          <option value={0}>Off</option>
        </select>
        <span>Toggle glassy/bubble borders for weather widgets.</span>
      </InputGroup>

      {/* TEMPERATURE */}
      <InputGroup>
        <label htmlFor="isCelsius">Temperature unit</label>
        <select
          id="isCelsius"
          name="isCelsius"
          onChange={(e) => inputChangeHandler(e, { isBool: true })}
          value={formData.isCelsius ? 1 : 0}
        >
          <option value={1}>Celsius</option>
          <option value={0}>Fahrenheit</option>
        </select>
      </InputGroup>

      {/* WEATHER DATA */}
      <InputGroup>
        <label htmlFor="weatherData">Additional weather data</label>
        <select
          id="weatherData"
          name="weatherData"
          value={formData.weatherData}
          onChange={(e) => inputChangeHandler(e)}
        >
          <option value="cloud">Cloud coverage</option>
          <option value="humidity">Humidity</option>
        </select>
      </InputGroup>

      <Button>Save changes</Button>
    </form>
  );
};
