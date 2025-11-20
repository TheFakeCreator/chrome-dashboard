/**
 * @module App
 * @description Main application controller that initializes and coordinates all systems
 * 
 * @example
 * // Option 1: Import singleton instance (recommended)
 * import { app } from './core/App.js';
 * await app.init();
 * 
 * // Option 2: Instantiate a new App (advanced usage)
 * import { App } from './core/App.js';
 * const app = new App();
 * await app.init();
 */

import { EventBus } from './EventBus.js';
import { StateManager } from './StateManager.js';
import { StorageManager } from './StorageManager.js';
import { ConfigManager } from './ConfigManager.js';
import { GridManager } from './GridManager.js';
import { WidgetRegistry } from './WidgetRegistry.js';
import { WidgetPresets } from './WidgetPresets.js';
import { logger as log } from '../utils/logger.js';
const module = 'App';

export class App {
  constructor() {
    this.version = '2.0.0';
    this.initialized = false;
    
    // Core systems
    this.eventBus = null;
    this.stateManager = null;
    this.storageManager = null;
    this.configManager = null;
    this.gridManager = null;
    this.widgetRegistry = null;
    this.widgetPresets = null;
    
    // Components registry
    this.components = new Map();
    this.widgets = new Map();
    
    // Initialization promise
    this.initPromise = null;
  }

  /**
   * Initialize the application
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  /**
   * Internal initialization
   * @private
   * @returns {Promise<void>}
   */
  async _init() {
    try {
      log.info(module, 'Initializing Chrome Dashboard v' + this.version);

      // Phase 1: Initialize core systems
      await this.initCoreSystems();

      // Phase 2: Load configuration
      await this.loadConfiguration();

      // Phase 3: Initialize state
      await this.initializeState();

      // Phase 4: Setup event listeners
      this.setupEventListeners();

      // Phase 5: Apply theme
      await this.applyTheme();

      // Phase 6: Initialize widget system
      await this.initWidgetSystem();

      // Phase 7: Load user data
      await this.loadUserData();

      this.initialized = true;
      this.eventBus.emit('app:initialized');
      
      log.info(module, 'Initialization complete');
    } catch (error) {
      log.error(module, 'Initialization failed:', error);
      this.eventBus.emit('app:error', { error, phase: 'initialization' });
      throw error;
    }
  }

  /**
   * Initialize core systems
   * @private
   * @returns {Promise<void>}
   */
  async initCoreSystems() {
    log.info(module, 'Initializing core systems...');

    // EventBus - First, as other systems depend on it
    this.eventBus = new EventBus();
    this.eventBus.setDebug(false); // Enable in dev mode

    // StateManager
    this.stateManager = new StateManager(this.eventBus);

    // StorageManager
    this.storageManager = new StorageManager();

    // ConfigManager
    this.configManager = new ConfigManager(this.storageManager);
    await this.configManager.init();

    log.info(module, 'Core systems initialized');
  }

  /**
   * Load configuration
   * @private
   * @returns {Promise<void>}
   */
  async loadConfiguration() {
    log.info(module, 'Loading configuration...');

    const config = this.configManager.getAll();
    
    // Update state with config
    this.stateManager.update({
      'settings.theme': config.theme,
      'settings.compactMode': config.display.compactMode,
      'settings.animations': config.display.animations,
      'settings.notifications': config.notifications.enabled
    });

    log.info(module, 'Configuration loaded');
  }

  /**
   * Initialize application state
   * @private
   * @returns {Promise<void>}
   */
  async initializeState() {
    log.info(module, 'Initializing state...');

    // Set default state
    this.stateManager.set('app', {
      version: this.version,
      initialized: true,
      firstRun: this.configManager.get('firstRun'),
      online: navigator.onLine,
      visible: document.visibilityState === 'visible'
    });

    // Track online status
    window.addEventListener('online', () => {
      this.stateManager.set('app.online', true);
      this.eventBus.emit('app:online');
    });

    window.addEventListener('offline', () => {
      this.stateManager.set('app.online', false);
      this.eventBus.emit('app:offline');
    });

    // Track visibility
    document.addEventListener('visibilitychange', () => {
      const visible = document.visibilityState === 'visible';
      this.stateManager.set('app.visible', visible);
      this.eventBus.emit('app:visibility', { visible });
    });

    log.info(module, 'State initialized');
  }

