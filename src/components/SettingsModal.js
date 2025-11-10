/**
 * @module SettingsModal
 * @description Settings modal for configuring dashboard and widgets
 * 
 * @example
 * const settings = new SettingsModal(app);
 * settings.open();
 */

import { BaseComponent } from './BaseComponent.js';
import { initIcons } from '../utils/icons.js';

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
      { id: 'general', label: 'General' },
      { id: 'widgets', label: 'Widgets' },
      { id: 'appearance', label: 'Appearance' },
      { id: 'about', label: 'About' }
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
    
    // Initialize Lucide icons
    initIcons();
    
    // Trigger animation by removing opacity-0 and scale-95, and adding proper classes
    setTimeout(() => {
      if (this.element) {
        this.element.classList.remove('opacity-0');
        this.element.classList.add('opacity-100');
        
        const modalContent = this.element.querySelector('.bg-dark-surface');
        if (modalContent) {
          modalContent.classList.remove('scale-95');
          modalContent.classList.add('scale-100');
        }
        
        console.log('[SettingsModal] Animation triggered');
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
          const action = actionElement.dataset.action;
          console.log('[SettingsModal] Action element found:', action);
          
          // Special handling for close-overlay - only close if clicked on overlay itself
          if (action === 'close-overlay') {
            if (event.target === overlay) {
              console.log('[SettingsModal] Clicked on overlay background, closing');
              this.close();
            }
            // Otherwise ignore - clicked inside modal content
            return;
          }
          
          // Handle other actions
          this.handleEvent(event);
          return;
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

    // Trigger close animation
    if (this.element) {
      this.element.classList.remove('opacity-100');
      this.element.classList.add('opacity-0');
      
      const modalContent = this.element.querySelector('.bg-dark-surface');
      if (modalContent) {
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
      }
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
    
    // Update tab UI - find buttons with data-action="switch-tab"
    const tabs = this.element?.querySelectorAll('[data-action="switch-tab"]');
    const contents = this.element?.querySelector('form#settings-form');
    
    console.log('[SettingsModal] Found tabs:', tabs?.length);
    console.log('[SettingsModal] Found content container:', contents);
    
    // Update active tab styling
    tabs?.forEach(tab => {
      if (tab.dataset.tab === tabId) {
        // Add active state
        tab.classList.remove('text-dark-muted', 'hover:bg-dark-elevated/50');
        tab.classList.add('bg-dark-elevated', 'text-primary-400', 'border-b-2', 'border-primary-500');
        console.log('[SettingsModal] Activated tab:', tabId);
      } else {
        // Remove active state
        tab.classList.remove('bg-dark-elevated', 'text-primary-400', 'border-b-2', 'border-primary-500');
        tab.classList.add('text-dark-muted', 'hover:bg-dark-elevated/50');
      }
    });
    
    // Update content - re-render the form content
    if (contents) {
      contents.innerHTML = this.renderTabContent();
      console.log('[SettingsModal] Content updated for tab:', tabId);
      
      // Initialize Lucide icons in new content
      initIcons();
    }
    
    this.emit('tab:changed', { tab: tabId });
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      // Get form data
      const form = this.element.querySelector('#settings-form');
      const formData = new FormData(form);
      const settings = {};

      console.log('[SettingsModal] Processing form data...');
      
      // Convert FormData to object
      for (const [key, value] of formData.entries()) {
        console.log('[SettingsModal] Form field:', key, '=', value);
        
        // Handle nested paths (e.g., "widget-weather-123.apiKey")
        const parts = key.split('.');
        let current = settings;
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        // Convert checkbox values from 'on' to true
        const finalValue = value === 'on' ? true : value;
        current[parts[parts.length - 1]] = finalValue;
      }

      // Handle unchecked checkboxes (they don't appear in FormData)
      // Find all checkboxes in the form and set false for unchecked ones
      const checkboxes = form.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        const name = checkbox.name;
        if (name && !checkbox.checked) {
          const parts = name.split('.');
          let current = settings;
          
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }
          
          current[parts[parts.length - 1]] = false;
        }
      });

      console.log('[SettingsModal] Parsed settings:', settings);
      console.log('[SettingsModal] Registered widgets:', Array.from(this.widgets.keys()));

      // Save to widgets
      for (const [widgetId, widgetSettings] of Object.entries(settings)) {
        console.log('[SettingsModal] Processing widget:', widgetId, 'with settings:', widgetSettings);
        
        const widget = this.widgets.get(widgetId);
        if (widget) {
          console.log('[SettingsModal] Found widget:', widget.name, 'Current settings:', widget.settings);
          
          // Merge with existing settings
          widget.settings = { ...widget.settings, ...widgetSettings };
          
          console.log('[SettingsModal] Updated settings:', widget.settings);
          
          // Save to storage - IMPORTANT: Use an object, not a string key!
          const storageKey = `widget.${widgetId}.settings`;
          const storageData = { [storageKey]: widget.settings };
          console.log('[SettingsModal] Saving to storage:', storageKey, '=', widget.settings);
          await this.app.storageManager.set(storageData);
          
          // Verify it was saved
          const verifyData = await this.app.storageManager.get([storageKey]);
          console.log('[SettingsModal] Verified saved data:', verifyData);
          
          // Trigger settings change
          if (widget.onSettingsChanged) {
            widget.onSettingsChanged(widget.settings, widget.settings);
          }
          
          // Reload widget data
          console.log('[SettingsModal] Reloading widget:', widget.name);
          await widget.loadData();
          
          // Refresh widget display
          widget.refresh();
        } else {
          console.warn('[SettingsModal] Widget not found:', widgetId);
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
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 opacity-0 transition-opacity duration-300" data-action="close-overlay">
        <div class="bg-dark-surface rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transform scale-95 transition-transform duration-300">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-dark-border">
            <h2 class="flex items-center gap-3 text-2xl font-bold text-dark-text">
              <i data-lucide="settings" class="w-6 h-6 text-primary-500"></i>
              Dashboard Settings
            </h2>
            <button class="p-2 rounded-lg hover:bg-dark-elevated text-dark-muted hover:text-dark-text transition-colors" data-action="close" title="Close (Esc)">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex gap-1 px-6 pt-4 border-b border-dark-border overflow-x-auto">
            ${this.tabs.map(tab => `
              <button 
                class="flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all ${
                  tab.id === this.currentTab 
                    ? 'bg-dark-elevated text-primary-400 border-b-2 border-primary-500' 
                    : 'text-dark-muted hover:text-dark-text hover:bg-dark-elevated/50'
                }"
                data-action="switch-tab"
                data-tab="${tab.id}"
              >
                <i data-lucide="${this.getTabIcon(tab.id)}" class="w-4 h-4"></i>
                <span class="font-medium">${tab.label}</span>
              </button>
            `).join('')}
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <form id="settings-form" class="space-y-6">
              ${this.renderTabContent()}
            </form>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 p-6 border-t border-dark-border bg-dark-bg">
            <button class="btn-secondary px-6 py-2.5 rounded-lg font-medium transition-colors" data-action="close">
              Cancel
            </button>
            <button class="btn-primary px-6 py-2.5 rounded-lg font-medium transition-colors" data-action="save">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get Lucide icon name for tab
   * @param {string} tabId - Tab ID
   * @returns {string} Lucide icon name
   */
  getTabIcon(tabId) {
    const icons = {
      general: 'settings',
      widgets: 'grid-2x2',
      appearance: 'palette',
      about: 'info'
    };
    return icons[tabId] || 'circle';
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
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-semibold text-dark-text mb-2">General Settings</h3>
          <p class="text-sm text-dark-muted">Configure global dashboard behavior</p>
        </div>

        <div class="space-y-2">
          <label class="block">
            <span class="block text-sm font-medium text-dark-text mb-1.5">Dashboard Name</span>
            <input 
              type="text" 
              class="w-full px-4 py-2.5 bg-dark-elevated border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
              name="general.name"
              value="My Dashboard"
              placeholder="Enter dashboard name"
            />
          </label>
          <p class="text-xs text-dark-muted mt-1">Customize your dashboard name</p>
        </div>

        <div class="space-y-2">
          <label class="block">
            <span class="block text-sm font-medium text-dark-text mb-1.5">Language</span>
            <select class="w-full px-4 py-2.5 bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" name="general.language">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </label>
        </div>

        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              name="general.animations"
              checked
              class="w-5 h-5 rounded border-dark-border text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 bg-dark-elevated"
            />
            <span class="text-sm font-medium text-dark-text group-hover:text-primary-400 transition-colors">Enable animations</span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              name="general.shortcuts"
              checked
              class="w-5 h-5 rounded border-dark-border text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 bg-dark-elevated"
            />
            <span class="text-sm font-medium text-dark-text group-hover:text-primary-400 transition-colors">Enable keyboard shortcuts</span>
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
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-semibold text-dark-text mb-2">Widget Settings</h3>
          <p class="text-sm text-dark-muted">Configure individual widget settings</p>
        </div>

        <div class="space-y-6">
          ${widgetsArray.map(widget => `
            <div class="p-6 bg-dark-elevated rounded-lg border border-dark-border space-y-4">
              <div class="flex items-center gap-3 pb-3 border-b border-dark-border">
                ${widget.icon}
                <h4 class="text-lg font-semibold text-dark-text">${widget.title}</h4>
              </div>

              ${this.renderWidgetSettings(widget)}
            </div>
          `).join('')}
        </div>
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
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block">
              <span class="block text-sm font-medium text-dark-text mb-1.5">OpenWeatherMap API Key</span>
              <input 
                type="text" 
                class="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                name="${widgetId}.apiKey"
                value="${settings.apiKey || ''}"
                placeholder="Enter your API key"
              />
            </label>
            <p class="text-xs text-dark-muted">
              Get a free API key from 
              <a href="https://openweathermap.org/api" target="_blank" class="text-primary-400 hover:text-primary-300 underline">OpenWeatherMap</a>
            </p>
          </div>

          <div class="space-y-2">
            <label class="block">
              <span class="block text-sm font-medium text-dark-text mb-1.5">Location</span>
              <input 
                type="text" 
                class="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                name="${widgetId}.location"
                value="${settings.location || ''}"
                placeholder="Leave empty for auto-detect"
              />
            </label>
            <p class="text-xs text-dark-muted">City name or leave empty for automatic detection</p>
          </div>

          <div class="space-y-2">
            <label class="block">
              <span class="block text-sm font-medium text-dark-text mb-1.5">Units</span>
              <select class="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" name="${widgetId}.units">
                <option value="metric" ${settings.units === 'metric' ? 'selected' : ''}>Metric (°C)</option>
                <option value="imperial" ${settings.units === 'imperial' ? 'selected' : ''}>Imperial (°F)</option>
              </select>
            </label>
          </div>

          <div>
            <label class="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                name="${widgetId}.showForecast"
                ${settings.showForecast ? 'checked' : ''}
                class="w-5 h-5 rounded border-dark-border text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 bg-dark-bg"
              />
              <span class="text-sm font-medium text-dark-text group-hover:text-primary-400 transition-colors">Show 5-day forecast</span>
            </label>
          </div>
        </div>
      `;
    } else if (widget.name === 'Clock') {
      return `
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block">
              <span class="block text-sm font-medium text-dark-text mb-1.5">Time Format</span>
              <select class="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" name="${widgetId}.format">
                <option value="24h" ${settings.format === '24h' ? 'selected' : ''}>24-hour</option>
                <option value="12h" ${settings.format === '12h' ? 'selected' : ''}>12-hour</option>
              </select>
            </label>
          </div>

          <div class="space-y-3">
            <label class="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                name="${widgetId}.showSeconds"
                ${settings.showSeconds ? 'checked' : ''}
                class="w-5 h-5 rounded border-dark-border text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 bg-dark-bg"
              />
              <span class="text-sm font-medium text-dark-text group-hover:text-primary-400 transition-colors">Show seconds</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                name="${widgetId}.showDate"
                ${settings.showDate ? 'checked' : ''}
                class="w-5 h-5 rounded border-dark-border text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 bg-dark-bg"
              />
              <span class="text-sm font-medium text-dark-text group-hover:text-primary-400 transition-colors">Show date</span>
            </label>
          </div>
        </div>
      `;
    } else if (widget.name === 'Search') {
      return `
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="block">
              <span class="block text-sm font-medium text-dark-text mb-1.5">Default Search Engine</span>
              <select class="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" name="${widgetId}.defaultEngine">
                <option value="google" ${settings.defaultEngine === 'google' ? 'selected' : ''}>Google</option>
                <option value="duckduckgo" ${settings.defaultEngine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
                <option value="bing" ${settings.defaultEngine === 'bing' ? 'selected' : ''}>Bing</option>
              </select>
            </label>
          </div>

          <div>
            <label class="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                name="${widgetId}.openInNewTab"
                ${settings.openInNewTab ? 'checked' : ''}
                class="w-5 h-5 rounded border-dark-border text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 bg-dark-bg"
              />
              <span class="text-sm font-medium text-dark-text group-hover:text-primary-400 transition-colors">Open results in new tab</span>
            </label>
          </div>
        </div>
      `;
    }

    return `<p class="text-sm text-dark-muted">No configurable settings for this widget</p>`;
  }

  /**
   * Render appearance settings tab
   * @returns {string} HTML string
   */
  renderAppearanceTab() {
    const currentTheme = this.app.configManager.get('theme.mode') || 'dark';

    return `
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-semibold text-dark-text mb-2">Appearance</h3>
          <p class="text-sm text-dark-muted">Customize the look and feel</p>
        </div>

        <div class="space-y-2">
          <label class="block">
            <span class="block text-sm font-medium text-dark-text mb-1.5">Theme</span>
            <select class="w-full px-4 py-2.5 bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" name="appearance.theme" data-action="change-theme">
              <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="auto" ${currentTheme === 'auto' ? 'selected' : ''}>Auto (System)</option>
            </select>
          </label>
        </div>

        <div class="space-y-2">
          <label class="block">
            <span class="block text-sm font-medium text-dark-text mb-1.5">Accent Color</span>
            <input 
              type="color" 
              class="w-full h-12 px-2 py-1 bg-dark-elevated border border-dark-border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
              name="appearance.accentColor"
              value="#3b82f6"
            />
          </label>
        </div>

        <div class="space-y-2">
          <label class="block">
            <span class="block text-sm font-medium text-dark-text mb-1.5">Background Effect</span>
            <select class="w-full px-4 py-2.5 bg-dark-elevated border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" name="appearance.background">
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
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-semibold text-dark-text mb-2">About Chrome Dashboard</h3>
        </div>
        
        <div class="flex flex-col items-center text-center space-y-6 py-6">
          <div class="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-xl">
            <i data-lucide="rocket" class="w-12 h-12 text-white"></i>
          </div>

          <div class="space-y-2">
            <p class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-full text-sm font-semibold">
              <i data-lucide="tag" class="w-4 h-4"></i>
              Version 2.0.0
            </p>
            <p class="text-dark-muted max-w-md mx-auto">
              A modern, productivity-focused Chrome extension that replaces your new tab 
              with a customizable dashboard.
            </p>
          </div>

          <div class="w-full max-w-md space-y-2">
            <a href="https://github.com/TheFakeCreator/chrome-dashboard" target="_blank" class="flex items-center justify-center gap-3 px-6 py-3 bg-dark-elevated hover:bg-dark-border border border-dark-border rounded-lg text-dark-text hover:text-primary-400 transition-all group">
              <i data-lucide="github" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
              <span class="font-medium">GitHub Repository</span>
            </a>
            <a href="#" class="flex items-center justify-center gap-3 px-6 py-3 bg-dark-elevated hover:bg-dark-border border border-dark-border rounded-lg text-dark-text hover:text-primary-400 transition-all group">
              <i data-lucide="book-open" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
              <span class="font-medium">Documentation</span>
            </a>
            <a href="#" class="flex items-center justify-center gap-3 px-6 py-3 bg-dark-elevated hover:bg-dark-border border border-dark-border rounded-lg text-dark-text hover:text-primary-400 transition-all group">
              <i data-lucide="bug" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
              <span class="font-medium">Report an Issue</span>
            </a>
          </div>

          <div class="pt-6 border-t border-dark-border space-y-1">
            <p class="text-dark-text font-medium">Made with <i data-lucide="heart" class="w-4 h-4 inline text-red-500 fill-current"></i> by TheFakeCreator</p>
            <p class="text-xs text-dark-muted">Licensed under MIT</p>
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

    if (action === 'close') {
      console.log('[SettingsModal] Closing modal via close button');
      this.close();
    } else if (action === 'close-overlay') {
      // Only close if clicked directly on the overlay (not on modal content)
      if (event.target === this.element) {
        console.log('[SettingsModal] Closing modal via overlay click');
        this.close();
      }
      // Otherwise ignore - clicked inside modal
      return;
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
      console.log('[SettingsModal] Changing theme to:', theme);
      // Emit theme change event through event bus
      this.app.eventBus.emit('theme:change', { theme: { mode: theme } });
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
