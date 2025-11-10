/**
 * @module BaseWidget
 * @description Base class for all dashboard widgets with settings and state management
 * 
 * @example
 * class ClockWidget extends BaseWidget {
 *   constructor(app, options) {
 *     super(app, {
 *       ...options,
 *       name: 'Clock',
 *       icon: '🕐',
 *       description: 'Display current time'
 *     });
 *   }
 * 
 *   getDefaultSettings() {
 *     return {
 *       format: '24h',
 *       showSeconds: false
 *     };
 *   }
 * 
 *   render() {
 *     const time = new Date().toLocaleTimeString();
 *     return `<div class="clock-widget">${time}</div>`;
 *   }
 * }
 */

import { BaseComponent } from '../components/BaseComponent.js';
import { initIcons } from '../utils/icons.js';

export class BaseWidget extends BaseComponent {
  /**
   * @param {Object} app - App instance
   * @param {Object} options - Widget options
   */
  constructor(app, options = {}) {
    super(app, {
      autoMount: false, // Widgets don't auto-mount
      autoRender: false, // Widgets render on demand
      ...options
    });

    // Widget metadata
    this.widgetId = options.widgetId || this.generateWidgetId();
    this.title = options.title || this.name;
    this.icon = options.icon || '📦';
    this.description = options.description || '';
    this.category = options.category || 'general';
    this.version = options.version || '1.0.0';

    // Widget state
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.visible = options.visible !== undefined ? options.visible : true;
    this.loading = false;
    this.error = null;

    // Widget settings
    this.settings = this.mergeSettings(
      this.getDefaultSettings(),
      options.settings || {}
    );

    // Widget layout
    this.layout = {
      row: options.row || 0,
      col: options.col || 0,
      width: options.width || 1,
      height: options.height || 1,
      minWidth: options.minWidth || 1,
      minHeight: options.minHeight || 1,
      maxWidth: options.maxWidth || 12,
      maxHeight: options.maxHeight || 12
    };

    // Widget data
    this.data = null;
    this.lastUpdate = null;
    this.updateInterval = options.updateInterval || null;
    this.updateTimer = null;

    // Register widget with app
    if (this.app) {
      this.app.registerWidget(this.widgetId, this);
    }
  }

  /**
   * Generate unique widget ID
   * @private
   * @returns {string} Widget ID
   */
  generateWidgetId() {
    return `widget-${this.name.toLowerCase()}-${Date.now()}`;
  }

  /**
   * Get default widget settings (override in subclass)
   * @returns {Object} Default settings
   */
  getDefaultSettings() {
    return {};
  }

  /**
   * Merge default settings with user settings
   * @private
   * @param {Object} defaults - Default settings
   * @param {Object} user - User settings
   * @returns {Object} Merged settings
   */
  mergeSettings(defaults, user) {
    return { ...defaults, ...user };
  }

  /**
   * Lifecycle: Widget initialized
   */
  onInit() {
    // Subscribe to widget state in global state
    this.subscribeToWidgetState();

    // Don't load data here - wait until mount when settings are properly set
    // this.loadData(); // Moved to onMount

    // Setup auto-update if interval specified
    if (this.updateInterval) {
      this.setupAutoUpdate();
    }
  }

  /**
   * Subscribe to widget state changes
   * @private
   */
  subscribeToWidgetState() {
    this.subscribe(`widgets.${this.widgetId}`, (widgetState) => {
      if (widgetState) {
        this.updateFromState(widgetState);
      }
    });
  }

  /**
   * Update widget from state
   * @private
   * @param {Object} widgetState - Widget state
   */
  updateFromState(widgetState) {
    if (widgetState.enabled !== undefined) {
      this.enabled = widgetState.enabled;
    }
    if (widgetState.visible !== undefined) {
      this.visible = widgetState.visible;
    }
    if (widgetState.settings) {
      this.settings = this.mergeSettings(this.settings, widgetState.settings);
    }
    if (widgetState.layout) {
      this.layout = { ...this.layout, ...widgetState.layout };
    }

    this.refresh();
  }

