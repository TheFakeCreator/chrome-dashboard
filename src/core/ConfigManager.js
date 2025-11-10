/**
 * @module ConfigManager
 * @description Application configuration management with defaults and validation
 * 
 * @example
 * const config = new ConfigManager(storageManager);
 * await config.init();
 * 
 * // Get config value
 * const theme = config.get('theme');
 * 
 * // Update config
 * await config.update({ theme: 'dark' });
 */

export class ConfigManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.config = this.getDefaultConfig();
    this.validators = this.getValidators();
  }

  /**
   * Initialize config from storage
   * @returns {Promise<void>}
   */
  async init() {
    try {
      const storedConfig = await this.storage.get('config');
      
      if (storedConfig && storedConfig.config) {
        this.config = this.mergeWithDefaults(storedConfig.config);
      } else {
        // First time setup - save defaults
        await this.save();
      }
    } catch (error) {
      console.error('[ConfigManager] Error initializing config:', error);
      // Use defaults on error
    }
  }

  /**
   * Get default configuration
   * @private
   * @returns {Object} Default config
   */
  getDefaultConfig() {
    return {
      // General settings
      theme: 'auto', // 'light', 'dark', 'auto'
      language: 'en',
      firstRun: true,
      version: '2.0.0',

      // Display settings
      display: {
        compactMode: false,
        animations: true,
        transparencyEffects: true,
        fontSize: 'medium', // 'small', 'medium', 'large'
        columns: 3,
        gridGap: 20,
        cardPadding: 20
      },

      // Widget settings
      widgets: {
        clock: {
          enabled: true,
          format: '24h', // '12h', '24h'
          showSeconds: false,
          showDate: true,
          order: 0
        },
        weather: {
          enabled: true,
          location: 'auto',
          units: 'metric', // 'metric', 'imperial'
          updateInterval: 30, // minutes
          order: 1
        },
        search: {
          enabled: true,
          defaultEngine: 'google',
          suggestions: true,
          order: 2
        },
        notes: {
          enabled: true,
          autosave: true,
          order: 3
        },
        tasks: {
          enabled: true,
          showCompleted: false,
          sortBy: 'manual', // 'manual', 'priority', 'date'
          order: 4
        },
        bookmarks: {
          enabled: false,
          maxItems: 10,
          order: 5
        },
        focus: {
          enabled: true,
          defaultDuration: 25, // minutes
          shortBreak: 5,
          longBreak: 15,
          autoStart: false,
          notifications: true,
          order: 6
        }
      },

      // Notification settings
      notifications: {
        enabled: true,
        sound: true,
        volume: 50,
        focus: true,
        tasks: true,
        weather: false
      },

      // Keyboard shortcuts
      shortcuts: {
        enabled: true,
        openSearch: 'ctrl+k',
        toggleFocus: 'ctrl+f',
        newTask: 'ctrl+t',
        openSettings: 'ctrl+,',
        toggleTheme: 'ctrl+shift+t'
      },

      // Privacy settings
      privacy: {
        analyticsEnabled: false,
        crashReports: false,
        usageData: false
      },

      // Background settings
      background: {
        type: 'color', // 'color', 'gradient', 'image', 'unsplash'
        color: '#0f172a',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        imageUrl: '',
        unsplashCollection: '',
        blur: 0,
        opacity: 100
      },

      // Advanced settings
      advanced: {
        debugMode: false,
        experimentalFeatures: false,
        performanceMode: false,
        dataSync: true,
        autoBackup: true,
        backupInterval: 7 // days
      }
    };
  }

  /**
   * Get validators for config values
   * @private
   * @returns {Object} Validators
   */
  getValidators() {
    return {
      theme: (value) => ['light', 'dark', 'auto'].includes(value),
      language: (value) => typeof value === 'string' && value.length === 2,
      'display.compactMode': (value) => typeof value === 'boolean',
      'display.animations': (value) => typeof value === 'boolean',
      'display.columns': (value) => Number.isInteger(value) && value >= 1 && value <= 5,
      'display.gridGap': (value) => Number.isInteger(value) && value >= 0 && value <= 100,
      'widgets.*.enabled': (value) => typeof value === 'boolean',
      'widgets.focus.defaultDuration': (value) => Number.isInteger(value) && value >= 1 && value <= 120,
      'notifications.volume': (value) => Number.isInteger(value) && value >= 0 && value <= 100,
      'background.blur': (value) => Number.isInteger(value) && value >= 0 && value <= 100,
      'background.opacity': (value) => Number.isInteger(value) && value >= 0 && value <= 100
    };
  }

  /**
   * Get config value by path
   * @param {string} path - Dot-separated path (e.g., 'display.compactMode')
   * @returns {*} Config value
   */
  get(path) {
    return this.getNestedValue(this.config, path);
  }

  /**
   * Get entire config object
   * @returns {Object} Config object
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Update config values
   * @param {Object} updates - Updates to apply
   * @param {boolean} [save=true] - Save to storage
   * @returns {Promise<Object>} Validation results
   */
  async update(updates, save = true) {
    const results = {
      success: true,
      updated: [],
      failed: []
    };

    for (const [path, value] of Object.entries(updates)) {
      try {
        // Validate
        if (!this.validate(path, value)) {
          results.failed.push({ path, value, error: 'Validation failed' });
          results.success = false;
          continue;
        }

        // Update
        this.setNestedValue(this.config, path, value);
        results.updated.push(path);
      } catch (error) {
        results.failed.push({ path, value, error: error.message });
        results.success = false;
      }
    }

    if (save && results.updated.length > 0) {
      await this.save();
    }

    return results;
  }

  /**
   * Reset to default config
   * @param {string[]} [paths] - Specific paths to reset, or all if undefined
   * @returns {Promise<void>}
   */
  async reset(paths) {
    if (!paths) {
      // Reset everything
      this.config = this.getDefaultConfig();
    } else {
      // Reset specific paths
      const defaults = this.getDefaultConfig();
      paths.forEach(path => {
        const defaultValue = this.getNestedValue(defaults, path);
        this.setNestedValue(this.config, path, defaultValue);
      });
    }

    await this.save();
  }

  /**
   * Save config to storage
   * @returns {Promise<void>}
   */
  async save() {
    try {
      await this.storage.set({ config: this.config });
    } catch (error) {
      console.error('[ConfigManager] Error saving config:', error);
      throw error;
    }
  }

  /**
   * Validate config value
   * @private
   * @param {string} path - Config path
   * @param {*} value - Value to validate
   * @returns {boolean} Is valid
   */
  validate(path, value) {
    // Check direct validators
    if (this.validators[path]) {
      return this.validators[path](value);
    }

    // Check wildcard validators
    for (const [pattern, validator] of Object.entries(this.validators)) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '[^.]+') + '$');
        if (regex.test(path)) {
          return validator(value);
        }
      }
    }

    // No validator found - allow by default
    return true;
  }

  /**
   * Merge stored config with defaults
   * @private
   * @param {Object} stored - Stored config
   * @returns {Object} Merged config
   */
  mergeWithDefaults(stored) {
    const defaults = this.getDefaultConfig();
    return this.deepMerge(defaults, stored);
  }

  /**
   * Deep merge two objects
   * @private
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Get nested value from object by path
   * @private
   * @param {Object} obj - Object to get from
   * @param {string} path - Dot-separated path
   * @returns {*} Value
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object by path
   * @private
   * @param {Object} obj - Object to set in
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}
