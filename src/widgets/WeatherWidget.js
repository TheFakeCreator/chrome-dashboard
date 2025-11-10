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
      icon: '<i data-lucide="cloud-sun" class="w-5 h-5"></i>',
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
   * Get weather icon (Lucide icon name)
   * @param {string} iconCode - OpenWeatherMap icon code
   * @param {string} size - Icon size class (default: w-16 h-16)
   * @returns {string} Lucide icon HTML
   */
  getWeatherIcon(iconCode, size = 'w-16 h-16') {
    const iconMap = {
      '01d': 'sun', '01n': 'moon',
      '02d': 'cloud-sun', '02n': 'cloud-moon',
      '03d': 'cloud', '03n': 'cloud',
      '04d': 'cloudy', '04n': 'cloudy',
      '09d': 'cloud-drizzle', '09n': 'cloud-drizzle',
      '10d': 'cloud-rain', '10n': 'cloud-rain',
      '11d': 'cloud-lightning', '11n': 'cloud-lightning',
      '13d': 'cloud-snow', '13n': 'cloud-snow',
      '50d': 'cloud-fog', '50n': 'cloud-fog'
    };

    const iconName = iconMap[iconCode] || 'cloud-sun';
    return `<i data-lucide="${iconName}" class="${size} text-primary-500"></i>`;
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
      <div class="flex items-center justify-center p-8">
        <div class="text-center space-y-3">
          <div class="inline-block animate-spin">
            <i data-lucide="loader-circle" class="w-8 h-8 text-primary-500"></i>
          </div>
          <p class="text-dark-muted">Loading weather data...</p>
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
      <div class="flex items-center justify-center p-8">
        <div class="text-center space-y-4 max-w-sm">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full">
            <i data-lucide="alert-circle" class="w-6 h-6 text-red-500"></i>
          </div>
          <p class="text-dark-text font-medium">${this.error}</p>
          ${!this.settings.apiKey ? `
            <p class="text-sm text-dark-muted">
              Get a free API key from 
              <a href="https://openweathermap.org/api" target="_blank" class="text-primary-500 hover:text-primary-400 underline">OpenWeatherMap</a>
            </p>
          ` : ''}
          <button class="btn btn-primary" data-action="retry">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            <span>Retry</span>
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
      <div class="flex items-center justify-center p-8">
        <div class="text-center space-y-4">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-500/10 rounded-full">
            <i data-lucide="cloud-sun" class="w-8 h-8 text-primary-500"></i>
          </div>
          <p class="text-dark-text">Configure weather widget</p>
          <button class="btn btn-primary" data-action="configure">
            <i data-lucide="settings" class="w-4 h-4"></i>
            <span>Add API Key</span>
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
      <div class="space-y-4">
        <!-- Current Weather -->
        <div class="space-y-4">
          <!-- Location Header -->
          <div class="flex items-center gap-2 text-dark-muted">
            <i data-lucide="map-pin" class="w-4 h-4"></i>
            <span class="text-sm font-medium">${weather.name}, ${weather.sys.country}</span>
          </div>

          <!-- Main Weather Display -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div>${icon}</div>
              <div>
                <div class="text-4xl font-bold text-dark-text">${temp}</div>
                <div class="text-sm text-dark-muted capitalize">${description}</div>
              </div>
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
      <div class="grid grid-cols-3 gap-4 pt-4 border-t border-dark-border">
        ${this.settings.showFeelsLike ? `
          <div class="flex flex-col items-center gap-1">
            <span class="text-xs text-dark-muted">Feels like</span>
            <span class="text-sm font-semibold text-dark-text">${feelsLike}</span>
          </div>
        ` : ''}
        
        ${this.settings.showHumidity ? `
          <div class="flex flex-col items-center gap-1">
            <span class="text-xs text-dark-muted">Humidity</span>
            <span class="text-sm font-semibold text-dark-text">${weather.main.humidity}%</span>
          </div>
        ` : ''}
        
        ${this.settings.showWind ? `
          <div class="flex flex-col items-center gap-1">
            <span class="text-xs text-dark-muted">Wind</span>
            <span class="text-sm font-semibold text-dark-text">${Math.round(weather.wind.speed)} ${this.settings.units === 'imperial' ? 'mph' : 'm/s'}</span>
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
      <div class="grid grid-cols-5 gap-2 pt-4 border-t border-dark-border">
        ${this.forecast.map(day => `
          <div class="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-dark-elevated transition-colors">
            <div class="text-xs text-dark-muted font-medium">${day.date}</div>
            <div>${this.getWeatherIcon(day.icon, 'w-8 h-8')}</div>
            <div class="text-sm font-semibold text-dark-text">
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
    
    // Add event listeners for actions (if elements exist)
    if (this.element?.querySelector('[data-action]')) {
      this.on('click', '[data-action]', (event) => this.handleEvent(event));
    }
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
