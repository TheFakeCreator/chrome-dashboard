/**
 * @module QuickLinksWidget
 * @description Quick access links widget combining app drawer and bookmarks
 * Features: Grid/List view, Add/Edit/Delete, Favicon fetching, Pin functionality
 * 
 * @example
 * const quickLinks = new QuickLinksWidget(app, {
 *   settings: { 
 *     viewMode: 'grid',
 *     sortBy: 'frequency',
 *     iconsOnly: false
 *   }
 * });
 * quickLinks.mount('#widget-grid');
 */

import { BaseWidget } from './BaseWidget.js';
import { InfiniteCarousel } from '../components/InfiniteCarousel.js';
import { logger as log } from '../utils/logger.js';
const module = 'QuickLinksWidget';

export class QuickLinksWidget extends BaseWidget {
  constructor(app, options = {}) {
    super(app, {
      ...options,
      name: 'QuickLinks',
      title: 'Quick Links',
      icon: '<i data-lucide="grid-3x3" class="w-5 h-5"></i>',
      description: 'Quick access to your favorite sites and apps',
      category: 'productivity'
    });

    // Links data
    this.links = [];
    
    // UI state
    this.editingLink = null;
    this.showAddModal = false;
    
    // Carousel instance
    this.carousel = null;
    this.useCarousel = false; // Can be toggled in settings
  }

  /**
   * Get default settings
   * @returns {Object} Default settings
   */
  getDefaultSettings() {
    return {
      viewMode: 'carousel', // 'carousel', 'grid', or 'list'
      sortBy: 'manual', // 'manual', 'frequency', 'alphabetical', 'recent'
      showUsageCount: false,
      iconsOnly: false,
      maxLinks: 50,
      gridColumns: 5, // Links per row in grid view
      carouselItemsPerView: 6, // Items per view in carousel mode
      showCategories: false
    };
  }

  /**
   * Load widget data
   * @returns {Promise<void>}
   */
  async loadData() {
    try {
      this.loading = true;
      this.emit('widget:loading', { widgetId: this.widgetId });

      // Load links from storage
      const storageKey = `widget.${this.widgetId}.links`;
      const result = await this.app.storageManager.get([storageKey]);
      
      if (result && result[storageKey]) {
        this.links = result[storageKey];
        
        // Migrate old favicon URLs to Clearbit's Logo API
        let needsMigration = false;
        this.links = this.links.map(link => {
          // Check if not using Clearbit's service
          if (link.icon && !link.icon.includes('logo.clearbit.com')) {
            needsMigration = true;
            try {
              const domain = new URL(link.url).hostname;
              console.log(`[QuickLinksWidget] Migrating ${link.title} to Clearbit Logo API`);
              return {
                ...link,
                icon: `https://logo.clearbit.com/${domain}`
              };
            } catch (error) {
              console.warn(`[QuickLinksWidget] Failed to migrate ${link.title}:`, error);
              return link;
            }
          }
          return link;
        });
        
        // Save migrated links
        if (needsMigration) {
          await this.saveLinks();
          log.info(module, 'Migrated favicon URLs to Clearbit Logo API');
        }
        
        log.info(module, 'Loaded', this.links.length, 'links');
      } else {
        // Initialize with default links
        this.links = this.getDefaultLinks();
        await this.saveLinks();
      }

      this.data = { links: this.links };
      this.loading = false;
      this.error = null;
      this.emit('widget:loaded', { widgetId: this.widgetId });
      
      // Refresh to display the loaded links
      this.refresh();
    } catch (error) {
      this.loading = false;
      this.error = error.message;
      this.emit('widget:error', { widgetId: this.widgetId, error: error.message });
      log.error(module, 'Error loading data:', error);
    }
  }

