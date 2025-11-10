/**
 * @file main.js
 * @description Main entry point for Chrome Dashboard v2.0
 * Initializes the application and handles the startup sequence
 */

import { app } from './core/App.js';

// DOM elements
let loadingEl;
let errorEl;
let headerEl;
let mainEl;
let footerEl;
let emptyStateEl;

/**
 * Initialize DOM references
 */
function initDOMReferences() {
  loadingEl = document.getElementById('loading');
  errorEl = document.getElementById('error');
  headerEl = document.getElementById('header');
  mainEl = document.getElementById('main');
  footerEl = document.getElementById('footer');
  emptyStateEl = document.getElementById('empty-state');
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
  
  if (headerEl) headerEl.style.display = 'block';
  if (mainEl) mainEl.style.display = 'block';
  if (footerEl) footerEl.style.display = 'block';
  
  // Show empty state if no widgets
  const widgetGrid = document.getElementById('widget-grid');
  const hasWidgets = widgetGrid && widgetGrid.children.length > 0;
  
  if (emptyStateEl) {
    emptyStateEl.style.display = hasWidgets ? 'none' : 'flex';
  }
}

/**
 * Hide dashboard
 */
function hideDashboard() {
  if (headerEl) headerEl.style.display = 'none';
  if (mainEl) mainEl.style.display = 'none';
  if (footerEl) footerEl.style.display = 'none';
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
      app.eventBus.emit('settings:open');
      // TODO: Open settings modal
    });
  }

  // Retry button
  const retryBtn = document.getElementById('btn-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Listen for app events
  app.eventBus.on('app:initialized', () => {
    console.log('[Main] App initialized successfully');
    showDashboard();
  });

  app.eventBus.on('app:error', ({ error }) => {
    console.error('[Main] App error:', error);
    showError(error.message || 'An unexpected error occurred');
  });

  // Listen for theme changes
  app.eventBus.on('config:updated', ({ path, value }) => {
    if (path === 'theme') {
      console.log('[Main] Theme changed to:', value);
    }
  });
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

    // Setup event listeners
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
    
    // Dashboard will be shown by the 'app:initialized' event
    
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
