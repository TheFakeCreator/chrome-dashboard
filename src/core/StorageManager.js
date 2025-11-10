/**
 * @module StorageManager
 * @description Wrapper for Chrome storage API with promises and utilities
 * 
 * @example
 * const storage = new StorageManager();
 * 
 * // Save data
 * await storage.set({ theme: 'dark' });
 * 
 * // Load data
 * const data = await storage.get(['theme']);
 * 
 * // Sync storage
 * await storage.syncSet({ username: 'John' });
 */

export class StorageManager {
  constructor() {
    this.prefix = 'dashboard_';
    this.listeners = new Set();
    this.setupChangeListener();
  }

  /**
   * Get items from local storage
   * @param {string|string[]|Object} keys - Keys to retrieve
   * @returns {Promise<Object>} Retrieved data
   */
  async get(keys) {
    try {
      if (typeof keys === 'string') {
        keys = [keys];
      }

      // Add prefix to keys
      const prefixedKeys = Array.isArray(keys)
        ? keys.map(k => this.prefix + k)
        : Object.keys(keys).reduce((acc, k) => {
            acc[this.prefix + k] = keys[k];
            return acc;
          }, {});

      const result = await chrome.storage.local.get(prefixedKeys);

      // Remove prefix from results
      return this.removePrefixFromKeys(result);
    } catch (error) {
      console.error('[StorageManager] Error getting data:', error);
      throw error;
    }
  }

  /**
   * Set items in local storage
   * @param {Object} items - Items to store
   * @returns {Promise<void>}
   */
  async set(items) {
    try {
      // Add prefix to keys
      const prefixedItems = this.addPrefixToKeys(items);
      await chrome.storage.local.set(prefixedItems);
    } catch (error) {
      console.error('[StorageManager] Error setting data:', error);
      throw error;
    }
  }

  /**
   * Remove items from local storage
   * @param {string|string[]} keys - Keys to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    try {
      if (typeof keys === 'string') {
        keys = [keys];
      }

      const prefixedKeys = keys.map(k => this.prefix + k);
      await chrome.storage.local.remove(prefixedKeys);
    } catch (error) {
      console.error('[StorageManager] Error removing data:', error);
      throw error;
    }
  }

  /**
   * Clear all items from local storage (with prefix)
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      const allItems = await chrome.storage.local.get(null);
      const keysToRemove = Object.keys(allItems)
        .filter(key => key.startsWith(this.prefix));
      
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }
    } catch (error) {
      console.error('[StorageManager] Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Get items from sync storage
   * @param {string|string[]|Object} keys - Keys to retrieve
   * @returns {Promise<Object>} Retrieved data
   */
  async syncGet(keys) {
    try {
      if (typeof keys === 'string') {
        keys = [keys];
      }

      const prefixedKeys = Array.isArray(keys)
        ? keys.map(k => this.prefix + k)
        : Object.keys(keys).reduce((acc, k) => {
            acc[this.prefix + k] = keys[k];
            return acc;
          }, {});

      const result = await chrome.storage.sync.get(prefixedKeys);
      return this.removePrefixFromKeys(result);
    } catch (error) {
      console.error('[StorageManager] Error getting sync data:', error);
      throw error;
    }
  }

  /**
   * Set items in sync storage
   * @param {Object} items - Items to store
   * @returns {Promise<void>}
   */
  async syncSet(items) {
    try {
      const prefixedItems = this.addPrefixToKeys(items);
      await chrome.storage.sync.set(prefixedItems);
    } catch (error) {
      console.error('[StorageManager] Error setting sync data:', error);
      throw error;
    }
  }

  /**
   * Remove items from sync storage
   * @param {string|string[]} keys - Keys to remove
   * @returns {Promise<void>}
   */
  async syncRemove(keys) {
    try {
      if (typeof keys === 'string') {
        keys = [keys];
      }

      const prefixedKeys = keys.map(k => this.prefix + k);
      await chrome.storage.sync.remove(prefixedKeys);
    } catch (error) {
      console.error('[StorageManager] Error removing sync data:', error);
      throw error;
    }
  }

  /**
   * Get storage usage information
   * @returns {Promise<Object>} Usage info
   */
  async getBytesInUse() {
    try {
      const local = await chrome.storage.local.getBytesInUse();
      const sync = await chrome.storage.sync.getBytesInUse();

      return {
        local,
        sync,
        localMax: chrome.storage.local.QUOTA_BYTES || 5242880, // 5MB default
        syncMax: chrome.storage.sync.QUOTA_BYTES || 102400 // 100KB default
      };
    } catch (error) {
      console.error('[StorageManager] Error getting bytes in use:', error);
      return { local: 0, sync: 0, localMax: 0, syncMax: 0 };
    }
  }

  /**
   * Listen for storage changes
   * @param {Function} callback - Callback(changes, areaName)
   * @returns {Function} Unsubscribe function
   */
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Setup storage change listener
   * @private
   */
  setupChangeListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      // Filter changes to only include our prefixed keys
      const ourChanges = {};
      let hasChanges = false;

      for (const [key, change] of Object.entries(changes)) {
        if (key.startsWith(this.prefix)) {
          const unprefixedKey = key.slice(this.prefix.length);
          ourChanges[unprefixedKey] = change;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        this.listeners.forEach(callback => {
          try {
            callback(ourChanges, areaName);
          } catch (error) {
            console.error('[StorageManager] Error in change listener:', error);
          }
        });
      }
    });
  }

  /**
   * Add prefix to object keys
   * @private
   * @param {Object} obj - Object to prefix
   * @returns {Object} Prefixed object
   */
  addPrefixToKeys(obj) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[this.prefix + key] = obj[key];
      return acc;
    }, {});
  }

  /**
   * Remove prefix from object keys
   * @private
   * @param {Object} obj - Object to unprefix
   * @returns {Object} Unprefixed object
   */
  removePrefixFromKeys(obj) {
    return Object.keys(obj).reduce((acc, key) => {
      if (key.startsWith(this.prefix)) {
        acc[key.slice(this.prefix.length)] = obj[key];
      } else {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  }

  /**
   * Export all data as JSON
   * @returns {Promise<string>} JSON string of all data
   */
  async exportData() {
    try {
      const allData = await chrome.storage.local.get(null);
      const ourData = this.removePrefixFromKeys(allData);
      return JSON.stringify(ourData, null, 2);
    } catch (error) {
      console.error('[StorageManager] Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Import data from JSON
   * @param {string} jsonData - JSON string to import
   * @param {boolean} [merge=true] - Merge with existing data
   * @returns {Promise<void>}
   */
  async importData(jsonData, merge = true) {
    try {
      const data = JSON.parse(jsonData);
      
      if (!merge) {
        await this.clear();
      }
      
      await this.set(data);
    } catch (error) {
      console.error('[StorageManager] Error importing data:', error);
      throw error;
    }
  }
}
