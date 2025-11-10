/**
 * @module WeatherWidget
 * @description Weather widget with current conditions and forecast using OpenWeatherMap API
 * 
 * @example
 * const weather = new WeatherWidget(app, {
 *   settings: { 
 *     units: 'metric',
 *     showForecast: true,
 *     autoDetectLocation: true
 *   }
 * });
 * weather.mount('#widget-grid');
 */

import { BaseWidget } from '../widgets/BaseWidget.js';

export class WeatherWidget extends BaseWidget {
  constructor(app, options = {}) {
    super(app, {
      ...options,
      name: 'Weather',
      title: 'Weather',
      icon: '🌤️',
      description: 'Display current weather and forecast',
      category: 'productivity',
      updateInterval: 600000 // Update every 10 minutes
    });

    // Weather data
    this.currentWeather = null;
    this.forecast = null;
    this.location = null;
    this.lastFetchTime = null;

    // API configuration
    // Using free tier of OpenWeatherMap - users can add their own API key in settings
    this.apiKey = null;
    this.apiEndpoint = 'https://api.openweathermap.org/data/2.5';

    // Cache duration (10 minutes)
    this.cacheDuration = 600000;
  }

  /**
   * Get default settings
   * @returns {Object} Default settings
   */
  getDefaultSettings() {
    return {
      apiKey: '', // Users need to add their own free API key
      location: '', // City name or leave empty for auto-detect
      autoDetectLocation: true,
      units: 'metric', // 'metric', 'imperial', 'standard'
      showForecast: true,
      showFeelsLike: true,
      showHumidity: true,
      showWind: true
    };
  }

  /**
   * Load widget data
   * @returns {Promise<void>}
   */
  async loadData() {
    // Ensure settings are initialized
    if (!this.settings) {
      this.settings = this.getDefaultSettings();
    }

    // Check if we need to fetch new data
    if (this.shouldFetchData()) {
      try {
        this.loading = true;
        this.emit('widget:loading', { widgetId: this.widgetId });

        await this.fetchWeatherData();

        this.loading = false;
        this.error = null;
        this.emit('widget:loaded', { widgetId: this.widgetId });
      } catch (error) {
        this.loading = false;
        this.error = error.message;
        this.emit('widget:error', { widgetId: this.widgetId, error: error.message });
        console.error('[WeatherWidget] Error loading data:', error);
      }
    }
  }

  /**
   * Check if we should fetch new data
   * @returns {boolean}
   */
  shouldFetchData() {
    if (!this.currentWeather) return true;
    if (!this.lastFetchTime) return true;
    
    const timeSinceLastFetch = Date.now() - this.lastFetchTime;
    return timeSinceLastFetch >= this.cacheDuration;
  }

  /**
   * Fetch weather data from API
   * @returns {Promise<void>}
   */
  async fetchWeatherData() {
    // Check if API key is configured
    if (!this.settings.apiKey) {
      throw new Error('API key not configured. Get a free key from openweathermap.org');
    }

    // Get location
    const location = await this.getLocation();
    
    // Fetch current weather
    const weatherUrl = `${this.apiEndpoint}/weather?q=${location}&appid=${this.settings.apiKey}&units=${this.settings.units}`;
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    this.currentWeather = await weatherResponse.json();
    this.location = location;
    this.lastFetchTime = Date.now();

    // Fetch forecast if enabled
    if (this.settings.showForecast) {
      const forecastUrl = `${this.apiEndpoint}/forecast?q=${location}&appid=${this.settings.apiKey}&units=${this.settings.units}`;
      const forecastResponse = await fetch(forecastUrl);
      
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        // Get daily forecast (one per day)
        this.forecast = this.processForecast(forecastData.list);
      }
    }

