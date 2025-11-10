/**
 * @module EventBus
 * @description Central event system for decoupled communication between components
 * 
 * @example
 * const eventBus = new EventBus();
 * 
 * // Subscribe to event
 * eventBus.on('user:login', (user) => {
 *   console.log('User logged in:', user);
 * });
 * 
 * // Emit event
 * eventBus.emit('user:login', { name: 'John' });
 */

export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
    this.debug = false;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(callback);

    if (this.debug) {
      console.log(`[EventBus] Subscribed to "${event}"`);
    }

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return;
    }

    this.listeners.get(event).delete(callback);

    // Clean up empty event sets
    if (this.listeners.get(event).size === 0) {
      this.listeners.delete(event);
    }

    if (this.debug) {
      console.log(`[EventBus] Unsubscribed from "${event}"`);
    }
  }

  /**
   * Subscribe to an event once (auto-unsubscribe after first emission)
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };

    return this.on(event, wrapper);
  }

  /**
   * Emit an event with optional data
   * @param {string} event - Event name
   * @param {*} data - Data to pass to callbacks
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      if (this.debug) {
        console.log(`[EventBus] No listeners for "${event}"`);
      }
      return;
    }

    if (this.debug) {
      console.log(`[EventBus] Emitting "${event}"`, data);
    }

    // Execute all callbacks
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in "${event}" listener:`, error);
      }
    });
  }

  /**
   * Emit an event asynchronously
   * @param {string} event - Event name
   * @param {*} data - Data to pass to callbacks
   * @returns {Promise<void>}
   */
  async emitAsync(event, data) {
    if (!this.listeners.has(event)) {
      return;
    }

    const callbacks = Array.from(this.listeners.get(event));
    
    for (const callback of callbacks) {
      try {
        await callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in async "${event}" listener:`, error);
      }
    }
  }

  /**
   * Remove all listeners for an event or all events
   * @param {string} [event] - Event name (optional, removes all if not provided)
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);
      if (this.debug) {
        console.log(`[EventBus] Cleared listeners for "${event}"`);
      }
    } else {
      this.listeners.clear();
      if (this.debug) {
        console.log('[EventBus] Cleared all listeners');
      }
    }
  }

  /**
   * Get count of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.listeners.has(event) ? this.listeners.get(event).size : 0;
  }

  /**
   * Get all event names
   * @returns {string[]} Array of event names
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
}
