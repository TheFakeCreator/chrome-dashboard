/**
 * @module WidgetStore
 * @description UI component for browsing and adding widgets to the dashboard
 * 
 * Features:
 * - Browse available widgets by category
 * - Search widgets
 * - Add/remove widgets from dashboard
 * - Preview widget information
 * - Widget recommendations
 */

import { BaseComponent } from './BaseComponent.js';
import { initIcons } from '../utils/icons.js';

export class WidgetStore extends BaseComponent {
  /**
   * @param {Object} app - App instance
   * @param {Object} options - Component options
   */
  constructor(app, options = {}) {
    super(app, {
      name: 'WidgetStore',
      ...options
    });

    this.registry = app.widgetRegistry;
    this.gridManager = app.gridManager;

    // Store state
    this.isOpen = false;
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.filteredWidgets = [];
    this.installedWidgets = new Set();

    // Debounce timer for search
    this.searchDebounceTimer = null;

    // Modal element
    this.modalElement = null;
  }

  /**
   * Lifecycle: Initialize
   */
  onInit() {
    console.log('[WidgetStore] Initializing...');
    
    // Subscribe to keyboard shortcut (Ctrl/Cmd + Shift + K) using arrow function to preserve 'this'
    document.addEventListener('keydown', (e) => {
      // Only handle Ctrl+Shift+K when modal is closed OR when not focused on search input
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        // If modal is open and search input is focused, don't toggle
        if (this.isOpen) {
          const searchInput = this.$('[data-action="search"]');
          if (searchInput && document.activeElement === searchInput) {
            return; // Let the default behavior happen (focus search)
          }
        }
        
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      }

      // Handle Escape to close when modal is open
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      }
    });

    // Listen for open events
    this.eventBus.on('widget-store:open', () => this.open());
    this.eventBus.on('widget-store:close', () => this.close());
    
    // Listen for widget added/removed events to update installed status
    this.eventBus.on('grid:widget-added', () => this.updateInstalledWidgets());
    this.eventBus.on('grid:widget-removed', () => this.updateInstalledWidgets());
    
    console.log('[WidgetStore] Initialized');
  }

  /**
   * Open widget store
   */
  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.updateInstalledWidgets();
    this.updateFilteredWidgets();
    this.render();
    this.mount(document.body);

    // Focus search input after render
    setTimeout(() => {
      const searchInput = this.$('[data-action="search"]');
      if (searchInput) searchInput.focus();
    }, 100);

    this.emit('opened');
  }

  /**
   * Close widget store
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.unmount();
    
    // Clear search query on close
    this.searchQuery = '';
    
    this.emit('closed');
  }

  /**
   * Toggle widget store
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Update installed widgets set
   * @private
   */
  updateInstalledWidgets() {
    this.installedWidgets.clear();
    
    // Get all widgets currently in the grid
    const gridItems = this.gridManager.gridItems || new Map();
    gridItems.forEach((item) => {
      if (item.widget) {
        // Store widget ID for precise tracking
        this.installedWidgets.add(item.widget.widgetId);
      }
    });
    
    console.log('[WidgetStore] Updated installed widgets:', Array.from(this.installedWidgets));
  }
  
  /**
   * Check if widget type is installed
   * @private
   * @param {string} widgetTitle - Widget title to check
   * @returns {Array} Array of installed widget IDs with this type
   */
  getInstalledWidgetsByTitle(widgetTitle) {
    const installed = [];
    const gridItems = this.gridManager.gridItems || new Map();
    
    gridItems.forEach((item) => {
      if (item.widget && item.widget.name === widgetTitle) {
        installed.push({
          widgetId: item.widget.widgetId,
          name: item.widget.name
        });
      }
    });
    
    return installed;
  }

  /**
   * Update filtered widgets based on category and search
   * @private
   */
  updateFilteredWidgets() {
    let widgets = this.registry.getDefinitions();

    // Filter by category first
    if (this.selectedCategory !== 'all') {
      widgets = widgets.filter(w => w.metadata.category === this.selectedCategory);
    }

    // Then filter by search query if exists
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      widgets = widgets.filter(w => {
        const title = w.metadata.title.toLowerCase();
        const description = w.metadata.description.toLowerCase();
        const category = w.metadata.category.toLowerCase();
        return title.includes(query) || description.includes(query) || category.includes(query);
      });
    }

    this.filteredWidgets = widgets;
  }

  /**
   * Handle category change
   * @private
   * @param {string} category
   */
  handleCategoryChange(category) {
    console.log('[WidgetStore] Category changed to:', category);
    this.selectedCategory = category;
    this.searchQuery = ''; // Clear search when changing category
    this.updateFilteredWidgets();
    this.refresh();
  }

  /**
   * Handle search input with debouncing
   * @private
   * @param {string} query
   */
  handleSearchInput(query) {
    this.searchQuery = query;
    
    // Clear existing timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    // Debounce search by 300ms
    this.searchDebounceTimer = setTimeout(() => {
      console.log('[WidgetStore] Searching for:', query);
      this.updateFilteredWidgets();
      this.refresh();
    }, 300);
  }

  /**
   * Handle widget add
   * @private
   * @param {string} type
   */
  async handleWidgetAdd(type) {
    try {
      console.log('[WidgetStore] Adding widget:', type);
      
      // Create widget instance
      const widget = await this.registry.create(type);
      
      if (!widget) {
        throw new Error('Failed to create widget instance');
      }

      // Add to grid
      this.gridManager.addWidget(widget);

      // Update installed widgets set
      this.updateInstalledWidgets();

      // Show success feedback
      this.showNotification(`${widget.name || 'Widget'} added to dashboard`, 'success');

      // Refresh the UI to show updated install status
      this.refresh();

      this.emit('widget-added', { type, widget });
    } catch (error) {
      console.error('[WidgetStore] Error adding widget:', error);
      this.showNotification(`Failed to add widget: ${error.message}`, 'error');
    }
  }

  /**
   * Handle widget remove (removes latest instance)
   * @private
   * @param {string} widgetName
   */
  async handleWidgetRemoveLatest(widgetName) {
    try {
      console.log('[WidgetStore] Removing latest instance of widget:', widgetName);
      
      // Find all widgets with this name in the grid
      const gridItems = this.gridManager.gridItems || new Map();
      const matchingWidgets = [];
      
      for (const [widgetId, item] of gridItems.entries()) {
        if (item.widget && item.widget.name === widgetName) {
          matchingWidgets.push({
            widgetId,
            createdAt: item.widget.createdAt || 0
          });
        }
      }

      if (matchingWidgets.length === 0) {
        throw new Error('Widget not found in dashboard');
      }

      // Sort by creation time and remove the latest one
      matchingWidgets.sort((a, b) => b.createdAt - a.createdAt);
      const widgetIdToRemove = matchingWidgets[0].widgetId;

      // Remove from grid
      this.gridManager.removeWidget(widgetIdToRemove);

      // Update installed widgets set
      this.updateInstalledWidgets();

      // Show success feedback
      const remaining = matchingWidgets.length - 1;
      const message = remaining > 0 
        ? `${widgetName} removed (${remaining} remaining)` 
        : `${widgetName} removed from dashboard`;
      this.showNotification(message, 'success');

      // Refresh the UI
      this.refresh();

      this.emit('widget-removed', { widgetName, widgetId: widgetIdToRemove });
    } catch (error) {
      console.error('[WidgetStore] Error removing widget:', error);
      this.showNotification(`Failed to remove widget: ${error.message}`, 'error');
    }
  }

  /**
   * Show notification
   * @private
   * @param {string} message
   * @param {string} type
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    const typeStyles = {
      success: 'bg-success/10 border-success/20 text-success',
      error: 'bg-error/10 border-error/20 text-error',
      info: 'bg-primary/10 border-primary/20 text-primary'
    };

    notification.className = `fixed bottom-6 right-6 z-[10000] px-4 py-3 rounded-lg border ${typeStyles[type]} shadow-lg backdrop-blur-sm animate-slideUp flex items-center gap-3 min-w-[250px]`;
    
    const icons = {
      success: 'check-circle',
      error: 'alert-circle',
      info: 'info'
    };

    notification.innerHTML = `
      <i data-lucide="${icons[type]}" class="w-5 h-5 flex-shrink-0"></i>
      <span class="text-sm font-medium">${message}</span>
    `;

    document.body.appendChild(notification);
    
    // Initialize icon
    if (window.lucide) {
      window.lucide.createIcons();
    }

    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Render component
   * @returns {string}
   */
  render() {
    if (!this.isOpen) return '';

    const categories = ['all', ...this.registry.getCategories()];
    const stats = this.registry.getStats();

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" data-action="close"></div>
        
        <!-- Modal Container -->
        <div class="relative w-full max-w-4xl max-h-[90vh] bg-dark-bg-secondary rounded-2xl shadow-2xl border border-dark-border flex flex-col animate-slideUp">
          
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-dark-border">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <i data-lucide="package" class="w-5 h-5 text-primary"></i>
              </div>
              <div>
                <h2 class="text-xl font-bold text-dark-text">Widget Store</h2>
                <p class="text-sm text-dark-muted">${stats.registered} widgets available</p>
              </div>
            </div>
            <button 
              class="w-8 h-8 rounded-lg hover:bg-dark-bg-tertiary transition-colors flex items-center justify-center text-dark-muted hover:text-dark-text" 
              data-action="close" 
              aria-label="Close"
            >
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Search -->
          <div class="px-6 py-4 border-b border-dark-border">
            <div class="relative flex items-center gap-2 bg-dark-bg-tertiary rounded-lg px-3 py-2 border border-dark-border focus-within:border-primary transition-colors">
              <i data-lucide="search" class="w-4 h-4 text-dark-muted flex-shrink-0"></i>
              <input 
                type="text" 
                class="flex-1 bg-transparent text-dark-text placeholder:text-dark-muted outline-none text-sm" 
                placeholder="Search widgets..."
                value="${this.searchQuery}"
                data-action="search"
              />
              <kbd class="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-dark-bg-secondary border border-dark-border text-xs text-dark-muted font-mono">
                <span>Ctrl+Shift+K</span>
              </kbd>
            </div>
          </div>

          <!-- Categories -->
          <div class="px-6 py-3 border-b border-dark-border overflow-x-auto">
            <div class="flex gap-2">
              ${categories.map(category => `
                <button 
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    this.selectedCategory === category 
                      ? 'bg-primary text-white' 
                      : 'bg-dark-bg-tertiary text-dark-muted hover:bg-dark-bg-tertiary/80 hover:text-dark-text'
                  }"
                  data-action="category"
                  data-category="${category}"
                >
                  ${this.getCategoryIcon(category)}
                  <span>${this.formatCategory(category)}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Widgets Grid -->
          <div class="flex-1 overflow-y-auto p-6">
            ${this.filteredWidgets.length > 0 
              ? `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  ${this.filteredWidgets.map(widget => this.renderWidgetCard(widget)).join('')}
                 </div>`
              : this.renderEmptyState()
            }
          </div>

          <!-- Footer -->
          <div class="px-6 py-3 border-t border-dark-border bg-dark-bg-tertiary/50 rounded-b-2xl">
            <p class="text-xs text-dark-muted text-center">
              Press <kbd class="px-1.5 py-0.5 rounded bg-dark-bg-secondary border border-dark-border font-mono text-dark-text">Esc</kbd> to close • 
              <kbd class="px-1.5 py-0.5 rounded bg-dark-bg-secondary border border-dark-border font-mono text-dark-text">Ctrl+Shift+K</kbd> to open
            </p>
          </div>
          
        </div>
      </div>
    `;
  }

  /**
   * Render widget card
   * @private
   * @param {Object} widget
   * @returns {string}
   */
  renderWidgetCard(widget) {
    const { type, metadata } = widget;
    const installedInstances = this.getInstalledWidgetsByTitle(metadata.title);
    const isInstalled = installedInstances.length > 0;

    return `
      <div class="group bg-dark-bg-tertiary rounded-xl border ${isInstalled ? 'border-success/30' : 'border-dark-border'} hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 overflow-hidden relative">
        ${isInstalled ? `
          <div class="absolute top-2 right-2 z-10">
            <div class="px-2 py-1 rounded-full bg-success/20 border border-success/40 text-success text-xs font-medium flex items-center gap-1">
              <i data-lucide="check-circle" class="w-3 h-3"></i>
              <span>${installedInstances.length} Active</span>
            </div>
          </div>
        ` : ''}
        
        <!-- Icon Header -->
        <div class="p-4 bg-gradient-to-br from-primary/10 to-transparent border-b border-dark-border">
          <div class="w-12 h-12 rounded-lg bg-dark-bg-secondary border border-dark-border flex items-center justify-center text-2xl">
            ${metadata.icon}
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-3">
          <div>
            <h3 class="text-base font-semibold text-dark-text mb-1">${metadata.title}</h3>
            <p class="text-sm text-dark-muted line-clamp-2">${metadata.description}</p>
          </div>

          <!-- Meta Info -->
          <div class="flex items-center gap-2 text-xs">
            <span class="px-2 py-1 rounded bg-dark-bg-secondary border border-dark-border text-dark-muted">
              ${this.formatCategory(metadata.category)}
            </span>
            <span class="px-2 py-1 rounded bg-dark-bg-secondary border border-dark-border text-dark-muted">
              v${metadata.version}
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <button 
              class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors text-sm"
              data-action="add"
              data-type="${type}"
            >
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Add</span>
            </button>
            ${isInstalled ? `
              <button 
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-error/10 hover:bg-error/20 border border-error/20 hover:border-error/30 text-error font-medium transition-colors text-sm"
                data-action="remove-latest"
                data-widget-name="${metadata.title}"
                title="Remove latest instance"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
                <span>Remove</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render empty state
   * @private
   * @returns {string}
   */
  renderEmptyState() {
    return `
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-dark-bg-tertiary border border-dark-border flex items-center justify-center mb-4">
          <i data-lucide="inbox" class="w-8 h-8 text-dark-muted"></i>
        </div>
        <h3 class="text-lg font-semibold text-dark-text mb-2">No widgets found</h3>
        <p class="text-sm text-dark-muted max-w-xs">Try adjusting your search or category filter to find more widgets</p>
      </div>
    `;
  }

  /**
   * Get category icon
   * @private
   * @param {string} category
   * @returns {string}
   */
  getCategoryIcon(category) {
    const icons = {
      all: 'grid',
      time: 'clock',
      productivity: 'zap',
      navigation: 'compass',
      utilities: 'wrench',
      general: 'box'
    };

    return `<i data-lucide="${icons[category] || 'box'}" class="w-4 h-4"></i>`;
  }

  /**
   * Format category name
   * @private
   * @param {string} category
   * @returns {string}
   */
  formatCategory(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Lifecycle: After render
   */
  onAfterRender() {
    // Initialize icons
    initIcons();
    
    // Re-attach event listeners after every render
    // This is necessary because refresh() updates innerHTML which removes listeners
    if (this.mounted) {
      this.setupEventListeners();
    }
  }

  /**
   * Lifecycle: Component mounted
   */
  onMount() {
    this.setupEventListeners();
  }

  /**
   * Clear all event handlers
   * @private
   */
  clearEventHandlers() {
    // Clear handlers from BaseComponent's registry
    this.handlers.forEach(handlers => {
      handlers.forEach(({ target, event, handler, options }) => {
        if (target && target.removeEventListener) {
          target.removeEventListener(event, handler, options);
        }
      });
    });
    this.handlers.clear();
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    // Clear old handlers to prevent duplicates
    this.clearEventHandlers();
    
    // Close button
    this.$$('[data-action="close"]').forEach(btn => {
      this.on(btn, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      });
    });

    // Search input
    const searchInput = this.$('[data-action="search"]');
    if (searchInput) {
      this.on(searchInput, 'input', (e) => {
        this.handleSearchInput(e.target.value);
      });
      
      // Prevent Ctrl+Shift+K from toggling modal when focused on search
      this.on(searchInput, 'keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
          e.stopPropagation();
        }
      });
    }

    // Category buttons
    this.$$('[data-action="category"]').forEach(btn => {
      this.on(btn, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const category = btn.dataset.category;
        this.handleCategoryChange(category);
      });
    });

    // Add widget buttons
    this.$$('[data-action="add"]').forEach(btn => {
      this.on(btn, 'click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const type = btn.dataset.type;
        
        // Disable button during operation
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        
        await this.handleWidgetAdd(type);
        
        // Re-enable button (will be replaced by refresh anyway)
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
      });
    });

    // Remove widget buttons (remove latest instance)
    this.$$('[data-action="remove-latest"]').forEach(btn => {
      this.on(btn, 'click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const widgetName = btn.dataset.widgetName;
        
        // Disable button during operation
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        
        await this.handleWidgetRemoveLatest(widgetName);
        
        // Re-enable button (will be replaced by refresh anyway)
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
      });
    });
  }

  /**
   * Lifecycle: Cleanup
   */
  onDestroy() {
    // Note: Arrow function in addEventListener cannot be removed with removeEventListener
    // This is acceptable for this use case as the component lifecycle manages cleanup
    
    // Clear debounce timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }
}
