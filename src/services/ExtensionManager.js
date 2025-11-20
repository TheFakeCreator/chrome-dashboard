/**
 * ExtensionManager Service
 * 
 * Manages Chrome extensions using the chrome.management API.
 * Provides methods to list, enable/disable, and monitor extensions.
 * 
 * @example
 * const manager = new ExtensionManager();
 * await manager.initialize();
 * const extensions = await manager.getAllExtensions();
 * await manager.toggleExtension(extensionId);
 */

import { logger as log } from '../utils/logger.js';

const module = 'ExtensionManager';

export class ExtensionManager {
  constructor() {
    this.extensions = [];
    this.listeners = new Map();
    this.initialized = false;
    
    log.info(module, 'Initialized');
  }

  /**
   * Initialize the extension manager
   * Load extensions and setup listeners
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load all extensions
      await this.refreshExtensions();

      // Setup listeners for extension state changes
      this._setupListeners();

      this.initialized = true;
      log.info(module, 'Initialized with', this.extensions.length, 'extensions');
    } catch (error) {
      log.error(module, 'Initialization error:', error);
      throw error;
    }
  }

  /**
   * Get all installed extensions (excluding this dashboard and apps)
   * @returns {Promise<Array>} Array of extension info objects
   */
  async getAllExtensions() {
    try {
      const all = await chrome.management.getAll();
      
      // Filter out:
      // - This extension (dashboard itself)
      // - Chrome apps (type === 'hosted_app' or 'packaged_app')
      // - Themes
      const currentExtensionId = chrome.runtime.id;
      
      this.extensions = all.filter(ext => {
        return ext.id !== currentExtensionId &&
               ext.type === 'extension' &&
               ext.enabled !== undefined;
      });

      return this.extensions;
    } catch (error) {
      log.error(module, 'Error getting extensions:', error);
      return [];
    }
  }

  /**
   * Refresh the extensions list
   * @returns {Promise<Array>} Updated extensions list
   */
  async refreshExtensions() {
    return await this.getAllExtensions();
  }

  /**
   * Get a specific extension by ID
   * @param {string} extensionId - Extension ID
   * @returns {Promise<Object>} Extension info
   */
  async getExtension(extensionId) {
    try {
      return await chrome.management.get(extensionId);
    } catch (error) {
      log.error(module, 'Error getting extension:', error);
      return null;
    }
  }

  /**
   * Toggle extension enabled state
   * @param {string} extensionId - Extension ID
   * @returns {Promise<boolean>} New enabled state
   */
  async toggleExtension(extensionId) {
    try {
      const extension = await this.getExtension(extensionId);
      if (!extension) return false;

      const newState = !extension.enabled;
      await chrome.management.setEnabled(extensionId, newState);
      
      log.info(module, `Toggled ${extension.name} to ${newState ? 'ON' : 'OFF'}`);
      return newState;
    } catch (error) {
      log.error(module, 'Error toggling extension:', error);
      throw error;
    }
  }

  /**
   * Enable an extension
   * @param {string} extensionId - Extension ID
   */
  async enableExtension(extensionId) {
    try {
      await chrome.management.setEnabled(extensionId, true);
      log.info(module, `Enabled extension ${extensionId}`);
    } catch (error) {
      log.error(module, 'Error enabling extension:', error);
      throw error;
    }
  }

  /**
   * Disable an extension
   * @param {string} extensionId - Extension ID
   */
  async disableExtension(extensionId) {
    try {
      await chrome.management.setEnabled(extensionId, false);
      log.info(module, `Disabled extension ${extensionId}`);
    } catch (error) {
      log.error(module, 'Error disabling extension:', error);
      throw error;
    }
  }

  /**
   * Enable multiple extensions
   * @param {Array<string>} extensionIds - Array of extension IDs
   */
  async enableExtensions(extensionIds) {
    const promises = extensionIds.map(id => this.enableExtension(id));
    await Promise.allSettled(promises);
  }

  /**
   * Disable multiple extensions
   * @param {Array<string>} extensionIds - Array of extension IDs
   */
  async disableExtensions(extensionIds) {
    const promises = extensionIds.map(id => this.disableExtension(id));
    await Promise.allSettled(promises);
  }

  /**
   * Open extension options page
   * @param {string} extensionId - Extension ID
   */
  async openExtensionOptions(extensionId) {
    try {
      const extension = await this.getExtension(extensionId);
      if (!extension) return;

      if (extension.optionsUrl) {
        // Open options page in new tab
        chrome.tabs.create({ url: extension.optionsUrl });
      } else {
        log.warn(module, 'Extension has no options page');
      }
    } catch (error) {
      log.error(module, 'Error opening options:', error);
    }
  }