    // Update widget data
    this.data = {
      current: this.currentWeather,
      forecast: this.forecast,
      location: this.location,
      lastUpdate: this.lastFetchTime
    };
  }

  /**
   * Get location from settings or auto-detect
   * @returns {Promise<string>} Location
   */
  async getLocation() {
    if (this.settings.location) {
      return this.settings.location;
    }

    if (this.settings.autoDetectLocation) {
      try {
        // Try to get location from browser geolocation API
        const position = await this.getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        // Use coordinates to get location
        return `lat=${latitude}&lon=${longitude}`;
      } catch (error) {
        console.warn('[WeatherWidget] Geolocation failed, using default location');
      }
    }

    // Default location
    return 'London';
  }

  /**
   * Get current position using Geolocation API
   * @returns {Promise<GeolocationPosition>}
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        maximumAge: 600000 // Cache for 10 minutes
      });
    });
  }

  /**
   * Process forecast data to get daily summaries
   * @param {Array} forecastList - Forecast data
   * @returns {Array} Daily forecast
   */
  processForecast(forecastList) {
    const dailyForecasts = new Map();

    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      if (!dailyForecasts.has(day)) {
        dailyForecasts.set(day, {
          date: day,
          temp: item.main.temp,
          tempMin: item.main.temp_min,
          tempMax: item.main.temp_max,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed
        });
      }
    });

    // Return first 5 days
    return Array.from(dailyForecasts.values()).slice(0, 5);
  }

  /**
   * Get weather icon emoji
   * @param {string} iconCode - OpenWeatherMap icon code
   * @returns {string} Weather emoji
   */
  getWeatherIcon(iconCode) {
    const iconMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '🌨️', '13n': '🌨️',
      '50d': '🌫️', '50n': '🌫️'
    };

    return iconMap[iconCode] || '🌤️';
  }

  /**
   * Format temperature
   * @param {number} temp - Temperature value
   * @returns {string} Formatted temperature
   */
  formatTemperature(temp) {
    const rounded = Math.round(temp);
    const unit = this.settings.units === 'imperial' ? '°F' : '°C';
    return `${rounded}${unit}`;
  }

  /**
   * Render widget content
   * @returns {string} HTML string
   */
  render() {
    if (this.loading) {
      return this.renderLoading();
    }

    if (this.error) {
      return this.renderError();
    }

    if (!this.currentWeather) {
      return this.renderEmpty();
    }

    return this.renderWeather();
  }

  /**
   * Render loading state
   * @returns {string} HTML string
   */
  renderLoading() {
    return `
      <div class="weather-widget loading">
        <div class="weather-loading">
          <div class="spinner"></div>
          <p>Loading weather data...</p>
        </div>
      </div>
    `;
  }

  /**
   * Render error state
   * @returns {string} HTML string
   */
  renderError() {
    return `
      <div class="weather-widget error">
        <div class="weather-error">
          <span class="error-icon">⚠️</span>
          <p class="error-message">${this.error}</p>
          ${!this.settings.apiKey ? `
            <p class="error-hint">
              Get a free API key from 
              <a href="https://openweathermap.org/api" target="_blank">OpenWeatherMap</a>
            </p>
          ` : ''}
          <button class="btn btn-primary" data-action="retry">
            Retry
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render empty state
   * @returns {string} HTML string
   */
  renderEmpty() {
    return `
      <div class="weather-widget empty">
        <div class="weather-empty">
          <span class="empty-icon">🌤️</span>
          <p>Configure weather widget</p>
          <button class="btn btn-primary" data-action="configure">
            Add API Key
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render weather content
   * @returns {string} HTML string
   */
  renderWeather() {
    const weather = this.currentWeather;
    const icon = this.getWeatherIcon(weather.weather[0].icon);
    const temp = this.formatTemperature(weather.main.temp);
    const feelsLike = this.formatTemperature(weather.main.feels_like);
    const description = weather.weather[0].description;

    return `
      <div class="weather-widget">
        <!-- Current Weather -->
        <div class="weather-current">
          <div class="weather-header">
            <div class="weather-location">
              <span class="location-icon">📍</span>
              <span class="location-name">${weather.name}, ${weather.sys.country}</span>
            </div>
          </div>

          <div class="weather-main">
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">
              <div class="temp-value">${temp}</div>
              <div class="temp-description">${description}</div>
            </div>
          </div>

          ${this.renderWeatherDetails()}
        </div>

        ${this.settings.showForecast && this.forecast ? this.renderForecast() : ''}
      </div>
    `;
  }

  /**
   * Render weather details
   * @returns {string} HTML string
   */
  renderWeatherDetails() {
    const weather = this.currentWeather;
    const feelsLike = this.formatTemperature(weather.main.feels_like);

    return `
      <div class="weather-details">
        ${this.settings.showFeelsLike ? `
          <div class="weather-detail">
            <span class="detail-label">Feels like</span>
            <span class="detail-value">${feelsLike}</span>
          </div>
        ` : ''}
        
        ${this.settings.showHumidity ? `
          <div class="weather-detail">
            <span class="detail-label">Humidity</span>
            <span class="detail-value">${weather.main.humidity}%</span>
          </div>
        ` : ''}
        
        ${this.settings.showWind ? `
          <div class="weather-detail">
            <span class="detail-label">Wind</span>
            <span class="detail-value">${Math.round(weather.wind.speed)} ${this.settings.units === 'imperial' ? 'mph' : 'm/s'}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render forecast
   * @returns {string} HTML string
   */
  renderForecast() {
    if (!this.forecast || this.forecast.length === 0) return '';

    return `
      <div class="weather-forecast">
        ${this.forecast.map(day => `
          <div class="forecast-day">
            <div class="forecast-date">${day.date}</div>
            <div class="forecast-icon">${this.getWeatherIcon(day.icon)}</div>
            <div class="forecast-temp">
              ${this.formatTemperature(day.tempMax)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Handle widget events
   * @param {Event} event - DOM event
   */
  handleEvent(event) {
    const action = event.target.dataset.action;

    if (action === 'retry') {
      this.lastFetchTime = null;
      this.loadData();
    } else if (action === 'configure') {
      this.emit('widget:configure', { widgetId: this.widgetId });
    }
  }

  /**
   * Settings changed handler
   * @param {Object} oldSettings - Old settings
   * @param {Object} newSettings - New settings
   */
  onSettingsChanged(oldSettings, newSettings) {
    // If location or units changed, fetch new data
    if (
      oldSettings.location !== newSettings.location ||
      oldSettings.units !== newSettings.units ||
      oldSettings.apiKey !== newSettings.apiKey
    ) {
      this.lastFetchTime = null;
      this.loadData();
    }
  }

  /**
   * Widget mounted
   */
  onMount() {
    super.onMount();
    
    // Add event listeners for actions
    this.on('click', '[data-action]', (event) => this.handleEvent(event));
  }

  /**
   * Widget destroyed
   */
  onDestroy() {
    // Clear update timer
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    super.onDestroy();
  }
}