  /**
   * Save widget state to storage
   * @private
   */
  async saveWidgetState() {
    const widgetState = {
      widgetId: this.widgetId,
      name: this.name,
      enabled: this.enabled,
      visible: this.visible,
      settings: this.settings,
      layout: this.layout
    };

    try {
      await this.state.set(`widgets.${this.widgetId}`, widgetState);
      this.emit('state-saved', widgetState);
    } catch (error) {
      console.error(`[${this.name}] Error saving widget state:`, error);
      this.error = error;
    }
  }

  /**
   * Load widget data (override in subclass)
   * @returns {Promise<void>}
   */
  async loadData() {
    // Override in subclass
  }

  /**
   * Refresh widget data
   * @returns {Promise<void>}
   */
  async refreshData() {
    if (this.loading) {
      return;
    }

    this.setLoading(true);
    this.error = null;

    try {
      await this.loadData();
      this.lastUpdate = Date.now();
      this.emit('data-loaded', this.data);
    } catch (error) {
      console.error(`[${this.name}] Error loading data:`, error);
      this.error = error;
      this.emit('data-error', error);
    } finally {
      this.setLoading(false);
    }

    this.refresh();
  }

  /**
   * Setup auto-update timer
   * @private
   */
  setupAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = this.setInterval(() => {
      if (this.enabled && this.visible && !this.loading) {
        this.refreshData();
      }
    }, this.updateInterval);
  }

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.loading = loading;
    this.emit('loading-changed', loading);
  }

  /**
   * Update widget settings
   * @param {Object} newSettings - New settings
   * @returns {Promise<void>}
   */
  async updateSettings(newSettings) {
    const oldSettings = { ...this.settings };
    this.settings = this.mergeSettings(this.settings, newSettings);

    // Call settings changed handler
    this.onSettingsChanged(oldSettings, this.settings);

    // Save to state
    await this.saveWidgetState();

    // Refresh widget
    this.refresh();

    this.emit('settings-changed', { old: oldSettings, new: this.settings });
  }

  /**
   * Settings changed handler (override in subclass)
   * @param {Object} oldSettings - Old settings
   * @param {Object} newSettings - New settings
   */
  onSettingsChanged(oldSettings, newSettings) {
    // Override in subclass
  }

  /**
   * Update widget layout
   * @param {Object} newLayout - New layout
   * @returns {Promise<void>}
   */
  async updateLayout(newLayout) {
    const oldLayout = { ...this.layout };
    this.layout = { ...this.layout, ...newLayout };

    // Save to state
    await this.saveWidgetState();

    this.emit('layout-changed', { old: oldLayout, new: this.layout });
  }

  /**
   * Enable widget
   * @returns {Promise<void>}
   */
  async enable() {
    if (this.enabled) return;

    this.enabled = true;
    await this.saveWidgetState();
    this.refresh();
    this.emit('enabled');
  }

  /**
   * Disable widget
   * @returns {Promise<void>}
   */
  async disable() {
    if (!this.enabled) return;

    this.enabled = false;
    await this.saveWidgetState();
    this.refresh();
    this.emit('disabled');
  }

  /**
   * Show widget
   * @returns {Promise<void>}
   */
  async show() {
    if (this.visible) return;

    this.visible = true;
    await this.saveWidgetState();
    
    if (this.element) {
      this.element.style.display = '';
    }
    
    this.emit('shown');
  }

  /**
   * Hide widget
   * @returns {Promise<void>}
   */
  async hide() {
    if (!this.visible) return;

    this.visible = false;
    await this.saveWidgetState();
    
    if (this.element) {
      this.element.style.display = 'none';
    }
    
    this.emit('hidden');
  }

  /**
   * Render widget (override in subclass)
   * @returns {string} HTML string
   */
  render() {
    // Build widget container
    const classes = [
      'widget',
      `widget-${this.name.toLowerCase()}`,
      this.loading ? 'widget-loading' : '',
      this.error ? 'widget-error' : '',
      !this.enabled ? 'widget-disabled' : '',
      !this.visible ? 'widget-hidden' : ''
    ].filter(Boolean).join(' ');

    const style = `
      grid-row: span ${this.layout.height};
      grid-column: span ${this.layout.width};
    `;

    return `
      <div class="${classes}" style="${style}" data-widget-id="${this.widgetId}">
        <div class="widget-header flex items-center justify-between mb-4 pb-4 border-b border-dark-border">
          <div class="flex items-center gap-2">
            <span class="widget-icon">${this.icon}</span>
            <h3 class="widget-title text-lg font-semibold text-dark-text">${this.title}</h3>
          </div>
          <div class="widget-actions flex items-center gap-1">
            ${this.renderActions()}
          </div>
        </div>
        <div class="widget-body">
          ${this.loading ? this.renderLoading() : ''}
          ${this.error ? this.renderError() : ''}
          ${!this.loading && !this.error ? this.renderContent() : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render widget actions (override to add custom actions)
   * @returns {string} HTML string
   */
  renderActions() {
    return `
      <button class="widget-action widget-refresh p-1.5 rounded hover:bg-dark-elevated transition-colors" title="Refresh" aria-label="Refresh widget">
        <i data-lucide="refresh-cw" class="w-4 h-4 text-dark-muted"></i>
      </button>
      <button class="widget-action widget-settings p-1.5 rounded hover:bg-dark-elevated transition-colors" title="Settings" aria-label="Widget settings">
        <i data-lucide="settings" class="w-4 h-4 text-dark-muted"></i>
      </button>
    `;
  }

  /**
   * Render widget content (MUST override in subclass)
   * @returns {string} HTML string
   */
  renderContent() {
    return `<p>Widget content goes here</p>`;
  }

  /**
   * Render loading state
   * @returns {string} HTML string
   */
  renderLoading() {
    return `
      <div class="widget-loading-state">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    `;
  }

  /**
   * Render error state
   * @returns {string} HTML string
   */
  renderError() {
    return `
      <div class="widget-error-state">
        <span class="error-icon">⚠️</span>
        <p class="error-message">${this.error?.message || 'An error occurred'}</p>
        <button class="btn-retry">Retry</button>
      </div>
    `;
  }

  /**
   * Lifecycle: Widget mounted
   */
  /**
   * Lifecycle: After render (override)
   */
  onAfterRender() {
    // Always initialize icons after rendering
    initIcons();
  }

  onMount() {
    // Setup event listeners
    this.setupEventListeners();
    
    // Load data now that settings are properly initialized
    if (!this.loading) {
      this.loadData();
    }
  }

  /**
   * Setup widget event listeners
   * @private
   */
  setupEventListeners() {
    // Refresh button
    const refreshBtn = this.$('.widget-refresh');
    if (refreshBtn) {
      this.on(refreshBtn, 'click', () => this.refreshData());
    }

    // Settings button
    const settingsBtn = this.$('.widget-settings');
    if (settingsBtn) {
      this.on(settingsBtn, 'click', () => this.openSettings());
    }

    // Retry button
    const retryBtn = this.$('.btn-retry');
    if (retryBtn) {
      this.on(retryBtn, 'click', () => this.refreshData());
    }
  }

  /**
   * Open widget settings
   */
  openSettings() {
    this.emit('open-settings', { widget: this });
    this.eventBus.emit('widget:open-settings', { widget: this });
  }

  /**
   * Get widget state for serialization
   * @returns {Object} Widget state
   */
  serialize() {
    return {
      widgetId: this.widgetId,
      name: this.name,
      title: this.title,
      icon: this.icon,
      enabled: this.enabled,
      visible: this.visible,
      settings: this.settings,
      layout: this.layout,
      lastUpdate: this.lastUpdate
    };
  }

  /**
   * Destroy widget
   */
  destroy() {
    // Clear update timer
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    // Unregister from app
    if (this.app) {
      this.app.unregisterWidget(this.widgetId);
    }

    // Call parent destroy
    super.destroy();
  }

  /**
   * Get widget info
   * @returns {Object} Widget info
   */
  getInfo() {
    return {
      ...super.getInfo(),
      widgetId: this.widgetId,
      title: this.title,
      icon: this.icon,
      category: this.category,
      enabled: this.enabled,
      visible: this.visible,
      loading: this.loading,
      error: this.error,
      lastUpdate: this.lastUpdate,
      settings: this.settings,
      layout: this.layout
    };
  }
}