  /**
   * Uninstall an extension
   * @param {string} extensionId - Extension ID
   * @param {Object} options - Uninstall options
   * @returns {Promise<boolean>} Success status
   */
  async uninstallExtension(extensionId, options = {}) {
    try {
      const { showConfirmDialog = true } = options;
      await chrome.management.uninstall(extensionId, { showConfirmDialog });
      log.info(module, `Uninstalled extension ${extensionId}`);
      return true;
    } catch (error) {
      log.error(module, 'Error uninstalling extension:', error);
      return false;
    }
  }

  /**
   * Get categorized extensions
   * @returns {Object} Extensions grouped by category
   */
  getCategorizedExtensions() {
    const categories = {
      productivity: [],
      privacy: [],
      development: [],
      social: [],
      shopping: [],
      entertainment: [],
      other: []
    };

    // Simple categorization based on name/description keywords
    const keywords = {
      productivity: ['task', 'todo', 'note', 'calendar', 'timer', 'focus', 'pomodoro', 'grammar'],
      privacy: ['vpn', 'proxy', 'privacy', 'security', 'block', 'adblock', 'tracker', 'https'],
      development: ['dev', 'debug', 'console', 'react', 'vue', 'angular', 'github', 'gitlab', 'code'],
      social: ['twitter', 'facebook', 'linkedin', 'instagram', 'reddit', 'social'],
      shopping: ['shop', 'price', 'coupon', 'deal', 'amazon', 'ebay'],
      entertainment: ['music', 'video', 'youtube', 'netflix', 'spotify', 'twitch', 'game']
    };

    this.extensions.forEach(ext => {
      const searchText = `${ext.name} ${ext.description || ''}`.toLowerCase();
      let categorized = false;

      for (const [category, terms] of Object.entries(keywords)) {
        if (terms.some(term => searchText.includes(term))) {
          categories[category].push(ext);
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        categories.other.push(ext);
      }
    });

    return categories;
  }

  /**
   * Search extensions by name or description
   * @param {string} query - Search query
   * @returns {Array} Matching extensions
   */
  searchExtensions(query) {
    if (!query) return this.extensions;

    const lowerQuery = query.toLowerCase();
    return this.extensions.filter(ext => {
      return ext.name.toLowerCase().includes(lowerQuery) ||
             (ext.description && ext.description.toLowerCase().includes(lowerQuery));
    });
  }

  /**
   * Get extension statistics
   * @returns {Object} Extension stats
   */
  getStatistics() {
    const total = this.extensions.length;
    const enabled = this.extensions.filter(e => e.enabled).length;
    const disabled = total - enabled;

    return {
      total,
      enabled,
      disabled,
      enabledPercentage: total > 0 ? Math.round((enabled / total) * 100) : 0
    };
  }

  /**
   * Setup listeners for extension changes
   * @private
   */
  _setupListeners() {
    // Listen for extension enabled
    chrome.management.onEnabled.addListener((info) => {
      log.info(module, 'Extension enabled:', info.name);
      this._notifyListeners('enabled', info);
      this.refreshExtensions();
    });

    // Listen for extension disabled
    chrome.management.onDisabled.addListener((info) => {
      log.info(module, 'Extension disabled:', info.name);
      this._notifyListeners('disabled', info);
      this.refreshExtensions();
    });

    // Listen for extension installed
    chrome.management.onInstalled.addListener((info) => {
      log.info(module, 'Extension installed:', info.name);
      this._notifyListeners('installed', info);
      this.refreshExtensions();
    });

    // Listen for extension uninstalled
    chrome.management.onUninstalled.addListener((extensionId) => {
      log.info(module, 'Extension uninstalled:', extensionId);
      this._notifyListeners('uninstalled', { id: extensionId });
      this.refreshExtensions();
    });
  }

  /**
   * Add event listener
   * @param {string} event - Event type (enabled/disabled/installed/uninstalled)
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners for an event
   * @private
   */
  _notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          log.error(module, 'Listener error:', error);
        }
      });
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.listeners.clear();
  }

  /**
   * Destroy the manager and cleanup
   */
  destroy() {
    this.removeAllListeners();
    this.extensions = [];
    this.initialized = false;
    log.info(module, 'Destroyed');
  }
}

// Export singleton instance
export default new ExtensionManager();
