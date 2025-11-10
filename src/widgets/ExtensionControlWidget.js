/**
 * ExtensionControlWidget
 * 
 * Mobile-style extension control center for managing Chrome extensions.
 * Allows quick enable/disable toggles, search, filtering, and profile management.
 */

import { BaseWidget } from './BaseWidget.js';
import { ExtensionCard } from '../components/ExtensionCard.js';
import extensionManager from '../services/ExtensionManager.js';

// Inline SVG icons
const ICONS = {
  puzzle: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.611a2.404 2.404 0 0 1-1.705.706 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/></svg>',
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  xCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  refreshCw: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
  searchX: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>'
};

export class ExtensionControlWidget extends BaseWidget {
  constructor(options = {}) {
    super(options);
    this.widgetId = 'extension-control';
    this.widgetName = 'Extension Control';
    
    // State
    this.extensions = [];
    this.filteredExtensions = [];
    this.extensionCards = new Map();
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.showDisabledOnly = false;
    
    // Extension manager instance
    this.manager = extensionManager;
    
    // Listeners
    this.unsubscribers = [];
  }

  /**
   * Load widget data (called by BaseWidget lifecycle)
   * @override
   */
  async loadData() {
    try {
      console.log('[ExtensionControlWidget] Loading data...');
      
      // Check if chrome.management API is available
      if (!chrome.management) {
        throw new Error('chrome.management API not available. Check manifest.json permissions.');
      }
      
      // Initialize extension manager
      await this.manager.initialize();
      console.log('[ExtensionControlWidget] Manager initialized');
      
      // Load extensions
      await this.loadExtensions();
      console.log('[ExtensionControlWidget] Extensions loaded:', this.extensions.length);
      
      // Setup listeners
      this._setupListeners();
      
      // Render the extension cards now that data is loaded
      console.log('[ExtensionControlWidget] Data loaded, rendering cards now');
      
      // Manually render the cards since the widget is already mounted
      this._renderExtensionCards();
      this._attachEventListeners();
      
      console.log('[ExtensionControlWidget] Data load complete');
    } catch (error) {
      console.error('[ExtensionControlWidget] Data load error:', error);
      this.error = error;
      this.showError('Failed to load Extension Control: ' + error.message);
    }
  }

  /**
   * Load all extensions
   */
  async loadExtensions() {
    try {
      console.log('[ExtensionControlWidget] Loading extensions...');
      const allExtensions = await this.manager.getAllExtensions();
      
      // Whitelist - only show these extensions
      const whitelist = ['Proton VPN', 'uBlock Origin', 'Dark Reader'];
      
      // Filter to only whitelisted extensions
      this.extensions = allExtensions.filter(ext => 
        whitelist.some(name => ext.name.toLowerCase().includes(name.toLowerCase()))
      );
      
      console.log('[ExtensionControlWidget] Loaded', this.extensions.length, 'whitelisted extensions:', this.extensions);
      this.filterExtensions();
      console.log('[ExtensionControlWidget] Filtered to', this.filteredExtensions.length, 'extensions');
    } catch (error) {
      console.error('[ExtensionControlWidget] Error loading extensions:', error);
    }
  }

  /**
   * Filter extensions based on search and category
   */
  filterExtensions() {
    let filtered = [...this.extensions];

    // Apply search filter
    if (this.searchQuery) {
      filtered = this.manager.searchExtensions(this.searchQuery);
    }

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      const categorized = this.manager.getCategorizedExtensions();
      filtered = filtered.filter(ext => 
        categorized[this.selectedCategory]?.some(e => e.id === ext.id)
      );
    }

    // Apply disabled filter
    if (this.showDisabledOnly) {
      filtered = filtered.filter(ext => !ext.enabled);
    }

    this.filteredExtensions = filtered;
    
