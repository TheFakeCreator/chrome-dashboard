/**
 * @file main.js
 * @description Main entry point for Chrome Dashboard v2.0
 * Initializes the application and handles the startup sequence
 */

import { app } from './core/App.js';
import { PanelManager } from './core/PanelManager.js';
import { GestureDetector } from './core/GestureDetector.js';
import { ClockWidget } from './widgets/ClockWidget.js';
import { WeatherWidget } from './widgets/WeatherWidget.js';
import { SearchWidget } from './widgets/SearchWidget.js';
import { QuickLinksWidget } from './widgets/QuickLinksWidget.js';
import { ExtensionControlWidget } from './widgets/ExtensionControlWidget.js';
import { FocusWidget } from './widgets/FocusWidget.js';
import { SettingsModal } from './components/SettingsModal.js';
import { initIcons } from './utils/icons.js';

// DOM elements
let loadingEl;
let errorEl;
let panelContainerEl;
let headerActionsEl;
let panelIndicatorsEl;

// Panel System
let panelManager;
let gestureDetector;

/**
 * Initialize DOM references
 */
function initDOMReferences() {
  loadingEl = document.getElementById('loading');
  errorEl = document.getElementById('error');
  panelContainerEl = document.getElementById('panel-container');
  headerActionsEl = document.getElementById('header-actions');
  panelIndicatorsEl = document.getElementById('panel-indicators');
}

/**
 * Show loading screen
 */
function showLoading() {
  if (loadingEl) {
    loadingEl.style.display = 'flex';
  }
  hideError();
  hideDashboard();
}

/**
 * Hide loading screen
 */
function hideLoading() {
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
}

/**
 * Show error screen
 * @param {string} message - Error message
 */
function showError(message) {
  hideLoading();
  hideDashboard();
  
  if (errorEl) {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    errorEl.style.display = 'flex';
  }
}

/**
 * Hide error screen
 */