  /**
   * Setup global event listeners
   * @private
   */
  setupEventListeners() {
    log.info(module, 'Setting up event listeners...');

    // Config changes
    this.eventBus.on('config:update', async ({ path, value }) => {
      await this.configManager.update({ [path]: value });
      this.eventBus.emit('config:updated', { path, value });
    });

    // Theme changes
    this.eventBus.on('theme:change', async ({ theme }) => {
      await this.configManager.update({ theme });
      await this.applyTheme();
    });

    // Storage changes
    this.storageManager.onChange((changes, areaName) => {
      this.eventBus.emit('storage:changed', { changes, areaName });
    });

    // State persistence
    this.stateManager.subscribe('settings', (value) => {
      this.saveSettings(value);
    });

    // Error handling
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'window');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'promise');
    });

    log.info(module, 'Event listeners setup complete');
  }

  /**
   * Apply theme to document
   * @private
   * @returns {Promise<void>}
   */
  async applyTheme() {
    const theme = this.configManager.get('theme');
    let appliedTheme = theme;

    if (theme === 'auto') {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      appliedTheme = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', appliedTheme);
    this.stateManager.set('settings.activeTheme', appliedTheme);
    
    log.info(module, 'Theme applied:', appliedTheme);
  }

  /**
   * Initialize widget system
   * @private
   * @returns {Promise<void>}
   */
  async initWidgetSystem() {
    log.info(module, 'Initializing widget system...');

    // Initialize widget registry
    this.widgetRegistry = new WidgetRegistry(this);

    // Initialize grid manager
    const gridContainer = document.getElementById('dashboard-grid') || 
                          document.querySelector('.dashboard-grid') ||
                          null;

    this.gridManager = new GridManager(this, {
      container: gridContainer
    });

    await this.gridManager.init();

    // Initialize widget presets
    this.widgetPresets = new WidgetPresets(this);
    await this.widgetPresets.init();

    // Register default widgets
    await this.registerDefaultWidgets();

    log.info(module, 'Widget system initialized');
  }

  /**
   * Register default widgets
   * @private
   * @returns {Promise<void>}
   */
  async registerDefaultWidgets() {
    log.info(module, 'Registering default widgets...');

    // Import and register widgets
    try {
      // Import widget classes dynamically
      const { ClockWidget } = await import('../widgets/ClockWidget.js');
      const { WeatherWidget } = await import('../widgets/WeatherWidget.js');
      const { SearchWidget } = await import('../widgets/SearchWidget.js');
      const { QuickLinksWidget } = await import('../widgets/QuickLinksWidget.js');
      const { ExtensionControlWidget } = await import('../widgets/ExtensionControlWidget.js');
      const { FocusWidget } = await import('../widgets/FocusWidget.js');

      // Register clock widget
      this.widgetRegistry.register('clock', ClockWidget, {
        title: 'Clock',
        icon: '🕐',
        description: 'Display current time and date',
        category: 'time',
        defaultLayout: { width: 2, height: 1 }
      });

      // Register weather widget
      this.widgetRegistry.register('weather', WeatherWidget, {
        title: 'Weather',
        icon: '🌤️',
        description: 'Current weather conditions',
        category: 'time',
        defaultLayout: { width: 2, height: 1 }
      });

      // Register search widget
      this.widgetRegistry.register('search', SearchWidget, {
        title: 'Search',
        icon: '🔍',
        description: 'Universal search across the web',
        category: 'productivity',
        defaultLayout: { width: 12, height: 1 }
      });

      // Register quick links widget
      this.widgetRegistry.register('quicklinks', QuickLinksWidget, {
        title: 'Quick Links',
        icon: '🔗',
        description: 'Access your favorite websites quickly',
        category: 'navigation',
        defaultLayout: { width: 12, height: 2 }
      });

      // Register extension control widget
      this.widgetRegistry.register('extensions', ExtensionControlWidget, {
        title: 'Extensions',
        icon: '🔌',
        description: 'Manage Chrome extensions',
        category: 'utilities',
        defaultLayout: { width: 4, height: 3 }
      });

      // Register focus widget
      this.widgetRegistry.register('focus', FocusWidget, {
        title: 'Focus Mode',
        icon: '🍅',
        description: 'Pomodoro timer and focus sessions',
        category: 'productivity',
        defaultLayout: { width: 3, height: 2 }
      });

      log.info(module, 'Default widgets registered');
    } catch (error) {
      log.error(module, 'Error registering widgets:', error);
    }
  }

  /**
   * Load user data from storage
   * @private
   * @returns {Promise<void>}
   */
  async loadUserData() {
    log.info(module, 'Loading user data...');

    try {
      const userData = await this.storageManager.get([
        'widgets',
        'layout',
        'user'
      ]);

      if (userData.widgets) {
        this.stateManager.set('widgets', userData.widgets);
      }

      if (userData.layout) {
        this.stateManager.set('layout', userData.layout);
      }

      if (userData.user) {
        this.stateManager.set('user', userData.user);
      }

      log.info(module, 'User data loaded');
    } catch (error) {
      log.error(module, 'Error loading user data:', error);
    }
  }

  /**
   * Save settings to storage
   * @private
   * @param {Object} settings - Settings to save
   */
  async saveSettings(settings) {
    try {
      await this.storageManager.set({ settings });
    } catch (error) {
      log.error(module, 'Error saving settings:', error);
    }
  }

  /**
   * Register a component
   * @param {string} name - Component name
   * @param {Object} component - Component instance
   */
  registerComponent(name, component) {
    if (this.components.has(name)) {
      log.warn(module, `Component '${name}' already registered`);
      return;
    }

    this.components.set(name, component);
    log.info(module, `Component registered: ${name}`);
  }

  /**
   * Unregister a component
   * @param {string} name - Component name
   */
  unregisterComponent(name) {
    const component = this.components.get(name);
    if (component && typeof component.destroy === 'function') {
      component.destroy();
    }
    this.components.delete(name);
    log.info(module, `Component unregistered: ${name}`);
  }

  /**
   * Get a component by name
   * @param {string} name - Component name
   * @returns {Object|undefined} Component instance
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /**
   * Register a widget
   * @param {string} id - Widget ID
   * @param {Object} widget - Widget instance
   */
  registerWidget(id, widget) {
    if (this.widgets.has(id)) {
      log.warn(module, `Widget '${id}' already registered`);
      return;
    }

    this.widgets.set(id, widget);
    this.eventBus.emit('widget:registered', { id, widget });
    log.info(module, `Widget registered: ${id}`);
  }

  /**
   * Unregister a widget
   * @param {string} id - Widget ID
   */
  unregisterWidget(id) {
    const widget = this.widgets.get(id);
    if (widget && typeof widget.destroy === 'function') {
      widget.destroy();
    }
    this.widgets.delete(id);
    this.eventBus.emit('widget:unregistered', { id });
    log.info(module, `Widget unregistered: ${id}`);
  }

  /**
   * Get a widget by ID
   * @param {string} id - Widget ID
   * @returns {Object|undefined} Widget instance
   */
  getWidget(id) {
    return this.widgets.get(id);
  }

  /**
   * Get all widgets
   * @returns {Map} Widgets map
   */
  getAllWidgets() {
    return new Map(this.widgets);
  }

  /**
   * Handle application errors
   * @private
   * @param {Error} error - Error object
   * @param {string} source - Error source
   */
  handleError(error, source) {
    log.error(module, `Error from ${source}:`, error);
    
    this.eventBus.emit('app:error', {
      error,
      source,
      timestamp: Date.now()
    });

    // Could show error notification to user
    // Could log to external service if analytics enabled
  }

  /**
   * Destroy the application
   */
  destroy() {
    log.info(module, 'Destroying application...');

    // Destroy all widgets
    this.widgets.forEach((widget, id) => {
      this.unregisterWidget(id);
    });

    // Destroy all components
    this.components.forEach((component, name) => {
      this.unregisterComponent(name);
    });

    // Clear event bus
    this.eventBus.clear();

    this.initialized = false;
    log.info(module, 'Application destroyed');
  }
}

// Export singleton instance
export const app = new App();
