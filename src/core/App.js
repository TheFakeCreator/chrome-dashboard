/**
 * @module App
 * @description Main application controller that initializes and coordinates all systems
 * 
 * @example
 * import { App } from './core/App.js';
 * 
 * const app = new App();
 * await app.init();
 */

import { EventBus } from './EventBus.js';
import { StateManager } from './StateManager.js';
import { StorageManager } from './StorageManager.js';
import { ConfigManager } from './ConfigManager.js';

export class App {
  constructor() {
    this.version = '2.0.0';
    this.initialized = false;
    
    // Core systems
    this.eventBus = null;
    this.stateManager = null;
    this.storageManager = null;
    this.configManager = null;
    
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
      console.log('[App] Initializing Chrome Dashboard v' + this.version);

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

      // Phase 6: Load user data
      await this.loadUserData();

      this.initialized = true;
      this.eventBus.emit('app:initialized');
      
      console.log('[App] Initialization complete');
    } catch (error) {
      console.error('[App] Initialization failed:', error);
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
    console.log('[App] Initializing core systems...');

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

    console.log('[App] Core systems initialized');
  }

  /**
   * Load configuration
   * @private
   * @returns {Promise<void>}
   */
  async loadConfiguration() {
    console.log('[App] Loading configuration...');

    const config = this.configManager.getAll();
    
    // Update state with config
    this.stateManager.update({
      'settings.theme': config.theme,
      'settings.compactMode': config.display.compactMode,
      'settings.animations': config.display.animations,
      'settings.notifications': config.notifications.enabled
    });

    console.log('[App] Configuration loaded');
  }

  /**
   * Initialize application state
   * @private
   * @returns {Promise<void>}
   */
  async initializeState() {
    console.log('[App] Initializing state...');

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

    console.log('[App] State initialized');
  }

  /**
   * Setup global event listeners
   * @private
   */
  setupEventListeners() {
    console.log('[App] Setting up event listeners...');

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

    console.log('[App] Event listeners setup complete');
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
    
    console.log('[App] Theme applied:', appliedTheme);
  }

  /**
   * Load user data from storage
   * @private
   * @returns {Promise<void>}
   */
  async loadUserData() {
    console.log('[App] Loading user data...');

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

      console.log('[App] User data loaded');
    } catch (error) {
      console.error('[App] Error loading user data:', error);
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
      console.error('[App] Error saving settings:', error);
    }
  }

  /**
   * Register a component
   * @param {string} name - Component name
   * @param {Object} component - Component instance
   */
  registerComponent(name, component) {
    if (this.components.has(name)) {
      console.warn(`[App] Component '${name}' already registered`);
      return;
    }

    this.components.set(name, component);
    console.log(`[App] Component registered: ${name}`);
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
    console.log(`[App] Component unregistered: ${name}`);
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
      console.warn(`[App] Widget '${id}' already registered`);
      return;
    }

    this.widgets.set(id, widget);
    this.eventBus.emit('widget:registered', { id, widget });
    console.log(`[App] Widget registered: ${id}`);
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
    console.log(`[App] Widget unregistered: ${id}`);
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
    console.error(`[App] Error from ${source}:`, error);
    
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
    console.log('[App] Destroying application...');

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
    console.log('[App] Application destroyed');
  }
}

// Export singleton instance
export const app = new App();