function hideError() {
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

/**
 * Show dashboard
 */
function showDashboard() {
  hideLoading();
  hideError();
  
  if (panelContainerEl) panelContainerEl.style.display = 'block';
  if (headerActionsEl) headerActionsEl.style.display = 'flex';
  if (panelIndicatorsEl) panelIndicatorsEl.style.display = 'block';
  
  // Initialize Lucide icons
  initIcons();
}

/**
 * Helper function to load widget settings from storage
 */
async function loadWidgetSettings(widgetId, defaultSettings) {
  try {
    // Build the storage key
    const storageKey = `widget.${widgetId}.settings`;
    
    // Try to get the settings from storage
    const result = await app.storageManager.get([storageKey]);
    
    if (result && result[storageKey]) {
      console.log('[Main] Loaded saved settings for', widgetId, ':', result[storageKey]);
      return { ...defaultSettings, ...result[storageKey] };
    }
    
    console.log('[Main] No saved settings found for', widgetId, ', using defaults');
    return defaultSettings;
  } catch (error) {
    console.error('[Main] Error loading widget settings:', error);
    return defaultSettings;
  }
}

/**
 * Initialize Panel System
 */
function initPanelSystem() {
  console.log('[Main] Initializing panel system...');
  
  // Create Panel Manager
  panelManager = new PanelManager({
    transitionDuration: 500, // Match gesture reset delay
    enabledPanels: ['center', 'top', 'bottom', 'left', 'right'],
    onPanelChange: (to, from) => {
      console.log('[Main] Panel changed:', from, '→', to);
      updatePanelIndicators();
    }
  });

  // Initialize with container
  const success = panelManager.initialize(panelContainerEl);
  if (!success) {
    console.error('[Main] Failed to initialize panel system');
    return false;
  }

  // Create Gesture Detector
  // Natural gestures: swipe DOWN pulls top panel down, swipe UP pulls bottom panel up
  gestureDetector = new GestureDetector({
    threshold: 100, // Higher threshold = more deliberate swipe needed
    velocity: 0.3,
    onSwipeUp: () => panelManager.navigateDirection('up'),      // Swipe up → go to bottom panel
    onSwipeDown: () => panelManager.navigateDirection('down'),  // Swipe down → go to top panel
    onSwipeLeft: () => panelManager.navigateDirection('left'),  // Swipe left → go to left panel
    onSwipeRight: () => panelManager.navigateDirection('right') // Swipe right → go to right panel
  });

  // Initialize gestures on viewport
  gestureDetector.initialize(panelContainerEl);

  // Setup keyboard shortcuts for panel navigation
  document.addEventListener('keydown', (event) => {
    // Alt + Arrow keys for panel navigation
    if (event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey) {
      let handled = false;
      let direction = '';
      
      switch (event.key) {
        case 'ArrowUp':
          direction = 'up';
          handled = panelManager.navigateDirection('up');
          break;
        case 'ArrowDown':
          direction = 'down';
          handled = panelManager.navigateDirection('down');
          break;
        case 'ArrowLeft':
          direction = 'left';
          handled = panelManager.navigateDirection('left');
          break;
        case 'ArrowRight':
          direction = 'right';
          handled = panelManager.navigateDirection('right');
          break;
      }
      
      if (direction) {
        event.preventDefault();
        console.log(`[Main] Keyboard: ${event.key} -> direction: ${direction}, handled: ${handled}, current panel: ${panelManager.getCurrentPanel()}`);
      }
    }
  });

  console.log('[Main] Panel system initialized successfully');
  console.log('[Main] Keyboard shortcuts: Alt + Arrow keys to navigate panels');
  return true;
}

/**
 * Update panel indicators UI
 */
function updatePanelIndicators() {
  if (!panelIndicatorsEl || !panelManager) return;

  const current = panelManager.getCurrentPanel();
  const available = panelManager.getAvailableDirections();

  const indicatorsContainer = panelIndicatorsEl.querySelector('div');
  if (!indicatorsContainer) return;

  // Build indicators HTML
  indicatorsContainer.innerHTML = `
    <div class="flex items-center gap-2 text-xs text-dark-muted">
      ${available.includes('up') ? '<i data-lucide="chevron-up" class="w-3 h-3"></i>' : ''}
      ${available.includes('left') ? '<i data-lucide="chevron-left" class="w-3 h-3"></i>' : ''}
      <div class="flex gap-1.5">
        <div class="panel-indicator ${current === 'left' ? 'active' : ''}"></div>
        <div class="panel-indicator ${current === 'center' ? 'active' : ''}"></div>
        <div class="panel-indicator ${current === 'right' ? 'active' : ''}"></div>
      </div>
      ${available.includes('right') ? '<i data-lucide="chevron-right" class="w-3 h-3"></i>' : ''}
      ${available.includes('down') ? '<i data-lucide="chevron-down" class="w-3 h-3"></i>' : ''}
    </div>
  `;

  // Re-initialize icons
  initIcons();
}

/**
 * Create and mount widgets
 */
async function createWidgets() {
  try {
    // Initialize Panel System first
    if (!initPanelSystem()) {
      throw new Error('Panel system initialization failed');
    }

    // Create Clock widget with fixed ID
    console.log('[Main] Creating Clock widget...');
    const clockWidgetId = 'widget-clock-main';
    const clockSettings = await loadWidgetSettings(clockWidgetId, {
      format: '24h',
      showSeconds: true,
      showDate: true,
      showDayOfWeek: true,
      showTimezone: false
    });
    
    const clockWidget = new ClockWidget(app, {
      widgetId: clockWidgetId,
      settings: clockSettings
    });

    // Create a row container for Clock and Weather
    const topRowContainer = document.createElement('div');
    topRowContainer.className = 'w-full grid grid-cols-2 gap-4 max-w-5xl';
    
    // Mount Clock to row container
    const clockContainer = document.createElement('div');
    clockContainer.className = 'w-full';
    clockWidget.mount(clockContainer);
    topRowContainer.appendChild(clockContainer);
    console.log('[Main] Clock widget mounted to top row');

    // Create Weather widget with fixed ID
    console.log('[Main] Creating Weather widget...');
    const weatherWidgetId = 'widget-weather-main';
    const weatherSettings = await loadWidgetSettings(weatherWidgetId, {
      apiKey: '', // User needs to add their own API key
      location: '',
      autoDetectLocation: true,
      units: 'metric',
      showForecast: true,
      showFeelsLike: true,
      showHumidity: true,
      showWind: true
    });
    
    const weatherWidget = new WeatherWidget(app, {
      widgetId: weatherWidgetId,
      settings: weatherSettings
    });

    // Mount Weather to row container (same row as Clock)
    const weatherContainer = document.createElement('div');
    weatherContainer.className = 'w-full';
    weatherWidget.mount(weatherContainer);
    topRowContainer.appendChild(weatherContainer);
    
    // Create main center panel container
    const centerPanelContainer = document.createElement('div');
    centerPanelContainer.className = 'w-full max-w-7xl mx-auto space-y-4';
    centerPanelContainer.id = 'center-panel-container';

    // Add top row (clock + weather) to center panel container
    centerPanelContainer.appendChild(topRowContainer);
    console.log('[Main] Weather widget added to center panel container');

    // Create Search widget with fixed ID
    console.log('[Main] Creating Search widget...');
    const searchWidgetId = 'widget-search-main';
    const searchSettings = await loadWidgetSettings(searchWidgetId, {
      defaultEngine: 'google',
      showSuggestions: false,
      openInNewTab: true,
      showEngineSelector: true,
      placeholder: 'Search the web...',
      quickEngines: ['google', 'youtube', 'github']
    });
    
    const searchWidget = new SearchWidget(app, {
      widgetId: searchWidgetId,
      settings: searchSettings
    });

    // Mount search widget full width
    const searchContainer = document.createElement('div');
    searchContainer.className = 'w-full';
    searchWidget.mount(searchContainer);
    centerPanelContainer.appendChild(searchContainer);
    
    console.log('[Main] Search widget added to center panel container');

    // Create Quick Links widget with fixed ID
    console.log('[Main] Creating Quick Links widget...');
    const quickLinksWidgetId = 'widget-quicklinks-main';
    const quickLinksSettings = await loadWidgetSettings(quickLinksWidgetId, {
      viewMode: 'grid',
      sortBy: 'manual',
      showUsageCount: false,
      iconsOnly: false,
      maxLinks: 50,
      gridColumns: 5,
      showCategories: false
    });
    
    const quickLinksWidget = new QuickLinksWidget(app, {
      widgetId: quickLinksWidgetId,
      settings: quickLinksSettings
    });

    // Mount to BOTTOM panel (for future carousel)
    const quickLinksContainer = document.createElement('div');
    quickLinksWidget.mount(quickLinksContainer);
    panelManager.mountWidget('bottom', quickLinksContainer, quickLinksWidget.widgetId);
    console.log('[Main] Quick Links widget mounted to bottom panel');

    // Create Extension Control widget with fixed ID
    console.log('[Main] Creating Extension Control widget...');
    const extensionControlWidgetId = 'widget-extension-control-main';
    const extensionControlSettings = await loadWidgetSettings(extensionControlWidgetId, {});
    
    const extensionControlWidget = new ExtensionControlWidget(app, {
      widgetId: extensionControlWidgetId,
      settings: extensionControlSettings
    });

    // Mount to TOP panel
    const extensionControlContainer = document.createElement('div');
    extensionControlContainer.className = 'w-full max-w-4xl';
    extensionControlWidget.mount(extensionControlContainer);
    panelManager.mountWidget('top', extensionControlContainer, extensionControlWidget.widgetId);
    console.log('[Main] Extension Control widget mounted to top panel');

    // Mount the complete center panel container
    panelManager.mountWidget('center', centerPanelContainer, 'center-panel-container');
    console.log('[Main] All center panel widgets mounted (clock, weather, search)');

    // Create Focus widget with fixed ID
    console.log('[Main] Creating Focus widget...');
    const focusWidgetId = 'widget-focus-main';
    const focusSettings = await loadWidgetSettings(focusWidgetId, {});
    
    const focusWidget = new FocusWidget(app, {
      widgetId: focusWidgetId,
      settings: focusSettings
    });

    // Mount Focus widget to LEFT panel
    const focusContainer = document.createElement('div');
    focusContainer.className = 'w-full';
    focusWidget.mount(focusContainer);
    panelManager.mountWidget('left', focusContainer, focusWidget.widgetId);
    console.log('[Main] Focus widget mounted to left panel');

    // Create Settings Modal
    console.log('[Main] Creating Settings Modal...');
    const settingsModal = new SettingsModal(app);
    
    // Register widgets with settings modal
    settingsModal.registerWidget(clockWidget.widgetId, clockWidget);
    settingsModal.registerWidget(weatherWidget.widgetId, weatherWidget);
    settingsModal.registerWidget(searchWidget.widgetId, searchWidget);
    settingsModal.registerWidget(quickLinksWidget.widgetId, quickLinksWidget);
    settingsModal.registerWidget(extensionControlWidget.widgetId, extensionControlWidget);
    settingsModal.registerWidget(focusWidget.widgetId, focusWidget);
    
    console.log('[Main] Settings Modal created');

    // Listen for widget configure events
    app.eventBus.on('widget:configure', ({ widgetId }) => {
      console.log('[Main] Opening settings for widget:', widgetId);
      settingsModal.open('widgets');
    });

    // Initialize panel indicators
    updatePanelIndicators();

    // Store references for debugging
    window.__widgets = {
      clock: clockWidget,
      weather: weatherWidget,
      search: searchWidget,
      quickLinks: quickLinksWidget,
      extensionControl: extensionControlWidget,
      focus: focusWidget
    };
    
    window.__settingsModal = settingsModal;
    window.__panelManager = panelManager;
    window.__gestureDetector = gestureDetector;

    // Auto-focus search input when possible
    // Note: Chrome prevents focus from being stolen from omnibox on new tabs (Ctrl+T)
    // Solution: Press Tab key once to focus the search input
    const focusSearchInput = () => {
      const searchInput = document.querySelector('.search-input');
      if (searchInput) {
        searchInput.focus();
      }
    };

    // Try on initial load (works on reload)
    setTimeout(focusSearchInput, 100);
    
    // Listen for window focus (when switching back to tab)
    window.addEventListener('focus', focusSearchInput);
    
    // Listen for visibility change (when tab becomes visible)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(focusSearchInput, 10);
      }
    });

  } catch (error) {
    console.error('[Main] Error creating widgets:', error);
  }
}

