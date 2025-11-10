/**
 * @module SearchWidget
 * @description Universal search widget with multiple search engines and suggestions
 * 
 * @example
 * const search = new SearchWidget(app, {
 *   settings: { 
 *     defaultEngine: 'google',
 *     showSuggestions: true,
 *     openInNewTab: true
 *   }
 * });
 * search.mount('#widget-grid');
 */

import { BaseWidget } from '../widgets/BaseWidget.js';

export class SearchWidget extends BaseWidget {
  constructor(app, options = {}) {
    // Call super first
    super(app, {
      ...options,
      name: 'Search',
      title: 'Search',
      icon: '<i data-lucide="search" class="w-5 h-5"></i>',
      description: 'Universal search with multiple engines',
      category: 'productivity',
      updateInterval: null // No auto-update needed
    });

    // Search state
    this.query = '';
    this.focused = false;
    this.suggestions = [];
    this.hintDismissed = false; // Track if hint has been dismissed

    // Search engines configuration
    this.engines = {
      google: {
        name: 'Google',
        icon: '<i data-lucide="search" class="w-4 h-4"></i>',
        url: 'https://www.google.com/search?q=',
        suggest: 'https://suggestqueries.google.com/complete/search?client=firefox&q='
      },
      duckduckgo: {
        name: 'DuckDuckGo',
        icon: '<i data-lucide="shield" class="w-4 h-4"></i>',
        url: 'https://duckduckgo.com/?q='
      },
      bing: {
        name: 'Bing',
        icon: '<i data-lucide="globe" class="w-4 h-4"></i>',
        url: 'https://www.bing.com/search?q='
      },
      youtube: {
        name: 'YouTube',
        icon: '<i data-lucide="video" class="w-4 h-4"></i>',
        url: 'https://www.youtube.com/results?search_query='
      },
      github: {
        name: 'GitHub',
        icon: '<i data-lucide="github" class="w-4 h-4"></i>',
        url: 'https://github.com/search?q='
      },
      stackoverflow: {
        name: 'Stack Overflow',
        icon: '<i data-lucide="layers" class="w-4 h-4"></i>',
        url: 'https://stackoverflow.com/search?q='
      },
      mdn: {
        name: 'MDN',
        icon: '<i data-lucide="book-open" class="w-4 h-4"></i>',
        url: 'https://developer.mozilla.org/search?q='
      },
      npm: {
        name: 'npm',
        icon: '<i data-lucide="package" class="w-4 h-4"></i>',
        url: 'https://www.npmjs.com/search?q='
      }
    };

    // Debounce timer for suggestions
    this.suggestionTimer = null;
    this.suggestionDelay = 300;

    // Initialize data now that engines are set
    if (!this.data) {
      this.data = {
        query: this.query,
        selectedEngine: this.settings.defaultEngine,
        engines: Object.keys(this.engines)
      };
    }
  }

  /**
   * Get default settings
   * @returns {Object} Default settings
   */
  getDefaultSettings() {
    return {
      defaultEngine: 'google',
      showSuggestions: false, // Disabled by default due to CORS
      openInNewTab: true,
      showEngineSelector: true,
      placeholder: 'Search the web...',
      quickEngines: ['google', 'youtube', 'github'] // Quick access engines
    };
  }

  /**
   * Load widget data
   * @returns {Promise<void>}
   */
  async loadData() {
    // Ensure settings are initialized
    if (!this.settings) {
      this.settings = this.getDefaultSettings();
    }

    // Ensure engines are initialized (they're set in constructor, this is just a safety check)
    if (!this.engines) {
      console.warn('[SearchWidget] Engines not yet initialized, skipping loadData');
      return;
    }

    // No initial data to load
    this.data = {
      query: this.query,
      selectedEngine: this.settings.defaultEngine,
      engines: Object.keys(this.engines)
    };
  }

  /**
   * Perform search
   * @param {string} query - Search query
   * @param {string} engine - Search engine
   */
  search(query, engine = null) {
    if (!query || !query.trim()) {
      console.log('[SearchWidget] Search called with empty query');
      return;
    }

    const searchEngine = engine || this.settings.defaultEngine;
    const engineConfig = this.engines[searchEngine];

    if (!engineConfig) {
      console.error(`[SearchWidget] Unknown engine: ${searchEngine}`);
      return;
    }

    const searchUrl = engineConfig.url + encodeURIComponent(query.trim());
    console.log('[SearchWidget] Searching:', query.trim(), 'on', searchEngine, 'URL:', searchUrl);

    // Open in new tab or current tab
    if (this.settings.openInNewTab) {
      console.log('[SearchWidget] Opening in new tab');
      chrome.tabs.create({ url: searchUrl });
    } else {
      console.log('[SearchWidget] Opening in current tab');
      chrome.tabs.update({ url: searchUrl });
    }

    // Emit search event
    this.emit('search:performed', {
      query: query.trim(),
      engine: searchEngine
    });

    // Keep the query for potential re-search with different engine
    // Don't clear input after search
    console.log('[SearchWidget] Search completed successfully');
  }

