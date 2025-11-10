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
      icon: '🔍',
      description: 'Universal search with multiple engines',
      category: 'productivity',
      updateInterval: null // No auto-update needed
    });

    // Search state
    this.query = '';
    this.focused = false;
    this.suggestions = [];

    // Search engines configuration
    this.engines = {
      google: {
        name: 'Google',
        icon: '🔍',
        url: 'https://www.google.com/search?q=',
        suggest: 'https://suggestqueries.google.com/complete/search?client=firefox&q='
      },
      duckduckgo: {
        name: 'DuckDuckGo',
        icon: '🦆',
        url: 'https://duckduckgo.com/?q='
      },
      bing: {
        name: 'Bing',
        icon: '🅱️',
        url: 'https://www.bing.com/search?q='
      },
      youtube: {
        name: 'YouTube',
        icon: '📺',
        url: 'https://www.youtube.com/results?search_query='
      },
      github: {
        name: 'GitHub',
        icon: '🐙',
        url: 'https://github.com/search?q='
      },
      stackoverflow: {
        name: 'Stack Overflow',
        icon: '📚',
        url: 'https://stackoverflow.com/search?q='
      },
      mdn: {
        name: 'MDN',
        icon: '📖',
        url: 'https://developer.mozilla.org/search?q='
      },
      npm: {
        name: 'npm',
        icon: '📦',
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
    if (!query || !query.trim()) return;

    const searchEngine = engine || this.settings.defaultEngine;
    const engineConfig = this.engines[searchEngine];

    if (!engineConfig) {
      console.error(`[SearchWidget] Unknown engine: ${searchEngine}`);
      return;
    }

    const searchUrl = engineConfig.url + encodeURIComponent(query.trim());

    // Open in new tab or current tab
    if (this.settings.openInNewTab) {
      chrome.tabs.create({ url: searchUrl });
    } else {
      chrome.tabs.update({ url: searchUrl });
    }

    // Emit search event
    this.emit('search:performed', {
      query: query.trim(),
      engine: searchEngine
    });

    // Clear input
    this.query = '';
    if (this.element) {
      const input = this.element.querySelector('.search-input');
      if (input) input.value = '';
    }
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
        <div class="suggestion-item" data-suggestion="${suggestion}">
          <span class="suggestion-icon">🔍</span>
          <span class="suggestion-text">${suggestion}</span>
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
      <div class="search-widget">
        <!-- Search Input -->
        <div class="search-container">
          <div class="search-input-wrapper">
            ${this.settings.showEngineSelector ? `
              <div class="search-engine-selector" data-action="select-engine">
                <span class="engine-icon">${currentEngine.icon}</span>
                <span class="engine-name">${currentEngine.name}</span>
                <span class="engine-dropdown-icon">▼</span>
              </div>
            ` : ''}
            
            <input
              type="text"
              class="search-input"
              placeholder="${this.settings.placeholder}"
              autocomplete="off"
              spellcheck="false"
            />
            
            <button class="search-button" data-action="search" title="Search">
              <span>🔍</span>
            </button>
          </div>

          <!-- Suggestions -->
          ${this.settings.showSuggestions ? `
            <div class="search-suggestions"></div>
          ` : ''}
        </div>

        <!-- Quick Engine Access -->
        ${this.settings.showEngineSelector ? `
          <div class="quick-engines">
            ${this.settings.quickEngines.map(engineKey => {
              const engine = this.engines[engineKey];
              return `
                <button 
                  class="quick-engine ${engineKey === this.settings.defaultEngine ? 'active' : ''}"
                  data-action="set-engine"
                  data-engine="${engineKey}"
                  title="${engine.name}"
                >
                  ${engine.icon}
                </button>
              `;
            }).join('')}
          </div>
        ` : ''}

        <!-- Keyboard Shortcut Hint -->
        <div class="search-hint">
          <kbd>/</kbd> to focus search
        </div>
      </div>
    `;
  }

  /**
   * Handle widget events
   * @param {Event} event - DOM event
   */
  handleEvent(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;

    if (action === 'search') {
      this.search(this.query);
    } else if (action === 'set-engine') {
      const engine = event.target.closest('[data-engine]')?.dataset.engine;
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
  setEngine(engine) {
    if (!this.engines[engine]) return;

    this.settings.defaultEngine = engine;
    
    // Update active state
    if (this.element) {
      const quickEngines = this.element.querySelectorAll('.quick-engine');
      quickEngines.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.engine === engine);
      });

      // Update selector
      const selector = this.element.querySelector('.search-engine-selector');
      if (selector) {
        const engineConfig = this.engines[engine];
        selector.innerHTML = `
          <span class="engine-icon">${engineConfig.icon}</span>
          <span class="engine-name">${engineConfig.name}</span>
          <span class="engine-dropdown-icon">▼</span>
        `;
      }
    }

    // Emit event
    this.emit('search:engine-changed', { engine });
  }

  /**
   * Show engine menu (future enhancement)
   */
  showEngineMenu() {
    // TODO: Show dropdown with all available engines
    console.log('[SearchWidget] Show engine menu');
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
   * Widget mounted
   */
  onMount() {
    super.onMount();

    // Get input element
    const input = this.element?.querySelector('.search-input');
    if (!input) return;

    // Add event listeners (only if elements exist)
    if (this.element?.querySelector('[data-action]')) {
      this.on('click', '[data-action]', (event) => this.handleEvent(event));
    }
    
    // Input events
    input.addEventListener('input', (event) => {
      this.handleInputChange(event.target.value);
    });

    input.addEventListener('focus', () => this.handleFocus());
    input.addEventListener('blur', () => this.handleBlur());

    // Suggestion click (only if suggestions container exists)
    const suggestionsContainer = this.element?.querySelector('.search-suggestions');
    if (suggestionsContainer) {
      this.on('click', '.suggestion-item', (event) => {
        const suggestion = event.target.closest('.suggestion-item')?.dataset.suggestion;
        if (suggestion) {
          this.query = suggestion;
          input.value = suggestion;
          this.search(suggestion);
        }
      });
    }

    // Keyboard shortcuts (document level)
    this.keyboardHandler = (event) => this.handleKeyboard(event);
    document.addEventListener('keydown', this.keyboardHandler);

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

    // Clear timers
    if (this.suggestionTimer) {
      clearTimeout(this.suggestionTimer);
      this.suggestionTimer = null;
    }

    super.onDestroy();
  }
}