/**
 * Hide dashboard
 */
function hideDashboard() {
  if (panelContainerEl) panelContainerEl.style.display = 'none';
  if (headerActionsEl) headerActionsEl.style.display = 'none';
  if (panelIndicatorsEl) panelIndicatorsEl.style.display = 'none';
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
  // Theme toggle
  const themeBtn = document.getElementById('btn-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const currentTheme = app.configManager.get('theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      app.eventBus.emit('theme:change', { theme: newTheme });
    });
  }

  // Settings button
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      console.log('Settings button clicked');
      if (window.__settingsModal) {
        window.__settingsModal.open();
      }
      app.eventBus.emit('settings:open');
    });
  }

  // Retry button
  const retryBtn = document.getElementById('btn-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Note: App event listeners will be set up after app.init()
}

/**
 * Add some inline styles for loading/error screens
 */
function addInlineStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .loading-screen,
    .error-screen {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-background);
      z-index: 9999;
    }

    .loading-content,
    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      text-align: center;
      padding: var(--space-8);
    }

    .loading-content h2,
    .error-content h2 {
      color: var(--color-text-primary);
      margin: 0;
    }

    .loading-message,
    .error-content p {
      color: var(--color-text-secondary);
      margin: 0;
    }

    .error-icon {
      font-size: 4rem;
    }

    .dashboard-header {
      padding: var(--space-6) 0;
      border-bottom: var(--border-width-thin) solid var(--color-border);
      background: var(--glass-background);
      backdrop-filter: blur(var(--glass-blur));
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-6);
    }

    .brand-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary);
      margin: 0;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .dashboard-main {
      flex: 1;
      padding: var(--space-8) 0;
      min-height: calc(100vh - 200px);
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      padding: var(--space-12);
    }

    .empty-state-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      text-align: center;
      max-width: 400px;
    }

    .empty-icon {
      font-size: 5rem;
      opacity: 0.5;
    }

    .empty-state-content h2 {
      color: var(--color-text-primary);
      margin: 0;
    }

    .empty-state-content p {
      color: var(--color-text-secondary);
      margin: 0;
    }

    .dashboard-footer {
      padding: var(--space-6) 0;
      border-top: var(--border-width-thin) solid var(--color-border);
      background: var(--color-surface);
    }

    .footer-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
    }

    .footer-text {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    .footer-meta {
      color: var(--color-text-tertiary);
      font-size: var(--font-size-xs);
      margin: 0;
    }

    @media (max-width: 768px) {
      .footer-content {
        flex-direction: column;
        text-align: center;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Main initialization function
 */
async function initialize() {
  try {
    console.log('[Main] Starting Chrome Dashboard v2.0');
    console.log('[Main] Initialization sequence started');

    // Initialize DOM
    initDOMReferences();
    
    // Add inline styles
    addInlineStyles();
    
    // Show loading
    showLoading();

    // Setup UI event listeners (buttons, etc)
    setupEventListeners();

    // Initialize the app
    console.log('[Main] Initializing app core...');
    await app.init();

    console.log('[Main] App core initialized successfully');
    console.log('[Main] Core systems:');
    console.log('  - EventBus: ✓');
    console.log('  - StateManager: ✓');
    console.log('  - StorageManager: ✓');
    console.log('  - ConfigManager: ✓');

    // Log current state
    const currentTheme = app.configManager.get('theme');
    console.log(`[Main] Current theme: ${currentTheme}`);

    // Setup app event listeners (now that app is initialized)
    app.eventBus.on('app:error', ({ error }) => {
      console.error('[Main] App error:', error);
      showError(error.message || 'An unexpected error occurred');
    });

    app.eventBus.on('config:updated', ({ path, value }) => {
      if (path === 'theme') {
        console.log('[Main] Theme changed to:', value);
      }
    });

    // Create and mount widgets
    console.log('[Main] Creating widgets...');
    await createWidgets();
    
    // Show the dashboard
    showDashboard()
    
  } catch (error) {
    console.error('[Main] Initialization failed:', error);
    showError(error.message || 'Failed to initialize dashboard');
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for debugging
window.__dashboard = {
  app,
  version: '2.0.0-alpha'
};

console.log('[Main] Dashboard module loaded');