  /**
   * Get default links for first-time setup
   * @returns {Array} Default links
   */
  getDefaultLinks() {
    return [
      {
        id: this.generateLinkId(),
        title: 'GitHub',
        url: 'https://github.com',
        icon: 'https://logo.clearbit.com/github.com',
        category: 'dev',
        pinned: true,
        usageCount: 0,
        lastUsed: null,
        dateAdded: Date.now()
      },
      {
        id: this.generateLinkId(),
        title: 'YouTube',
        url: 'https://youtube.com',
        icon: 'https://logo.clearbit.com/youtube.com',
        category: 'media',
        pinned: false,
        usageCount: 0,
        lastUsed: null,
        dateAdded: Date.now()
      },
      {
        id: this.generateLinkId(),
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        icon: 'https://logo.clearbit.com/stackoverflow.com',
        category: 'dev',
        pinned: false,
        usageCount: 0,
        lastUsed: null,
        dateAdded: Date.now()
      }
    ];
  }

  /**
   * Generate unique link ID
   * @returns {string} Link ID
   */
  generateLinkId() {
    return `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save links to storage
   * @returns {Promise<void>}
   */
  async saveLinks() {
    const storageKey = `widget.${this.widgetId}.links`;
    await this.app.storageManager.set({ [storageKey]: this.links });
    log.info(module, 'Saved', this.links.length, 'links');
  }

  /**
   * Add new link
   * @param {Object} linkData - Link data
   * @returns {Promise<void>}
   */
  async addLink(linkData) {
    const newLink = {
      id: this.generateLinkId(),
      title: linkData.title,
      url: linkData.url,
      icon: linkData.icon || await this.fetchFavicon(linkData.url),
      category: linkData.category || 'general',
      pinned: linkData.pinned || false,
      usageCount: 0,
      lastUsed: null,
      dateAdded: Date.now()
    };

    this.links.push(newLink);
    await this.saveLinks();
    this.refresh();
    
    this.emit('link:added', { link: newLink });
    log.info(module, 'Added link:', newLink.title);
  }

  /**
   * Update existing link
   * @param {string} linkId - Link ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<void>}
   */
  async updateLink(linkId, updates) {
    const link = this.links.find(l => l.id === linkId);
    if (!link) return;

    Object.assign(link, updates);
    await this.saveLinks();
    this.refresh();
    
    this.emit('link:updated', { link });
    log.info(module, 'Updated link:', link.title);
  }

  /**
   * Delete link
   * @param {string} linkId - Link ID
   * @returns {Promise<void>}
   */
  async deleteLink(linkId) {
    const index = this.links.findIndex(l => l.id === linkId);
    if (index === -1) return;

    const link = this.links[index];
    this.links.splice(index, 1);
    await this.saveLinks();
    this.refresh();
    
    this.emit('link:deleted', { linkId });
    log.info(module, 'Deleted link:', link.title);
  }

  /**
   * Toggle pin status
   * @param {string} linkId - Link ID
   * @returns {Promise<void>}
   */
  async togglePin(linkId) {
    const link = this.links.find(l => l.id === linkId);
    if (!link) return;

    link.pinned = !link.pinned;
    await this.saveLinks();
    this.refresh();
    
    log.info(module, 'Toggled pin for:', link.title, '→', link.pinned);
  }

  /**
   * Track link usage
   * @param {string} linkId - Link ID
   * @returns {Promise<void>}
   */
  async trackUsage(linkId) {
    const link = this.links.find(l => l.id === linkId);
    if (!link) return;

    link.usageCount++;
    link.lastUsed = Date.now();
    await this.saveLinks();
    
    log.info(module, 'Tracked usage for:', link.title, '→', link.usageCount);
  }

  /**
   * Open link
   * @param {string} linkId - Link ID
   */
  async openLink(linkId) {
    const link = this.links.find(l => l.id === linkId);
    if (!link) return;

    // Track usage
    await this.trackUsage(linkId);

    // Open in new tab
    chrome.tabs.create({ url: link.url });
    
    this.emit('link:opened', { link });
  }

  /**
   * Fetch favicon for URL
   * @param {string} url - Website URL
   * @returns {Promise<string>} Favicon URL
   */
  async fetchFavicon(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Use Clearbit's Logo API - reliable and high-quality
      // Automatically falls back to favicon if logo not available
      return `https://logo.clearbit.com/${domain}`;
    } catch (error) {
      console.warn('[QuickLinksWidget] Invalid URL:', url);
      // Return a fallback SVG
      return this.getFallbackIcon('?');
    }
  }

  /**
   * Get fallback icon with letter
   * @param {string} letter - Letter to display
   * @returns {string} Data URL for SVG icon
   */
  getFallbackIcon(letter) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
      <rect width="48" height="48" fill="#374151" rx="8"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".35em" font-size="20" font-weight="600" fill="#9CA3AF">${letter.toUpperCase()}</text>
    </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  /**
   * Get sorted links
   * @returns {Array} Sorted links
   */
  getSortedLinks() {
    const sorted = [...this.links];

    // Separate pinned and unpinned
    const pinned = sorted.filter(l => l.pinned);
    const unpinned = sorted.filter(l => !l.pinned);

    // Sort unpinned based on settings
    switch (this.settings.sortBy) {
      case 'frequency':
        unpinned.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'alphabetical':
        unpinned.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'recent':
        unpinned.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
        break;
      // 'manual' - keep current order
    }

    // Pinned first, then sorted unpinned
    return [...pinned, ...unpinned];
  }

  /**
   * Render widget content
   * @returns {string} HTML string
   */
  render() {
    if (this.loading) {
      return this.renderLoading();
    }

    if (this.error) {
      return this.renderError();
    }

    if (this.links.length === 0) {
      return this.renderEmpty();
    }

    const sortedLinks = this.getSortedLinks();
    const viewMode = this.settings.viewMode;
    
    log.info(module, 'render() - viewMode:', viewMode);

    return `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-dark-text">Quick Links</h3>
            <span class="text-xs text-dark-muted">(${this.links.length})</span>
          </div>
          <div class="flex items-center gap-2">
            <!-- View Toggle -->
            <div class="flex items-center bg-dark-elevated rounded-lg p-1">
              <button 
                class="p-1.5 rounded ${viewMode === 'carousel' ? 'bg-dark-surface text-primary-400' : 'text-dark-muted hover:text-dark-text'} transition-colors"
                data-action="toggle-view"
                data-view="carousel"
                title="Carousel View"
              >
                <i data-lucide="maximize-2" class="w-4 h-4"></i>
              </button>
              <button 
                class="p-1.5 rounded ${viewMode === 'grid' ? 'bg-dark-surface text-primary-400' : 'text-dark-muted hover:text-dark-text'} transition-colors"
                data-action="toggle-view"
                data-view="grid"
                title="Grid View"
              >
                <i data-lucide="grid-3x3" class="w-4 h-4"></i>
              </button>
              <button 
                class="p-1.5 rounded ${viewMode === 'list' ? 'bg-dark-surface text-primary-400' : 'text-dark-muted hover:text-dark-text'} transition-colors"
                data-action="toggle-view"
                data-view="list"
                title="List View"
              >
                <i data-lucide="list" class="w-4 h-4"></i>
              </button>
            </div>
            
            <!-- Add Button -->
            <button 
              class="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-sm font-medium"
              data-action="add-link"
              title="Add Link"
            >
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Add</span>
            </button>
          </div>
        </div>

        <!-- Links Container -->
        <div data-links-container class="${viewMode === 'carousel' ? 'w-full' : ''}">
          ${viewMode === 'carousel' ? '<div data-carousel-mount class="w-full"></div>' : 
            viewMode === 'grid' ? this.renderGridView(sortedLinks) : 
            this.renderListView(sortedLinks)}
        </div>
      </div>
    `;
  }

  /**
   * Render grid view
   * @param {Array} links - Links to render
   * @returns {string} HTML string
   */
  renderGridView(links) {
    // Map grid columns to Tailwind classes
    const gridColsClass = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8'
    }[this.settings.gridColumns] || 'grid-cols-5';
    
    return `
      <div class="grid ${gridColsClass} gap-3">
        ${links.map(link => `
          <div class="group relative">
            <button
              class="relative w-full aspect-square flex flex-col items-center justify-center gap-1.5 p-2.5 bg-dark-elevated hover:bg-dark-surface border border-dark-border hover:border-primary-500/30 rounded-xl transition-all"
              data-action="open-link"
              data-link-id="${link.id}"
              title="${link.title}"
            >
              <!-- Pin Badge -->
              ${link.pinned ? `
                <div class="absolute top-1.5 left-1.5">
                  <i data-lucide="pin" class="w-3 h-3 text-primary-400"></i>
                </div>
              ` : ''}
              
              <!-- Icon -->
              <div class="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img 
                  src="${link.icon}" 
                  alt="${link.title}"
                  class="max-w-full max-h-full object-contain rounded-lg"
                  data-fallback="${this.getFallbackIcon(link.title.charAt(0))}"
                />
              </div>
              
              <!-- Title -->
              ${!this.settings.iconsOnly ? `
                <div class="w-full text-center px-0.5">
                  <p class="text-[10px] text-dark-text font-medium truncate whitespace-nowrap overflow-hidden text-ellipsis">
                    ${link.title}
                  </p>
                </div>
              ` : ''}
              
              <!-- Usage Count -->
              ${this.settings.showUsageCount && link.usageCount > 0 ? `
                <span class="text-[9px] text-dark-muted">
                  ${link.usageCount}×
                </span>
              ` : ''}
            </button>
            
            <!-- Actions (on hover) -->
            <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                class="p-1 bg-dark-card/90 hover:bg-primary-500/20 text-dark-muted hover:text-primary-400 rounded border border-dark-border transition-colors"
                data-action="toggle-pin"
                data-link-id="${link.id}"
                title="${link.pinned ? 'Unpin' : 'Pin'}"
              >
                <i data-lucide="${link.pinned ? 'pin-off' : 'pin'}" class="w-3 h-3"></i>
              </button>
              <button
                class="p-1 bg-dark-card/90 hover:bg-primary-500/20 text-dark-muted hover:text-primary-400 rounded border border-dark-border transition-colors"
                data-action="edit-link"
                data-link-id="${link.id}"
                title="Edit"
              >
                <i data-lucide="pencil" class="w-3 h-3"></i>
              </button>
              <button
                class="p-1 bg-dark-card/90 hover:bg-red-500/20 text-dark-muted hover:text-red-400 rounded border border-dark-border transition-colors"
                data-action="delete-link"
                data-link-id="${link.id}"
                title="Delete"
              >
                <i data-lucide="trash-2" class="w-3 h-3"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render list view
   * @param {Array} links - Links to render
   * @returns {string} HTML string
   */
  renderListView(links) {
    return `
      <div class="space-y-1">
        ${links.map(link => `
          <div class="group relative flex items-center gap-3 p-2 bg-dark-elevated hover:bg-dark-surface border border-dark-border hover:border-primary-500/30 rounded-lg transition-all">
            <!-- Pin Icon -->
            ${link.pinned ? `
              <i data-lucide="pin" class="w-4 h-4 text-primary-400 flex-shrink-0"></i>
            ` : '<div class="w-4"></div>'}
            
            <!-- Favicon -->
            <img 
              src="${link.icon}" 
              alt="${link.title}"
              class="w-6 h-6 object-contain rounded flex-shrink-0"
              data-fallback="${this.getFallbackIcon(link.title.charAt(0))}"
            />
            
            <!-- Link Info -->
            <button
              class="flex-1 flex flex-col items-start min-w-0 text-left"
              data-action="open-link"
              data-link-id="${link.id}"
            >
              <span class="text-sm font-medium text-dark-text truncate w-full">
                ${link.title}
              </span>
              <span class="text-xs text-dark-muted truncate w-full">
                ${new URL(link.url).hostname}
              </span>
            </button>
            
            <!-- Usage Count -->
            ${this.settings.showUsageCount && link.usageCount > 0 ? `
              <span class="text-xs text-dark-muted flex-shrink-0">
                ${link.usageCount}×
              </span>
            ` : ''}
            
            <!-- Actions -->
            <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                class="p-1.5 hover:bg-primary-500/20 text-dark-muted hover:text-primary-400 rounded transition-colors"
                data-action="toggle-pin"
                data-link-id="${link.id}"
                title="${link.pinned ? 'Unpin' : 'Pin'}"
              >
                <i data-lucide="${link.pinned ? 'pin-off' : 'pin'}" class="w-4 h-4"></i>
              </button>
              <button
                class="p-1.5 hover:bg-primary-500/20 text-dark-muted hover:text-primary-400 rounded transition-colors"
                data-action="edit-link"
                data-link-id="${link.id}"
                title="Edit"
              >
                <i data-lucide="pencil" class="w-4 h-4"></i>
              </button>
              <button
                class="p-1.5 hover:bg-red-500/20 text-dark-muted hover:text-red-400 rounded transition-colors"
                data-action="delete-link"
                data-link-id="${link.id}"
                title="Delete"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render loading state
   * @returns {string} HTML string
   */
  renderLoading() {
    return `
      <div class="flex items-center justify-center p-8">
        <div class="flex items-center gap-3 text-dark-muted">
          <div class="animate-spin">
            <i data-lucide="loader-2" class="w-5 h-5"></i>
          </div>
          <span>Loading links...</span>
        </div>
      </div>
    `;
  }

  /**
   * Render error state
   * @returns {string} HTML string
   */
  renderError() {
    return `
      <div class="flex items-center justify-center p-8">
        <div class="text-center space-y-4 max-w-sm">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full">
            <i data-lucide="alert-circle" class="w-6 h-6 text-red-500"></i>
          </div>
          <p class="text-dark-text font-medium">${this.error}</p>
          <button class="btn btn-primary" data-action="retry">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            <span>Retry</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render empty state
   * @returns {string} HTML string
   */
  renderEmpty() {
    return `
      <div class="flex items-center justify-center p-8">
        <div class="text-center space-y-4">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-500/10 rounded-full">
            <i data-lucide="link" class="w-8 h-8 text-primary-500"></i>
          </div>
          <div>
            <p class="text-dark-text font-medium">No links yet</p>
            <p class="text-sm text-dark-muted mt-1">Add your favorite sites for quick access</p>
          </div>
          <button 
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
            data-action="add-link"
          >
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Add First Link</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Show add/edit link modal
   * @param {Object|null} link - Link to edit (null for new)
   */
  showLinkModal(link = null) {
    const isEdit = !!link;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="bg-dark-card border border-dark-border rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-dark-text">${isEdit ? 'Edit Link' : 'Add New Link'}</h3>
          <button class="p-1 rounded hover:bg-dark-elevated transition-colors" data-action="close-modal">
            <i data-lucide="x" class="w-5 h-5 text-dark-muted"></i>
          </button>
        </div>
        
        <form class="space-y-4" data-form="link">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-dark-text mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value="${link?.title || ''}"
              placeholder="e.g., GitHub"
              class="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              required
            />
          </div>
          
          <!-- URL -->
          <div>
            <label class="block text-sm font-medium text-dark-text mb-2">
              URL *
            </label>
            <input
              type="url"
              name="url"
              value="${link?.url || ''}"
              placeholder="https://example.com"
              class="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              required
            />
          </div>
          
          <!-- Icon URL (Optional) -->
          <div>
            <label class="block text-sm font-medium text-dark-text mb-2">
              Icon URL (optional)
            </label>
            <input
              type="url"
              name="icon"
              value="${link?.icon || ''}"
              placeholder="Leave empty to auto-fetch favicon"
              class="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <p class="text-xs text-dark-muted mt-1">Favicon will be fetched automatically if left empty</p>
          </div>
          
          <!-- Category (Optional) -->
          <div>
            <label class="block text-sm font-medium text-dark-text mb-2">
              Category (optional)
            </label>
            <input
              type="text"
              name="category"
              value="${link?.category || ''}"
              placeholder="e.g., dev, social, work"
              class="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          
          <!-- Pin -->
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              name="pinned"
              id="link-pinned"
              ${link?.pinned ? 'checked' : ''}
              class="w-4 h-4 rounded border-dark-border bg-dark-elevated text-primary-500 focus:ring-2 focus:ring-primary-500"
            />
            <label for="link-pinned" class="text-sm text-dark-text cursor-pointer">
              Pin to top
            </label>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-dark-elevated hover:bg-dark-surface text-dark-text rounded-lg transition-colors font-medium"
              data-action="close-modal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
            >
              ${isEdit ? 'Save Changes' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-action="close-modal"]')) {
        modal.remove();
      }
    });
    
    // Handle form submit
    const form = modal.querySelector('[data-form="link"]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const linkData = {
        title: formData.get('title'),
        url: formData.get('url'),
        icon: formData.get('icon') || null,
        category: formData.get('category') || 'general',
        pinned: formData.get('pinned') === 'on'
      };
      
      if (isEdit) {
        await this.updateLink(link.id, linkData);
      } else {
        await this.addLink(linkData);
      }
      
      modal.remove();
    });
    
    document.body.appendChild(modal);
    
    // Initialize icons
    import('../utils/icons.js').then(({ initIcons }) => initIcons());
    
    // Focus first input
    setTimeout(() => {
      modal.querySelector('input[name="title"]')?.focus();
    }, 100);
  }

  /**
   * Show delete confirmation
   * @param {string} linkId - Link ID
   */
  showDeleteConfirmation(linkId) {
    const link = this.links.find(l => l.id === linkId);
    if (!link) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="bg-dark-card border border-dark-border rounded-lg shadow-2xl max-w-sm w-full mx-4 p-6">
        <div class="text-center space-y-4">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full">
            <i data-lucide="trash-2" class="w-6 h-6 text-red-500"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-dark-text">Delete Link?</h3>
            <p class="text-sm text-dark-muted mt-2">
              Are you sure you want to delete <strong>${link.title}</strong>? This action cannot be undone.
            </p>
          </div>
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2 bg-dark-elevated hover:bg-dark-surface text-dark-text rounded-lg transition-colors font-medium"
              data-action="close-modal"
            >
              Cancel
            </button>
            <button
              class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
              data-action="confirm-delete"
              data-link-id="${linkId}"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Close on overlay or cancel
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-action="close-modal"]')) {
        modal.remove();
      }
    });
    
    // Confirm delete
    modal.querySelector('[data-action="confirm-delete"]')?.addEventListener('click', async () => {
      await this.deleteLink(linkId);
      modal.remove();
    });
    
    document.body.appendChild(modal);
    
    // Initialize icons
    import('../utils/icons.js').then(({ initIcons }) => initIcons());
  }

  /**
   * Handle widget events
   * @param {Event} event - DOM event
   */
  handleEvent(event) {
    const actionElement = event.target.closest('[data-action]');
    const action = actionElement?.dataset.action;

    console.log('[QuickLinksWidget] handleEvent - action:', action);

    // Stop propagation for action buttons (except open-link)
    if (action && action !== 'open-link') {
      event.stopPropagation();
    }

    switch (action) {
      case 'add-link':
        this.showLinkModal();
        break;
        
      case 'edit-link':
        const editLinkId = event.target.closest('[data-link-id]')?.dataset.linkId;
        const editLink = this.links.find(l => l.id === editLinkId);
        if (editLink) this.showLinkModal(editLink);
        break;
        
      case 'delete-link':
        const deleteLinkId = event.target.closest('[data-link-id]')?.dataset.linkId;
        if (deleteLinkId) this.showDeleteConfirmation(deleteLinkId);
        break;
        
      case 'open-link':
        const openLinkId = event.target.closest('[data-link-id]')?.dataset.linkId;
        if (openLinkId) this.openLink(openLinkId);
        break;
        
      case 'toggle-pin':
        const pinLinkId = event.target.closest('[data-link-id]')?.dataset.linkId;
        if (pinLinkId) this.togglePin(pinLinkId);
        break;
        
      case 'toggle-view':
        const view = actionElement.dataset.view;
        if (view) this.updateSettings({ viewMode: view });
        break;
        
      case 'retry':
        this.loadData();
        break;
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  setupQuickLinksEventListeners() {
    // Remove old listeners if they exist
    if (this._clickHandler) {
      this.element.removeEventListener('click', this._clickHandler);
    }
    if (this._imageErrorHandler) {
      this.element.removeEventListener('error', this._imageErrorHandler, true);
    }

    // Add click event listener
    this._clickHandler = (event) => {
      const actionElement = event.target.closest('[data-action]');
      if (actionElement) {
        event.preventDefault();
        this.handleEvent(event);
      }
    };
    this.element.addEventListener('click', this._clickHandler);

    // Add image error handler (using capture phase)
    this._imageErrorHandler = (event) => {
      if (event.target.tagName === 'IMG' && event.target.hasAttribute('data-fallback')) {
        event.target.src = event.target.dataset.fallback;
        event.target.removeAttribute('data-fallback'); // Prevent infinite loop
      }
    };
    this.element.addEventListener('error', this._imageErrorHandler, true);
  }

  /**
   * Render carousel item
   * @param {Object} link - Link data
   * @param {number} index - Item index
   * @returns {HTMLElement} Item element
   */
  renderCarouselItem(link, index) {
    const itemEl = document.createElement('div');
    // Tailwind classes for carousel item
    itemEl.className = 'carousel-item relative flex flex-col items-center justify-center w-[180px] h-[180px] min-w-[180px] min-h-[180px] max-w-[180px] max-h-[180px] rounded-2xl backdrop-blur-xl bg-dark-surface/40 border-2 border-primary-500/20 overflow-hidden transition-all duration-300 hover:border-primary-400/40 cursor-pointer group';
    itemEl.dataset.linkId = link.id;
    
    // Extract domain from URL for display
    let domain = '';
    try {
      domain = new URL(link.url).hostname.replace('www.', '');
    } catch (e) {
      domain = link.url;
    }
    
    // Create description if not exists
    const description = link.description || `Quick access to ${link.title}`;
    
    itemEl.innerHTML = `
      <!-- Pin Badge -->
      ${link.pinned ? `
        <div class="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-primary-500/20 backdrop-blur-sm text-primary-400 text-[10px] font-medium rounded-full border border-primary-500/30 z-10">
          <i data-lucide="pin" class="w-2.5 h-2.5 inline-block"></i>
          Pinned
        </div>
      ` : ''}
      
      <!-- Icon -->
      <div class="flex items-center justify-center w-16 h-16 mb-2 rounded-xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/20 overflow-hidden shadow-lg shadow-primary-500/10">
        <img 
          src="${link.icon}" 
          alt="${link.title}"
          class="w-12 h-12 object-contain"
          onerror="this.src='${this.getFallbackIcon(link.title.charAt(0))}'; this.onerror=null;"
        />
      </div>
      
      <!-- Title (always visible) -->
      <div class="text-sm font-medium text-dark-text text-center px-2 leading-tight truncate max-w-full">
        ${link.title}
      </div>
      
      <!-- Details (only on center item with .is-center class) -->
      <div class="carousel-item-details absolute inset-0 flex flex-col items-center justify-center bg-dark-surface/95 backdrop-blur-xl opacity-0 transition-opacity duration-300 p-4 overflow-hidden pointer-events-none">
        <div class="text-xs text-primary-400 font-medium mb-1 truncate max-w-full">
          ${domain}
        </div>
        <div class="text-[10px] text-dark-muted text-center leading-tight mb-3 line-clamp-2">
          ${description}
        </div>
        ${this.settings.showUsageCount || link.usageCount > 0 ? `
          <div class="flex items-center gap-3 text-[10px] text-dark-muted">
            ${link.usageCount > 0 ? `
              <div class="flex items-center gap-1">
                <i data-lucide="mouse-pointer-click" class="w-3 h-3"></i>
                <span>${link.usageCount}×</span>
              </div>
            ` : ''}
            ${link.lastUsed ? `
              <div class="flex items-center gap-1">
                <i data-lucide="clock" class="w-3 h-3"></i>
                <span>${this.formatRelativeTime(link.lastUsed)}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
      
      <!-- Action Buttons Overlay (on hover) -->
      <div class="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity flex gap-1 z-20">
        <button
          class="p-1.5 bg-dark-card/90 backdrop-blur-sm hover:bg-primary-500/20 text-dark-muted hover:text-primary-400 rounded-lg border border-dark-border/50 transition-all"
          data-action="edit-link"
          data-link-id="${link.id}"
          title="Edit Link"
          onclick="event.stopPropagation();"
        >
          <i data-lucide="pencil" class="w-3 h-3"></i>
        </button>
        <button
          class="p-1.5 bg-dark-card/90 backdrop-blur-sm hover:bg-red-500/20 text-dark-muted hover:text-red-400 rounded-lg border border-dark-border/50 transition-all"
          data-action="delete-link"
          data-link-id="${link.id}"
          title="Delete Link"
          onclick="event.stopPropagation();"
        >
          <i data-lucide="trash-2" class="w-3 h-3"></i>
        </button>
      </div>
    `;
    
    // Add click handler for opening link
    itemEl.addEventListener('click', (e) => {
      // Don't open if clicking action buttons
      if (e.target.closest('[data-action]')) return;
      this.openLink(link.id);
    });
    
    return itemEl;
  }
  
  /**
   * Format relative time
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Relative time string
   */
  formatRelativeTime(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  }

  /**
   * Initialize carousel
   * @private
   */
  initializeCarousel() {
    log.info(module, 'initializeCarousel called');
    log.info(module, 'element:', this.element);
    
    const mountPoint = this.element?.querySelector('[data-carousel-mount]');
    log.info(module, 'mountPoint found:', mountPoint);
    
    if (!mountPoint) {
      log.error(module, 'No carousel mount point found!');
      return;
    }

    // Destroy existing carousel if any
    if (this.carousel) {
      this.carousel.destroy();
      this.carousel = null;
    }

    // Create new carousel with futuristic centered focus
    this.carousel = new InfiniteCarousel({
      itemsPerView: 5, // Show 5 items: 2 left + 1 center (focused) + 2 right
      gap: 20,
      autoSnap: true,
      snapDuration: 400, // Smoother, more dramatic animation
      dragThreshold: 15,
      onItemRender: (link, index) => {
        return this.renderCarouselItem(link, index);
      },
      onItemClick: (link, index, event) => {
        // Click handled by item buttons
      },
      onActiveChange: (index) => {
        console.log('[QuickLinksWidget] Center item changed to index:', index);
      }
    });

    // Set links data
    const sortedLinks = this.getSortedLinks();
    this.carousel.setItems(sortedLinks);

    // Mount carousel
    const carouselEl = this.carousel.render();
    mountPoint.appendChild(carouselEl);

    // Initialize icons in carousel
    import('../utils/icons.js').then(({ initIcons }) => {
      initIcons(carouselEl);
    });

    log.info(module, 'Futuristic carousel initialized with', sortedLinks.length, 'items');
  }

  /**
   * Lifecycle: After render
   */
  onAfterRender() {
    super.onAfterRender();
    
    log.info(module, 'onAfterRender - viewMode:', this.settings.viewMode);
    
    // Initialize carousel if in carousel mode
    if (this.settings.viewMode === 'carousel') {
      log.info(module, 'Carousel mode detected, initializing...');
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        this.initializeCarousel();
      }, 0);
    }
    
    // Re-attach event listeners after every render
    this.setupQuickLinksEventListeners();
  }

  /**
   * Widget mounted
   */
  onMount() {
    super.onMount();
    log.info(module, 'Mounted and ready');
  }

  /**
   * Widget destroyed
   */
  onDestroy() {
    // Destroy carousel if it exists
    if (this.carousel) {
      this.carousel.destroy();
      this.carousel = null;
    }
    
    // Clean up event listeners
    if (this._clickHandler) {
      this.element?.removeEventListener('click', this._clickHandler);
    }
    if (this._imageErrorHandler) {
      this.element?.removeEventListener('error', this._imageErrorHandler, true);
    }
    
    super.onDestroy();
  }
}
