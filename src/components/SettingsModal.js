/**
 * @module SettingsModal
 * @description Settings modal for configuring dashboard and widgets
 * 
 * @example
 * const settings = new SettingsModal(app);
 * settings.open();
 */

import { BaseComponent } from './BaseComponent.js';

export class SettingsModal extends BaseComponent {
  constructor(app, options = {}) {
    super(app, {
      ...options,
      name: 'SettingsModal',
      autoMount: false,
      autoRender: false
    });

    this.isOpen = false;
    this.currentTab = 'general';
    this.widgets = new Map();
    
    // Available tabs
    this.tabs = [
      { id: 'general', label: 'General', icon: '⚙️' },
      { id: 'widgets', label: 'Widgets', icon: '🧩' },
      { id: 'appearance', label: 'Appearance', icon: '🎨' },
      { id: 'about', label: 'About', icon: 'ℹ️' }
    ];
  }

  /**
   * Register a widget for settings
   * @param {string} widgetId - Widget ID
   * @param {Object} widget - Widget instance
   */
  registerWidget(widgetId, widget) {
    this.widgets.set(widgetId, widget);
  }

  /**
   * Open settings modal
   * @param {string} tab - Tab to open (optional)
   */
  open(tab = null) {
    if (this.isOpen) return;

    console.log('[SettingsModal] Opening modal, tab:', tab);
    
    this.currentTab = tab || this.currentTab;
    this.isOpen = true;

    // If already mounted, just refresh, otherwise mount fresh
    if (this.mounted) {
      console.log('[SettingsModal] Already mounted, refreshing');
      this.refresh();
    } else {
      console.log('[SettingsModal] Mounting to body');
      this.mount(document.body);
    }
    
    console.log('[SettingsModal] Element after mount:', this.element);
    
    // Setup event listeners if element exists and handlers aren't set yet
    if (this.element && !this._listenersSetup) {
      console.log('[SettingsModal] Setting up event listeners');
      this.setupEventListeners();
      this._listenersSetup = true;
    }
    
    // Add show class for animation
    setTimeout(() => {
      if (this.element) {
        this.element.classList.add('show');
        console.log('[SettingsModal] Added show class');
      }
    }, 10);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    this.emit('modal:opened', { tab: this.currentTab });
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    if (!this.element) {
      console.warn('[SettingsModal] No element to setup listeners on');
      return;
    }

    console.log('[SettingsModal] Setting up event listeners on element');

    // The element itself IS the overlay, so use it directly
    const overlay = this.element;
    console.log('[SettingsModal] Using element as overlay:', overlay);
    
    if (!this._clickHandler) {
      this._clickHandler = (event) => {
        console.log('[SettingsModal] Click detected:', event.target);
        
        // Handle clicks on action buttons
        const actionElement = event.target.closest('[data-action]');
        if (actionElement) {
          console.log('[SettingsModal] Action element found:', actionElement.dataset.action);
          this.handleEvent(event);
          return;
        }

        // Handle clicks on overlay background (close modal)
        if (event.target === overlay) {
          console.log('[SettingsModal] Clicked on overlay background, closing');
          this.close();
        }
      };
      overlay.addEventListener('click', this._clickHandler);
      console.log('[SettingsModal] Click handler attached to overlay');
    }

    // Keyboard listener
    if (!this.keyboardHandler) {
      this.keyboardHandler = (event) => this.handleKeyboard(event);
      document.addEventListener('keydown', this.keyboardHandler);
      console.log('[SettingsModal] Keyboard handler attached');
    }
  }

