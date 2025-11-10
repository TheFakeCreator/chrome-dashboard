/**
 * @module StateManager
 * @description Centralized state management with reactivity and persistence
 * 
 * @example
 * const state = new StateManager(eventBus);
 * 
 * // Get state
 * const theme = state.get('settings.theme');
 * 
 * // Set state
 * state.set('settings.theme', 'dark');
 * 
 * // Subscribe to changes
 * state.subscribe('settings.theme', (newTheme) => {
 *   console.log('Theme changed:', newTheme);
 * });
 */

export class StateManager {
  /**
   * @param {import('./EventBus.js').EventBus} eventBus - Event bus instance
   */
  constructor(eventBus) {
    this.eventBus = eventBus;
    
    /** @type {Object} Application state */
    this.state = {
      user: {
        name: 'User',
        preferences: {}
      },
      settings: {
        theme: 'dark',
        compactMode: false,
        animations: true,
        notifications: true
      },
      widgets: [],
      layout: {
        columns: 4,
        gap: 16,
        padding: 24
      },
      focus: {
        active: false,
        sessionCount: 0
      }
    };

    /** @type {Map<string, Set<Function>>} Path-specific subscribers */
    this.subscribers = new Map();
  }

  /**
   * Get value from state using dot notation path
   * @param {string} path - Dot notation path (e.g., 'settings.theme')
   * @param {*} [defaultValue] - Default value if path doesn't exist
   * @returns {*} Value at path
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let value = this.state;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set value in state using dot notation path
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   * @param {boolean} [silent=false] - If true, don't emit events
   */
  set(path, value, silent = false) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.state;

    // Navigate to target object
    for (const key of keys) {
      if (!(key in target)) {
        target[key] = {};
      }
      target = target[key];
    }

    // Store old value
    const oldValue = target[lastKey];

    // Set new value
    target[lastKey] = value;

    if (!silent) {
      // Emit specific path change
      this.notifySubscribers(path, value, oldValue);

      // Emit global state change event
      this.eventBus.emit('state:changed', {
        path,
        value,
        oldValue
      });
    }
  }

  /**
   * Update multiple state values at once
   * @param {Object} updates - Object with path:value pairs
   * @param {boolean} [silent=false] - If true, don't emit events
   */
  update(updates, silent = false) {
    Object.entries(updates).forEach(([path, value]) => {
      this.set(path, value, silent);
    });
  }

  /**
   * Subscribe to state changes at a specific path
   * @param {string} path - Dot notation path to watch
   * @param {Function} callback - Callback function (newValue, oldValue) => {}
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }

    this.subscribers.get(path).add(callback);

    // Return unsubscribe function
    return () => this.unsubscribe(path, callback);
  }

  /**
   * Unsubscribe from state changes
   * @param {string} path - Path to unsubscribe from
   * @param {Function} callback - Callback to remove
   */
  unsubscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      return;
    }

    this.subscribers.get(path).delete(callback);

    if (this.subscribers.get(path).size === 0) {
      this.subscribers.delete(path);
    }
  }

  /**
   * Notify subscribers of a path change
   * @private
   * @param {string} path - Changed path
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   */
  notifySubscribers(path, newValue, oldValue) {
    // Notify exact path subscribers
    if (this.subscribers.has(path)) {
      this.subscribers.get(path).forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`[StateManager] Error in subscriber for "${path}":`, error);
        }
      });
    }

    // Notify parent path subscribers (e.g., 'settings' when 'settings.theme' changes)
    const pathParts = path.split('.');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('.');
      if (this.subscribers.has(parentPath)) {
        const parentValue = this.get(parentPath);
        this.subscribers.get(parentPath).forEach(callback => {
          try {
            callback(parentValue, parentValue);
          } catch (error) {
            console.error(`[StateManager] Error in parent subscriber for "${parentPath}":`, error);
          }
        });
      }
    }
  }

  /**
   * Get entire state object (immutable copy)
   * @returns {Object} Deep copy of state
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Replace entire state (use with caution)
   * @param {Object} newState - New state object
   * @param {boolean} [merge=true] - If true, merge with existing state
   */
  setState(newState, merge = true) {
    if (merge) {
      this.state = this.deepMerge(this.state, newState);
    } else {
      this.state = newState;
    }

    this.eventBus.emit('state:replaced', this.state);
  }

  /**
   * Deep merge two objects
   * @private
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Check if value is a plain object
   * @private
   * @param {*} item - Value to check
   * @returns {boolean}
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Reset state to initial values
   */
  reset() {
    this.state = {
      user: {
        name: 'User',
        preferences: {}
      },
      settings: {
        theme: 'dark',
        compactMode: false,
        animations: true,
        notifications: true
      },
      widgets: [],
      layout: {
        columns: 4,
        gap: 16,
        padding: 24
      },
      focus: {
        active: false,
        sessionCount: 0
      }
    };

    this.eventBus.emit('state:reset');
  }

  /**
   * Create a computed value that updates automatically
   * @param {Function} computeFn - Function that computes value from state
   * @param {string[]} dependencies - Paths to watch for changes
   * @returns {Object} Object with value and destroy method
   */
  computed(computeFn, dependencies = []) {
    let currentValue = computeFn(this.state);
    const unsubscribers = [];

    // Subscribe to all dependencies
    dependencies.forEach(path => {
      const unsub = this.subscribe(path, () => {
        const newValue = computeFn(this.state);
        if (newValue !== currentValue) {
          currentValue = newValue;
        }
      });
      unsubscribers.push(unsub);
    });

    return {
      get value() {
        return currentValue;
      },
      destroy() {
        unsubscribers.forEach(unsub => unsub());
      }
    };
  }
}