  /**
   * Handle input change
   * @param {string} value - Input value
   */
  handleInputChange(value) {
    this.query = value;

    // Get suggestions if enabled
    if (this.settings.showSuggestions && value.trim()) {
      this.debounceSuggestions(value.trim());
    } else {
      this.suggestions = [];
      this.updateSuggestions();
    }
  }

  /**
   * Debounce suggestions
   * @param {string} query - Search query
   */
  debounceSuggestions(query) {
    if (this.suggestionTimer) {
      clearTimeout(this.suggestionTimer);
    }

    this.suggestionTimer = setTimeout(() => {
      this.fetchSuggestions(query);
    }, this.suggestionDelay);
  }

  /**
   * Fetch search suggestions
   * @param {string} query - Search query
   */
  async fetchSuggestions(query) {
    const engine = this.engines[this.settings.defaultEngine];

    if (!engine.suggest) {
      return; // Engine doesn't support suggestions
    }

    try {
      const response = await fetch(engine.suggest + encodeURIComponent(query));
      const data = await response.json();

      // Google suggest returns array like: ["query", ["suggestion1", "suggestion2", ...]]
      if (Array.isArray(data) && data.length >= 2) {
        this.suggestions = data[1].slice(0, 5); // Limit to 5 suggestions
        this.updateSuggestions();
      }
    } catch (error) {
      console.warn('[SearchWidget] Failed to fetch suggestions:', error);
      this.suggestions = [];
    }
  }

  /**
   * Update suggestions in DOM
   */
  updateSuggestions() {
    if (!this.element) return;

    const suggestionsContainer = this.element.querySelector('.search-suggestions');
    if (!suggestionsContainer) return;

    if (this.suggestions.length === 0) {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.classList.remove('visible');
      return;
    }

    suggestionsContainer.innerHTML = this.suggestions
      .map(suggestion => `
        <div class="suggestion-item flex items-center gap-2 px-3 py-2 hover:bg-dark-elevated cursor-pointer transition-colors" data-suggestion="${suggestion}">
          <i data-lucide="search" class="w-4 h-4 text-dark-muted"></i>
          <span class="text-sm text-dark-text">${suggestion}</span>
        </div>
      `)
      .join('');

    suggestionsContainer.classList.add('visible');
  }

  /**
   * Handle input focus
   */
  handleFocus() {
    this.focused = true;
    if (this.element) {
      this.element.classList.add('focused');
    }
  }

  /**
   * Handle input blur
   */
  handleBlur() {
    // Delay to allow clicking suggestions
    setTimeout(() => {
      this.focused = false;
      if (this.element) {
        this.element.classList.remove('focused');
      }
      this.suggestions = [];
      this.updateSuggestions();
    }, 200);
  }

  /**
   * Render widget content
   * @returns {string} HTML string
   */
  render() {
    const currentEngine = this.engines[this.settings.defaultEngine];

    return `
      <div class="space-y-4">
        <!-- Search Input -->
        <div class="space-y-2">
          <!-- Hint for new users (only shown if not dismissed) -->
          ${!this.hintDismissed ? `
            <div class="text-center text-xs text-dark-muted/70 search-hint">
              Press <kbd class="px-1.5 py-0.5 bg-dark-surface border border-dark-border rounded text-[10px]">Tab</kbd> 3 times to start searching
            </div>
          ` : ''}
          
          <div class="relative flex items-center gap-2 bg-dark-elevated border border-dark-border rounded-lg p-3 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
            ${this.settings.showEngineSelector ? `
              <button class="flex items-center gap-2 px-2 py-1 rounded hover:bg-dark-surface transition-colors" data-action="select-engine">
                <span class="text-lg">${currentEngine.icon}</span>
                <span class="text-sm font-medium text-dark-text">${currentEngine.name}</span>
                <i data-lucide="chevron-down" class="w-4 h-4 text-dark-muted"></i>
              </button>
            ` : ''}
            
            <input
              type="text"
              class="search-input flex-1 bg-transparent border-none outline-none text-dark-text placeholder-dark-muted"
              placeholder="${this.settings.placeholder}"
              value="${this.query || ''}"
              autocomplete="off"
              spellcheck="false"
              autofocus
            />
            
            <button class="p-2 rounded-lg hover:bg-dark-surface transition-colors" data-action="search" title="Search">
              <i data-lucide="search" class="w-5 h-5 text-dark-muted"></i>
            </button>
          </div>

          <!-- Suggestions -->
          ${this.settings.showSuggestions ? `
            <div class="search-suggestions hidden"></div>
          ` : ''}
        </div>

        <!-- Quick Engine Access -->
        ${this.settings.showEngineSelector ? `
          <div class="flex items-center gap-2 flex-wrap">
            ${this.settings.quickEngines.map(engineKey => {
              const engine = this.engines[engineKey];
              const isActive = engineKey === this.settings.defaultEngine;
              return `
                <button 
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    isActive 
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                      : 'bg-dark-elevated text-dark-muted hover:bg-dark-surface border border-transparent'
                  }"
                  data-action="set-engine"
                  data-engine="${engineKey}"
                  title="${engine.name}"
                >
                  <span class="text-base">${engine.icon}</span>
                  <span class="font-medium">${engine.name}</span>
                </button>
              `;
            }).join('')}
          </div>
        ` : ''}

        <!-- Keyboard Shortcut Hint -->
        <div class="flex items-center justify-center gap-2 text-xs text-dark-muted">
          <kbd class="px-2 py-1 bg-dark-elevated border border-dark-border rounded font-mono">/</kbd>
          <span>to focus search</span>
        </div>
      </div>
    `;
  }