  /**
   * Close settings modal
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;

    // Remove show class for animation
    if (this.element) {
      this.element.classList.remove('show');
    }

    // Unmount after animation
    setTimeout(() => {
      this.unmount();
      document.body.style.overflow = '';
    }, 300);

    this.emit('modal:closed');
  }

  /**
   * Switch tab
   * @param {string} tabId - Tab ID
   */
  switchTab(tabId) {
    if (this.currentTab === tabId) return;

    console.log('[SettingsModal] Switching from', this.currentTab, 'to', tabId);
    this.currentTab = tabId;
    
    // Update tab UI
    const tabs = this.element?.querySelectorAll('.settings-tab');
    const contents = this.element?.querySelector('.settings-content');
    
    console.log('[SettingsModal] Found tabs:', tabs?.length);
    console.log('[SettingsModal] Found content container:', contents);
    
    // Update active tab
    tabs?.forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
        console.log('[SettingsModal] Activated tab:', tabId);
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update content - just re-render the content area
    if (contents) {
      contents.innerHTML = `
        <form id="settings-form" class="settings-form">
          ${this.renderTabContent()}
        </form>
      `;
      console.log('[SettingsModal] Content updated for tab:', tabId);
    }
    
    this.emit('tab:changed', { tab: tabId });
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      // Get form data
      const formData = new FormData(this.element.querySelector('#settings-form'));
      const settings = {};

      // Convert FormData to object
      for (const [key, value] of formData.entries()) {
        // Handle nested paths (e.g., "weather.apiKey")
        const parts = key.split('.');
        let current = settings;
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
      }

      // Save to widgets
      for (const [widgetId, widgetSettings] of Object.entries(settings)) {
        const widget = this.widgets.get(widgetId);
        if (widget) {
          // Merge with existing settings
          widget.settings = { ...widget.settings, ...widgetSettings };
          
          // Trigger settings change
          widget.onSettingsChanged && widget.onSettingsChanged(widget.settings, widget.settings);
          
          // Reload widget data
          await widget.loadData();
        }
      }

      // Show success message
      this.showNotification('Settings saved successfully!', 'success');

      // Close modal after a short delay
      setTimeout(() => this.close(), 1000);

    } catch (error) {
      console.error('[SettingsModal] Error saving settings:', error);
      this.showNotification('Error saving settings', 'error');
    }
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  showNotification(message, type = 'info') {
    // Emit event for notification system
    this.emit('notification:show', { message, type });
    
    // Simple console log for now
    console.log(`[SettingsModal] ${type.toUpperCase()}: ${message}`);
  }

