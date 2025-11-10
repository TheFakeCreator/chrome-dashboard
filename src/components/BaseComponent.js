/**
 * @module BaseComponent
 * @description Base class for all UI components with lifecycle management
 * 
 * @example
 * class MyComponent extends BaseComponent {
 *   constructor(app, options) {
 *     super(app, options);
 *     this.data = [];
 *   }
 * 
 *   onInit() {
 *     console.log('Component initialized');
 *   }
 * 
 *   render() {
 *     return `<div class="my-component">${this.data.length} items</div>`;
 *   }
 * 
 *   onMount() {
 *     this.element.addEventListener('click', this.handleClick);
 *   }
 * }
 */

export class BaseComponent {
  /**
   * @param {Object} app - App instance
   * @param {Object} options - Component options
   */
  constructor(app, options = {}) {
    // Core references
    this.app = app;
    this.eventBus = app.eventBus;
    this.state = app.stateManager;
    this.storage = app.storageManager;
    this.config = app.configManager;

    // Component identity
    this.id = options.id || this.generateId();
    this.name = options.name || this.constructor.name;

    // Component options
    this.options = {
      autoMount: true,
      autoRender: true,
      ...options
    };

    // Component state
    this.element = null;
    this.container = null;
    this.mounted = false;
    this.destroyed = false;

    // Event handlers registry
    this.handlers = new Map();
    this.subscriptions = [];
    this.intervals = [];
    this.timeouts = [];

    // Performance tracking
    this.renderCount = 0;
    this.lastRenderTime = 0;

    // Lifecycle: Initialize
    this.onInit();
    
    // Auto render if enabled
    if (this.options.autoRender) {
      this.refresh();
    }
  }