    // Re-render the widget if it's already mounted
    if (this.element) {
      this.refresh();
    }
  }

  /**
   * Render widget content
   * @returns {string} HTML string
   */
  renderContent() {
    // Only show whitelisted extensions (add extension names here)
    const whitelist = ['Proton VPN', 'uBlock Origin', 'Dark Reader']; // Add more as needed
    
    return `
      <!-- Extension Tiles Grid (Mobile Style) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" data-extensions-list>
        <!-- Cards will be rendered here -->
      </div>
    `;
  }

  /**
   * Render category filter button
   * @private
   */
  _renderCategoryFilter(category, label, isDisabledFilter = false) {
    const isActive = isDisabledFilter ? 
      this.showDisabledOnly : 
      this.selectedCategory === category;
    
    return `
      <button
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          isActive ? 
          'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 
          'bg-dark-surface/40 text-dark-muted border border-dark-border/50 hover:border-primary-500/30'
        }"
        data-action="filter-category"
        data-category="${category}"
        ${isDisabledFilter ? 'data-disabled-filter' : ''}
      >
        ${label}
      </button>
    `;
  }

  /**
   * Render empty state
   * @private
   */
  _renderEmptyState() {
    return `
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="w-16 h-16 rounded-full bg-dark-surface/40 flex items-center justify-center mb-3">
          <span class="text-dark-muted">
            ${ICONS.searchX}
          </span>
        </div>
        <p class="text-dark-muted text-sm">
          ${this.searchQuery ? 'No extensions found' : 'No extensions to display'}
        </p>
        ${this.searchQuery ? `
          <button
            class="mt-2 text-primary-400 text-xs hover:underline"
            data-action="clear-search"
          >
            Clear search
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * Post-render actions
   */
  afterRender() {
    super.afterRender();
    console.log('[ExtensionControlWidget] afterRender called');
    console.log('[ExtensionControlWidget] Filtered extensions:', this.filteredExtensions.length);
    console.log('[ExtensionControlWidget] Element:', this.element);
    this._renderExtensionCards();
    this._attachEventListeners();
  }

  /**
   * Render extension cards
   * @private
   */
  _renderExtensionCards() {
    console.log('[ExtensionControlWidget] _renderExtensionCards called');
    const container = this.element.querySelector('[data-extensions-list]');
    console.log('[ExtensionControlWidget] Container found:', container);
    
    if (!container) {
      console.error('[ExtensionControlWidget] No container found with [data-extensions-list]');
      return;
    }

    // Clear existing cards
    container.innerHTML = '';
    this.extensionCards.clear();

    console.log('[ExtensionControlWidget] Rendering', this.filteredExtensions.length, 'extension cards');

    // Render each extension card
    this.filteredExtensions.forEach((extension, index) => {
      console.log(`[ExtensionControlWidget] Rendering card ${index + 1}:`, extension.name);
      
      const card = new ExtensionCard(extension, {
        app: this.app,
        onToggle: (id, ext) => this.handleToggleExtension(id, ext),
        onOptions: (id) => this.handleOpenOptions(id),
        onUninstall: (id) => this.handleUninstall(id)
      });

      const cardElement = card.render();
      console.log(`[ExtensionControlWidget] Card element created:`, cardElement);
      container.appendChild(cardElement);
      this.extensionCards.set(extension.id, card);
    });
    
    console.log('[ExtensionControlWidget] All cards rendered. Container children:', container.children.length);
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachEventListeners() {
    if (!this.element) return;

    // Search input
    const searchInput = this.element.querySelector('[data-search-input]');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.filterExtensions();
      });
    }

    // Clear search button
    const clearSearchBtns = this.element.querySelectorAll('[data-action="clear-search"]');
    clearSearchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.searchQuery = '';
        const input = this.element.querySelector('[data-search-input]');
        if (input) input.value = '';
        this.filterExtensions();
      });
    });

    // Category filter buttons
    const categoryBtns = this.element.querySelectorAll('[data-action="filter-category"]');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        const isDisabledFilter = btn.hasAttribute('data-disabled-filter');
        
        if (isDisabledFilter) {
          this.showDisabledOnly = !this.showDisabledOnly;
        } else {
          this.selectedCategory = category;
          this.showDisabledOnly = false;
        }
        
        this.filterExtensions();
      });
    });

    // Enable all button
    const enableAllBtn = this.element.querySelector('[data-action="enable-all"]');
    if (enableAllBtn) {
      enableAllBtn.addEventListener('click', () => this.handleEnableAll());
    }

    // Disable all button
    const disableAllBtn = this.element.querySelector('[data-action="disable-all"]');
    if (disableAllBtn) {
      disableAllBtn.addEventListener('click', () => this.handleDisableAll());
    }

    // Refresh button
    const refreshBtn = this.element.querySelector('[data-action="refresh"]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.handleRefresh());
    }
  }

  /**
   * Setup extension manager listeners
   * @private
   */
  _setupListeners() {
    // Listen for extension enabled
    const unsubEnabled = this.manager.on('enabled', (info) => {
      this.handleExtensionStateChange(info.id);
    });

    // Listen for extension disabled
    const unsubDisabled = this.manager.on('disabled', (info) => {
      this.handleExtensionStateChange(info.id);
    });

    // Listen for extension installed
    const unsubInstalled = this.manager.on('installed', () => {
      this.loadExtensions();
    });

    // Listen for extension uninstalled
    const unsubUninstalled = this.manager.on('uninstalled', () => {
      this.loadExtensions();
    });

    this.unsubscribers.push(unsubEnabled, unsubDisabled, unsubInstalled, unsubUninstalled);
  }

  /**
   * Handle extension state change
   */
  async handleExtensionStateChange(extensionId) {
    try {
      const updatedExtension = await this.manager.getExtension(extensionId);
      if (!updatedExtension) return;

      // Update local extensions array
      const index = this.extensions.findIndex(e => e.id === extensionId);
      if (index !== -1) {
        this.extensions[index] = updatedExtension;
      }

      // Update card if visible
      const card = this.extensionCards.get(extensionId);
      if (card) {
        card.update(updatedExtension);
      }

      // Update stats
      this.renderUpdate();
    } catch (error) {
      console.error('[ExtensionControlWidget] Error handling state change:', error);
    }
  }

  /**
   * Handle toggle extension
   */
  async handleToggleExtension(extensionId, extension) {
    try {
      // Check if this is a VPN extension
      const isVPN = extension && extension.name.toLowerCase().includes('vpn');
      
      if (isVPN) {
        // For VPN extensions, we need to guide the user to click the extension icon
        // Chrome security doesn't allow one extension to trigger another's popup
        
        if (!extension.enabled) {
          // If VPN is disabled, enable it first
          await this.manager.enableExtension(extensionId);
          
          // Show notification to click the VPN icon
          this.showNotification(
            'VPN Enabled',
            `${extension.name} is now enabled. Click its icon in the toolbar to connect.`,
            'info'
          );
        } else {
          // VPN is already enabled, try to open its options/popup page
          try {
            // Try to open the extension's options page in a new tab
            if (extension.optionsUrl) {
              await chrome.tabs.create({ url: extension.optionsUrl, active: true });
            } else {
              // If no options page, show a helpful message
              this.showNotification(
                'Manual Action Required',
                `Click the ${extension.name} icon in your toolbar to connect/disconnect.`,
                'info'
              );
            }
          } catch (error) {
            console.warn('[ExtensionControlWidget] Could not open options:', error);
            this.showNotification(
              'Manual Action Required',
              `Click the ${extension.name} icon in your toolbar to connect/disconnect.`,
              'info'
            );
          }
        }
      } else {
        // For non-VPN extensions, just toggle enabled state
        await this.manager.toggleExtension(extensionId);
      }
      
      // Reload extensions to update UI
      await this.loadExtensions();
      this._renderExtensionCards();
      this._attachEventListeners();
    } catch (error) {
      console.error('[ExtensionControlWidget] Error toggling extension:', error);
      this.showError('Failed to toggle extension');
    }
  }

  /**
   * Handle open extension options
   */
  async handleOpenOptions(extensionId) {
    try {
      await this.manager.openExtensionOptions(extensionId);
    } catch (error) {
      console.error('[ExtensionControlWidget] Error opening options:', error);
    }
  }

  /**
   * Handle uninstall extension
   */
  async handleUninstall(extensionId) {
    try {
      const extension = await this.manager.getExtension(extensionId);
      const confirmed = confirm(`Are you sure you want to uninstall "${extension.name}"?`);
      
      if (confirmed) {
        await this.manager.uninstallExtension(extensionId, { showConfirmDialog: false });
      }
    } catch (error) {
      console.error('[ExtensionControlWidget] Error uninstalling extension:', error);
      this.showError('Failed to uninstall extension');
    }
  }

  /**
   * Handle enable all extensions
   */
  async handleEnableAll() {
    try {
      const disabledIds = this.extensions
        .filter(ext => !ext.enabled)
        .map(ext => ext.id);
      
      await this.manager.enableExtensions(disabledIds);
    } catch (error) {
      console.error('[ExtensionControlWidget] Error enabling all:', error);
      this.showError('Failed to enable all extensions');
    }
  }

  /**
   * Handle disable all extensions
   */
  async handleDisableAll() {
    try {
      const confirmed = confirm('Disable all extensions? This may affect your browsing experience.');
      if (!confirmed) return;

      const enabledIds = this.extensions
        .filter(ext => ext.enabled)
        .map(ext => ext.id);
      
      await this.manager.disableExtensions(enabledIds);
    } catch (error) {
      console.error('[ExtensionControlWidget] Error disabling all:', error);
      this.showError('Failed to disable all extensions');
    }
  }

  /**
   * Handle refresh
   */
  async handleRefresh() {
    try {
      await this.loadExtensions();
      this.showSuccess('Extensions refreshed');
    } catch (error) {
      console.error('[ExtensionControlWidget] Error refreshing:', error);
      this.showError('Failed to refresh extensions');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    // TODO: Implement toast notification
    console.error(message);
    alert(message); // Simple fallback for now
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    // TODO: Implement toast notification
    console.log(message);
  }

  /**
   * Show notification message
   */
  showNotification(title, message, type = 'info') {
    // TODO: Implement toast notification
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    // Simple alert for important notifications
    if (type === 'info') {
      alert(`${title}\n\n${message}`);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    // Unsubscribe from all listeners
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];

    // Destroy all cards
    this.extensionCards.forEach(card => card.destroy());
    this.extensionCards.clear();

    super.destroy();
  }
}