  /**
   * Render modal content
   * @returns {string} HTML string
   */
  render() {
    if (!this.isOpen) return '';

    return `
      <div class="settings-modal-overlay" data-action="close-overlay">
        <div class="settings-modal">
          <!-- Header -->
          <div class="settings-header">
            <h2 class="settings-title">
              <span class="title-icon">⚙️</span>
              Dashboard Settings
            </h2>
            <button class="btn-close" data-action="close" title="Close (Esc)">
              <span>✕</span>
            </button>
          </div>

          <!-- Tabs -->
          <div class="settings-tabs">
            ${this.tabs.map(tab => `
              <button 
                class="settings-tab ${tab.id === this.currentTab ? 'active' : ''}"
                data-action="switch-tab"
                data-tab="${tab.id}"
              >
                <span class="tab-icon">${tab.icon}</span>
                <span class="tab-label">${tab.label}</span>
              </button>
            `).join('')}
          </div>

          <!-- Content -->
          <div class="settings-content">
            <form id="settings-form">
              ${this.renderTabContent()}
            </form>
          </div>

          <!-- Footer -->
          <div class="settings-footer">
            <button class="btn btn-secondary" data-action="close">
              Cancel
            </button>
            <button class="btn btn-primary" data-action="save">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render current tab content
   * @returns {string} HTML string
   */
  renderTabContent() {
    switch (this.currentTab) {
      case 'general':
        return this.renderGeneralTab();
      case 'widgets':
        return this.renderWidgetsTab();
      case 'appearance':
        return this.renderAppearanceTab();
      case 'about':
        return this.renderAboutTab();
      default:
        return '<p>Tab not found</p>';
    }
  }

  /**
   * Render general settings tab
   * @returns {string} HTML string
   */
  renderGeneralTab() {
    return `
      <div class="settings-section">
        <h3 class="section-title">General Settings</h3>
        <p class="section-description">Configure global dashboard behavior</p>

        <div class="setting-group">
          <label class="setting-label">
            <span class="label-text">Dashboard Name</span>
            <input 
              type="text" 
              class="setting-input" 
              name="general.name"
              value="My Dashboard"
              placeholder="Enter dashboard name"
            />
          </label>
          <p class="setting-hint">Customize your dashboard name</p>
        </div>

        <div class="setting-group">
          <label class="setting-label">
            <span class="label-text">Language</span>
            <select class="setting-select" name="general.language">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </label>
        </div>

        <div class="setting-group">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              name="general.animations"
              checked
            />
            <span class="checkbox-label">Enable animations</span>
          </label>
        </div>

        <div class="setting-group">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              name="general.shortcuts"
              checked
            />
            <span class="checkbox-label">Enable keyboard shortcuts</span>
          </label>
        </div>
      </div>
    `;
  }

  /**
   * Render widgets settings tab
   * @returns {string} HTML string
   */
  renderWidgetsTab() {
    const widgetsArray = Array.from(this.widgets.values());

    return `
      <div class="settings-section">
        <h3 class="section-title">Widget Settings</h3>
        <p class="section-description">Configure individual widget settings</p>

        ${widgetsArray.map(widget => `
          <div class="widget-settings">
            <div class="widget-settings-header">
              <span class="widget-icon">${widget.icon}</span>
              <h4 class="widget-name">${widget.title}</h4>
            </div>

            ${this.renderWidgetSettings(widget)}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render settings for a specific widget
   * @param {Object} widget - Widget instance
   * @returns {string} HTML string
   */
  renderWidgetSettings(widget) {
    const widgetId = widget.widgetId;
    const settings = widget.settings || {};

    // Special handling for different widgets
    if (widget.name === 'Weather') {
      return `
        <div class="setting-group">
          <label class="setting-label">
            <span class="label-text">OpenWeatherMap API Key</span>
            <input 
              type="text" 
              class="setting-input" 
              name="${widgetId}.apiKey"
              value="${settings.apiKey || ''}"
              placeholder="Enter your API key"
            />
          </label>
          <p class="setting-hint">
            Get a free API key from 
            <a href="https://openweathermap.org/api" target="_blank">OpenWeatherMap</a>
          </p>
        </div>

        <div class="setting-group">
          <label class="setting-label">
            <span class="label-text">Location</span>
            <input 
              type="text" 
              class="setting-input" 
              name="${widgetId}.location"
              value="${settings.location || ''}"
              placeholder="Leave empty for auto-detect"
            />
          </label>
          <p class="setting-hint">City name or leave empty for automatic detection</p>
        </div>

        <div class="setting-group">
          <label class="setting-label">
            <span class="label-text">Units</span>
            <select class="setting-select" name="${widgetId}.units">
              <option value="metric" ${settings.units === 'metric' ? 'selected' : ''}>Metric (°C)</option>
              <option value="imperial" ${settings.units === 'imperial' ? 'selected' : ''}>Imperial (°F)</option>
            </select>
          </label>
        </div>

        <div class="setting-group">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              name="${widgetId}.showForecast"
              ${settings.showForecast ? 'checked' : ''}
            />
            <span class="checkbox-label">Show 5-day forecast</span>
          </label>
        </div>
      `;
    } else if (widget.name === 'Clock') {
      return `
        <div class="setting-group">
          <label class="setting-label">
            <span class="label-text">Time Format</span>
            <select class="setting-select" name="${widgetId}.format">
              <option value="24h" ${settings.format === '24h' ? 'selected' : ''}>24-hour</option>
              <option value="12h" ${settings.format === '12h' ? 'selected' : ''}>12-hour</option>
            </select>
          </label>
        </div>

        <div class="setting-group">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              name="${widgetId}.showSeconds"
              ${settings.showSeconds ? 'checked' : ''}
            />
            <span class="checkbox-label">Show seconds</span>
          </label>
        </div>

        <div class="setting-group">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              name="${widgetId}.showDate"
              ${settings.showDate ? 'checked' : ''}
            />
            <span class="checkbox-label">Show date</span>
          </label>
        </div>
      `;
    } else if (widget.name === 'Search') {
      return `
        <div class="setting-group">
          <label class="setting-label">
            <span class="label-text">Default Search Engine</span>
            <select class="setting-select" name="${widgetId}.defaultEngine">
              <option value="google" ${settings.defaultEngine === 'google' ? 'selected' : ''}>Google</option>
              <option value="duckduckgo" ${settings.defaultEngine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
              <option value="bing" ${settings.defaultEngine === 'bing' ? 'selected' : ''}>Bing</option>
            </select>
          </label>
        </div>

        <div class="setting-group">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              name="${widgetId}.openInNewTab"
              ${settings.openInNewTab ? 'checked' : ''}
            />
            <span class="checkbox-label">Open results in new tab</span>
          </label>
        </div>
      `;
    }

    return `<p class="setting-hint">No configurable settings for this widget</p>`;
  }

  /**
   * Render appearance settings tab
   * @returns {string} HTML string
   */
  renderAppearanceTab() {
    const currentTheme = this.app.configManager.get('theme.mode') || 'dark';

    return `
      <div class="settings-section">
        <h3 class="section-title">Appearance</h3>
        <p class="section-description">Customize the look and feel</p>

        <div class="setting-group">
          <label class="setting-label">
            <span class="label-text">Theme</span>
            <select class="setting-select" name="appearance.theme" data-action="change-theme">
              <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="auto" ${currentTheme === 'auto' ? 'selected' : ''}>Auto (System)</option>
            </select>
          </label>
        </div>

        <div class="setting-group">
          <label class="setting-label">
            <span class="label-text">Accent Color</span>
            <input 
              type="color" 
              class="setting-color" 
              name="appearance.accentColor"
              value="#3b82f6"
            />
          </label>
        </div>

        <div class="setting-group">
          <label class="setting-label">
            <span class="label-text">Background Effect</span>
            <select class="setting-select" name="appearance.background">
              <option value="none">None</option>
              <option value="gradient">Gradient</option>
              <option value="particles">Particles</option>
            </select>
          </label>
        </div>
      </div>
    `;
  }

  /**
   * Render about tab
   * @returns {string} HTML string
   */
  renderAboutTab() {
    return `
      <div class="settings-section">
        <h3 class="section-title">About Chrome Dashboard</h3>
        
        <div class="about-content">
          <div class="about-logo">
            <span style="font-size: 4rem;">🚀</span>
          </div>

          <div class="about-info">
            <p class="about-version">Version 2.0.0</p>
            <p class="about-description">
              A modern, productivity-focused Chrome extension that replaces your new tab 
              with a customizable dashboard.
            </p>
          </div>

          <div class="about-links">
            <a href="https://github.com/TheFakeCreator/chrome-dashboard" target="_blank" class="about-link">
              <span>🐙</span> GitHub Repository
            </a>
            <a href="#" class="about-link">
              <span>📝</span> Documentation
            </a>
            <a href="#" class="about-link">
              <span>🐛</span> Report an Issue
            </a>
          </div>

          <div class="about-credits">
            <p>Made with ❤️ by TheFakeCreator</p>
            <p class="about-license">Licensed under MIT</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Handle events
   * @param {Event} event - DOM event
   */
  handleEvent(event) {
    const actionElement = event.target.closest('[data-action]');
    const action = actionElement?.dataset.action;

    console.log('[SettingsModal] Event:', action, event.target);

    if (action === 'close' || action === 'close-overlay') {
      if (action === 'close-overlay' && event.target.classList.contains('settings-modal')) {
        return; // Don't close when clicking inside modal
      }
      console.log('[SettingsModal] Closing modal');
      this.close();
    } else if (action === 'switch-tab') {
      const tab = actionElement?.dataset.tab;
      console.log('[SettingsModal] Switching to tab:', tab);
      if (tab) this.switchTab(tab);
    } else if (action === 'save') {
      event.preventDefault();
      console.log('[SettingsModal] Saving settings');
      this.saveSettings();
    } else if (action === 'change-theme') {
      const theme = event.target.value;
      console.log('[SettingsModal] Changing theme:', theme);
      this.app.setTheme(theme);
    }
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyboard(event) {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  /**
   * Component mounted
   */
  onMount() {
    super.onMount();
    // Event listeners are set up in open() method instead
  }

  /**
   * Component destroyed
   */
  onDestroy() {
    // Remove keyboard listener
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }

    // Remove click handler
    if (this._clickHandler && this.element) {
      this.element.removeEventListener('click', this._clickHandler);
      this._clickHandler = null;
    }

    // Reset listeners flag
    this._listenersSetup = false;

    super.onDestroy();
  }
}