  /**
   * Handle widget events
   * @param {Event} event - DOM event
   */
  handleEvent(event) {
    const actionElement = event.target.closest('[data-action]');
    const action = actionElement?.dataset.action;
    
    console.log('[SearchWidget] handleEvent - action:', action, 'target:', event.target);

    if (action === 'search') {
      this.search(this.query);
    } else if (action === 'set-engine') {
      const engine = event.target.closest('[data-engine]')?.dataset.engine;
      console.log('[SearchWidget] Setting engine to:', engine);
      if (engine) {
        this.setEngine(engine);
      }
    } else if (action === 'select-engine') {
      this.showEngineMenu();
    }
  }

  /**
   * Set search engine
   * @param {string} engine - Engine key
   */
  async setEngine(engine) {
    if (!this.engines[engine]) return;

    console.log('[SearchWidget] Engine changed from', this.settings.defaultEngine, 'to', engine);
    
    // Update settings (this will save and refresh automatically)
    await this.updateSettings({ defaultEngine: engine });
    
    // Emit event
    this.emit('search:engine-changed', { engine });
  }

  /**
   * Cycle through search engines
   * @param {string} direction - 'next' or 'prev'
   */
  async cycleEngine(direction = 'next') {
    const engineKeys = Object.keys(this.engines);
    const currentIndex = engineKeys.indexOf(this.settings.defaultEngine);
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % engineKeys.length;
    } else {
      nextIndex = (currentIndex - 1 + engineKeys.length) % engineKeys.length;
    }
    
    const nextEngine = engineKeys[nextIndex];
    console.log('[SearchWidget] Cycling engine:', direction, '->', nextEngine);
    
    await this.setEngine(nextEngine);
    