  /**
   * Generate unique component ID
   * @private
   * @returns {string} Unique ID
   */
  generateId() {
    return `${this.constructor.name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Lifecycle: Component initialized (override in subclass)
   */
  onInit() {
    // Override in subclass
  }

  /**
   * Lifecycle: Before component renders (override in subclass)
   */
  onBeforeRender() {
    // Override in subclass
  }

  /**
   * Lifecycle: Render component HTML (MUST override in subclass)
   * @returns {string} HTML string
   */
  render() {
    throw new Error(`${this.name}: render() method must be implemented`);
  }

  /**
   * Lifecycle: After component renders (override in subclass)
   */
  onAfterRender() {
    // Override in subclass
  }

  /**
   * Lifecycle: Component mounted to DOM (override in subclass)
   */
  onMount() {
    // Override in subclass
  }

  /**
   * Lifecycle: Component updated (override in subclass)
   * @param {Object} changes - What changed
   */
  onUpdate(changes) {
    // Override in subclass
  }

  /**
   * Lifecycle: Before component destroys (override in subclass)
   */
  onBeforeDestroy() {
    // Override in subclass
  }

  /**
   * Lifecycle: Component destroyed (override in subclass)
   */
  onDestroy() {
    // Override in subclass
  }

  /**
   * Render and update component
   * @returns {HTMLElement} Component element
   */
  refresh() {
    const startTime = performance.now();

    // Before render
    this.onBeforeRender();

    // Render
    const html = this.render();
    
    // Create element if needed
    if (!this.element) {
      this.element = this.createElement(html);
    } else {
      // Update existing element
      this.element.innerHTML = html;
    }

    // After render
    this.onAfterRender();

    // Track performance
    this.renderCount++;
    this.lastRenderTime = performance.now() - startTime;

    // Auto mount if not mounted
    if (this.options.autoMount && !this.mounted && this.container) {
      this.mount(this.container);
    }

    return this.element;
  }

  /**
   * Create DOM element from HTML string
   * @private
   * @param {string} html - HTML string
   * @returns {HTMLElement} Created element
   */
  createElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
  }

  /**
   * Mount component to container
   * @param {HTMLElement|string} container - Container element or selector
   * @returns {BaseComponent} This component for chaining
   */
  mount(container) {
    if (this.mounted) {
      console.warn(`${this.name}: Already mounted`);
      return this;
    }

    if (this.destroyed) {
      throw new Error(`${this.name}: Cannot mount destroyed component`);
    }

    // Get container element
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (!container) {
      throw new Error(`${this.name}: Container not found`);
    }

    this.container = container;

    // Append to container
    if (!this.element) {
      this.refresh();
    }

    container.appendChild(this.element);
    this.mounted = true;

    // Lifecycle: Mounted
    this.onMount();

    // Emit event
    this.emit('mounted');

    return this;
  }

  /**
   * Unmount component from DOM
   * @returns {BaseComponent} This component for chaining
   */
  unmount() {
    if (!this.mounted) {
      return this;
    }

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.mounted = false;
    this.emit('unmounted');

    return this;
  }

  /**
   * Update component with new data
   * @param {Object} changes - Changes to apply
   * @returns {BaseComponent} This component for chaining
   */
  update(changes = {}) {
    // Apply changes
    Object.assign(this, changes);

    // Lifecycle: Update
    this.onUpdate(changes);

    // Re-render
    this.refresh();

    // Emit event
    this.emit('updated', changes);

    return this;
  }

  /**
   * Query element within component
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null} Found element
   */
  $(selector) {
    return this.element?.querySelector(selector);
  }

  /**
   * Query all elements within component
   * @param {string} selector - CSS selector
   * @returns {NodeList} Found elements
   */
  $$(selector) {
    return this.element?.querySelectorAll(selector) || [];
  }

  /**
   * Add event listener to element
   * @param {HTMLElement|string} target - Target element or selector
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   */
  on(target, event, handler, options) {
    // Get target element
    if (typeof target === 'string') {
      target = this.$(target);
    }

    if (!target) {
      console.warn(`${this.name}: Target not found for event '${event}'`);
      return;
    }

    // Bind handler to this component
    const boundHandler = handler.bind(this);

    // Store handler for cleanup
    const key = `${target.tagName}-${event}`;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    this.handlers.get(key).push({ target, event, handler: boundHandler, options });

    // Add listener
    target.addEventListener(event, boundHandler, options);
  }

  /**
   * Remove event listener
   * @param {HTMLElement|string} target - Target element or selector
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  off(target, event, handler) {
    if (typeof target === 'string') {
      target = this.$(target);
    }

    if (!target) return;

    target.removeEventListener(event, handler);
  }

  /**
   * Emit custom event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    this.eventBus.emit(`component:${this.id}:${event}`, {
      component: this,
      data
    });
  }

  /**
   * Subscribe to state changes
   * @param {string} path - State path
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback) {
    const unsubscribe = this.state.subscribe(path, callback.bind(this));
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Set interval (auto-cleaned on destroy)
   * @param {Function} callback - Callback function
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Interval ID
   */
  setInterval(callback, delay) {
    const id = window.setInterval(callback.bind(this), delay);
    this.intervals.push(id);
    return id;
  }

  /**
   * Set timeout (auto-cleaned on destroy)
   * @param {Function} callback - Callback function
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Timeout ID
   */
  setTimeout(callback, delay) {
    const id = window.setTimeout(callback.bind(this), delay);
    this.timeouts.push(id);
    return id;
  }

  /**
   * Destroy component and cleanup
   */
  destroy() {
    if (this.destroyed) {
      return;
    }

    // Lifecycle: Before destroy
    this.onBeforeDestroy();

    // Unmount if mounted
    if (this.mounted) {
      this.unmount();
    }

    // Clean up event listeners
    this.handlers.forEach(handlers => {
      handlers.forEach(({ target, event, handler, options }) => {
        target.removeEventListener(event, handler, options);
      });
    });
    this.handlers.clear();

    // Clean up subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];

    // Clean up intervals
    this.intervals.forEach(id => window.clearInterval(id));
    this.intervals = [];

    // Clean up timeouts
    this.timeouts.forEach(id => window.clearTimeout(id));
    this.timeouts = [];

    // Clear element
    this.element = null;
    this.container = null;

    // Mark as destroyed
    this.destroyed = true;

    // Lifecycle: Destroyed
    this.onDestroy();

    // Emit event
    this.emit('destroyed');
  }

  /**
   * Get component info for debugging
   * @returns {Object} Component info
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      mounted: this.mounted,
      destroyed: this.destroyed,
      renderCount: this.renderCount,
      lastRenderTime: this.lastRenderTime,
      handlers: this.handlers.size,
      subscriptions: this.subscriptions.length,
      intervals: this.intervals.length,
      timeouts: this.timeouts.length
    };
  }
}