    // Re-focus the input after engine change (after refresh)
    setTimeout(() => {
      const input = this.element?.querySelector('.search-input');
      if (input) {
        input.focus();
      }
    }, 0);
  }

  /**
   * Show engine menu
   */
  async showEngineMenu() {
    console.log('[SearchWidget] Show engine menu');
    
    // Create a temporary dropdown overlay
    const dropdown = document.createElement('div');
    dropdown.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm';
    dropdown.innerHTML = `
      <div class="bg-dark-card border border-dark-border rounded-lg shadow-2xl max-w-sm w-full mx-4 p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-dark-text">Select Search Engine</h3>
          <button class="p-1 rounded hover:bg-dark-elevated transition-colors" data-action="close-menu">
            <i data-lucide="x" class="w-5 h-5 text-dark-muted"></i>
          </button>
        </div>
        <div class="space-y-1 max-h-96 overflow-y-auto">
          ${Object.entries(this.engines).map(([key, engine]) => `
            <button 
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                key === this.settings.defaultEngine
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'hover:bg-dark-elevated text-dark-text'
              }"
              data-action="set-engine"
              data-engine="${key}"
            >
              <span class="text-2xl">${engine.icon}</span>
              <div class="flex-1">
                <div class="font-medium">${engine.name}</div>
                <div class="text-xs text-dark-muted">${engine.url.split('//')[1].split('/')[0]}</div>
              </div>
              ${key === this.settings.defaultEngine ? `
                <i data-lucide="check" class="w-5 h-5 text-primary-400"></i>
              ` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    // Close on overlay click
    dropdown.addEventListener('click', (e) => {
      if (e.target === dropdown || e.target.closest('[data-action="close-menu"]')) {
        dropdown.remove();
      }
    });
    
    // Handle engine selection
    dropdown.addEventListener('click', (e) => {
      const engineBtn = e.target.closest('[data-engine]');
      if (engineBtn) {
        const engine = engineBtn.dataset.engine;
        this.setEngine(engine);
        dropdown.remove();
      }
    });
    
    document.body.appendChild(dropdown);
    
    // Initialize icons in dropdown
    const { initIcons } = await import('../utils/icons.js');
    initIcons();
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyboard(event) {
    const input = this.element?.querySelector('.search-input');
    if (!input) return;

    // Focus on "/" key
    if (event.key === '/' && document.activeElement !== input) {
      event.preventDefault();
      input.focus();
    }

    // Search on Enter
    if (event.key === 'Enter' && document.activeElement === input) {
      event.preventDefault();
      this.search(this.query);
    }

    // Clear on Escape
    if (event.key === 'Escape' && document.activeElement === input) {
      event.preventDefault();
      input.value = '';
      this.query = '';
      this.suggestions = [];
      this.updateSuggestions();
      input.blur();
    }
  }

  /**
   * Setup event listeners for search widget
   * @private
   */
  setupSearchEventListeners() {
    // Get input element
    const input = this.element?.querySelector('.search-input');
    if (!input) return;

    // Remove old listeners if they exist
    if (this._clickHandler) {
      this.element.removeEventListener('click', this._clickHandler);
    }
    if (this._inputHandler) {
      input.removeEventListener('input', this._inputHandler);
    }
    if (this._focusHandler) {
      input.removeEventListener('focus', this._focusHandler);
    }
    if (this._blurHandler) {
      input.removeEventListener('blur', this._blurHandler);
    }

    // Add click event listener to the widget element for all actions
    this._clickHandler = (event) => {
      const actionElement = event.target.closest('[data-action]');
      if (actionElement) {
        event.preventDefault();
        this.handleEvent(event);
      }
    };
    this.element.addEventListener('click', this._clickHandler);
    
    // Input events
    this._inputHandler = (event) => {
      this.handleInputChange(event.target.value);
    };
    input.addEventListener('input', this._inputHandler);

    this._focusHandler = () => {
      this.handleFocus();
      // Hide the hint permanently when user focuses the search input
      if (!this.hintDismissed) {
        this.hintDismissed = true;
        const hint = this.element?.querySelector('.search-hint');
        if (hint) {
          hint.remove(); // Remove instead of hide to prevent it from coming back
        }
      }
    };
    input.addEventListener('focus', this._focusHandler);

    this._blurHandler = () => this.handleBlur();
    input.addEventListener('blur', this._blurHandler);

    // Keyboard navigation for cycling engines
    if (this._keydownHandler) {
      input.removeEventListener('keydown', this._keydownHandler);
    }
    
    this._keydownHandler = (event) => {
      // Tab key: cycle forward (when input is empty or cursor at start)
      if (event.key === 'Tab' && (input.value === '' || input.selectionStart === 0)) {
        event.preventDefault();
        this.cycleEngine('next');
      }
      // Arrow Up: cycle to previous engine
      else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.cycleEngine('prev');
      }
      // Arrow Down: cycle to next engine
      else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.cycleEngine('next');
      }
    };
    input.addEventListener('keydown', this._keydownHandler);

    // Suggestion click (only if suggestions container exists)
    const suggestionsContainer = this.element?.querySelector('.search-suggestions');
    if (suggestionsContainer) {
      if (this._suggestionHandler) {
        suggestionsContainer.removeEventListener('click', this._suggestionHandler);
      }
      
      this._suggestionHandler = (event) => {
        const suggestionItem = event.target.closest('.suggestion-item');
        if (suggestionItem) {
          const suggestion = suggestionItem.dataset.suggestion;
          if (suggestion) {
            this.query = suggestion;
            input.value = suggestion;
            this.search(suggestion);
          }
        }
      };
      suggestionsContainer.addEventListener('click', this._suggestionHandler);
    }
  }

  /**
   * Lifecycle: After render
   */
  onAfterRender() {
    super.onAfterRender();
    
    // Re-attach event listeners after every render
    this.setupSearchEventListeners();
  }

  /**
   * Widget mounted
   */
  onMount() {
    super.onMount();

    // Setup keyboard shortcuts (document level) - only once
    if (!this.keyboardHandler) {
      this.keyboardHandler = (event) => this.handleKeyboard(event);
      document.addEventListener('keydown', this.keyboardHandler);
    }

    console.log('[SearchWidget] Mounted and ready');
  }

  /**
   * Widget destroyed
   */
  onDestroy() {
    // Remove keyboard listener
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }

    // Remove input keydown handler
    const input = this.element?.querySelector('.search-input');
    if (input && this._keydownHandler) {
      input.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null;
    }

    // Clear timers
    if (this.suggestionTimer) {
      clearTimeout(this.suggestionTimer);
      this.suggestionTimer = null;
    }

    super.onDestroy();
  }
}
