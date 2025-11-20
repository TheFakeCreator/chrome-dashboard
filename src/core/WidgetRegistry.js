/**
 * @module WidgetRegistry
 * @description Registry for managing available widgets and their instantiation
 * 
 * Features:
 * - Widget registration and discovery
 * - Widget instantiation and lifecycle management
 * - Widget metadata and categorization
 * - Widget dependencies and requirements
 * 
 * @example
 * const registry = new WidgetRegistry(app);
 * 
 * // Register widgets
 * registry.register('clock', ClockWidget, {
 *   category: 'time',
 *   icon: '🕐',
 *   title: 'Clock',
 *   description: 'Display current time'
 * });
 * 
 * // Create widget instance
 * const clockWidget = await registry.create('clock', {
 *   settings: { format: '24h' }
 * });
 */

import { logger as log } from '../utils/logger.js';

const module = 'WidgetRegistry';

export class WidgetRegistry {
  /**
   * @param {Object} app - App instance
   */
  constructor(app) {
    this.app = app;
    this.eventBus = app.eventBus;

    // Registry maps
    this.definitions = new Map(); // widgetType -> WidgetDefinition
    this.instances = new Map();   // widgetId -> Widget instance

    // Categories
    this.categories = new Map();  // category -> Set of widgetTypes

    // Statistics
    this.stats = {
      registered: 0,
      instantiated: 0,
      errors: 0
    };
  }

  /**
   * Register a widget type
   * @param {string} type - Widget type identifier
   * @param {Class} WidgetClass - Widget class
   * @param {Object} metadata - Widget metadata
   */
  register(type, WidgetClass, metadata = {}) {
    log.info(module, `Registering widget: ${type}`);

    // Validate
    if (this.definitions.has(type)) {
      log.warn(module, `Widget already registered: ${type}`);
      return;
    }

    if (typeof WidgetClass !== 'function') {
      throw new Error(`[WidgetRegistry] Invalid widget class for: ${type}`);
    }

    // Create widget definition
    const definition = {
      type,
      class: WidgetClass,
      metadata: {
        title: metadata.title || type,
        icon: metadata.icon || '📦',
        description: metadata.description || '',
        category: metadata.category || 'general',
        version: metadata.version || '1.0.0',
        author: metadata.author || 'Unknown',
        tags: metadata.tags || [],
        requirements: metadata.requirements || {},
        defaultSettings: metadata.defaultSettings || {},
        defaultLayout: metadata.defaultLayout || {
          width: 1,
          height: 1
        }
      }
    };

    // Add to registry
    this.definitions.set(type, definition);

    // Add to category
    const category = definition.metadata.category;
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category).add(type);

    this.stats.registered++;

    // Emit event
    this.eventBus.emit('widget-registry:registered', { type, definition });

    log.info(module, `Registered widget: ${type} (${this.stats.registered} total)`);
  }

  /**
   * Unregister a widget type
   * @param {string} type - Widget type identifier
   */
  unregister(type) {
    const definition = this.definitions.get(type);
    if (!definition) {
      log.warn(module, `Widget not found: ${type}`);
      return;
    }

    // Remove from category
    const category = definition.metadata.category;
    if (this.categories.has(category)) {
      this.categories.get(category).delete(type);
      if (this.categories.get(category).size === 0) {
        this.categories.delete(category);
      }
    }

    // Remove from registry
    this.definitions.delete(type);
    this.stats.registered--;

    // Emit event
    this.eventBus.emit('widget-registry:unregistered', { type });

    log.info(module, `Unregistered widget: ${type}`);
  }

  /**
   * Create widget instance
   * @param {string} type - Widget type
   * @param {Object} options - Widget options
   * @returns {Promise<Object>} Widget instance
   */
  async create(type, options = {}) {
    log.info(module, `Creating widget: ${type}`);

    // Get definition
    const definition = this.definitions.get(type);
    if (!definition) {
      throw new Error(`[WidgetRegistry] Unknown widget type: ${type}`);
    }

    // Merge options with defaults
    const widgetOptions = {
      ...definition.metadata.defaultSettings,
      ...options,
      settings: {
        ...definition.metadata.defaultSettings,
        ...options.settings
      },
      layout: {
        ...definition.metadata.defaultLayout,
        ...options.layout
      }
    };

    try {
      // Instantiate widget (BaseWidget calls onInit() automatically in constructor)
      const WidgetClass = definition.class;
      const widget = new WidgetClass(this.app, widgetOptions);

      // Register instance
      this.instances.set(widget.widgetId, {
        widget,
        type,
        createdAt: Date.now()
      });

      this.stats.instantiated++;

      // Emit event
      this.eventBus.emit('widget-registry:created', { type, widget });

      log.info(module, `Created widget: ${widget.widgetId} (${type})`);

      return widget;
    } catch (error) {
      this.stats.errors++;
      log.error(module, `Error creating widget ${type}:`, error);
      this.eventBus.emit('widget-registry:error', { type, error });
      throw error;
    }
  }

  /**
   * Destroy widget instance
   * @param {string} widgetId - Widget ID
   */
  destroy(widgetId) {
    const instance = this.instances.get(widgetId);
    if (!instance) {
      log.warn(module, `Instance not found: ${widgetId}`);
      return;
    }

    try {
      // Destroy widget
      instance.widget.destroy();

      // Remove from registry
      this.instances.delete(widgetId);
      this.stats.instantiated--;

      // Emit event
      this.eventBus.emit('widget-registry:destroyed', { widgetId, type: instance.type });

      log.info(module, `Destroyed widget: ${widgetId}`);
    } catch (error) {
      log.error(module, `Error destroying widget ${widgetId}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Get widget definition
   * @param {string} type - Widget type
   * @returns {Object|null} Widget definition
   */
  getDefinition(type) {
    return this.definitions.get(type) || null;
  }

  /**
   * Get widget instance
   * @param {string} widgetId - Widget ID
   * @returns {Object|null} Widget instance
   */
  getInstance(widgetId) {
    const instance = this.instances.get(widgetId);
    return instance ? instance.widget : null;
  }

  /**
   * Get all registered widget types
   * @returns {Array<string>} Widget types
   */
  getTypes() {
    return Array.from(this.definitions.keys());
  }

  /**
   * Get all widget definitions
   * @returns {Array<Object>} Widget definitions
   */
  getDefinitions() {
    return Array.from(this.definitions.values());
  }

  /**
   * Get widgets by category
   * @param {string} category - Category name
   * @returns {Array<Object>} Widget definitions
   */
  getByCategory(category) {
    const types = this.categories.get(category);
    if (!types) return [];

    return Array.from(types).map(type => this.definitions.get(type));
  }

  /**
   * Get all categories
   * @returns {Array<string>} Category names
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Search widgets
   * @param {string} query - Search query
   * @returns {Array<Object>} Matching widget definitions
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const definition of this.definitions.values()) {
      const { metadata } = definition;
      
      // Search in title, description, tags, category
      const searchText = [
        metadata.title,
        metadata.description,
        metadata.category,
        ...metadata.tags
      ].join(' ').toLowerCase();

      if (searchText.includes(lowerQuery)) {
        results.push(definition);
      }
    }

    return results;
  }

  /**
   * Get widget statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      categories: this.categories.size,
      active: this.instances.size
    };
  }

  /**
   * Check if widget type exists
   * @param {string} type - Widget type
   * @returns {boolean}
   */
  has(type) {
    return this.definitions.has(type);
  }

  /**
   * Check if widget instance exists
   * @param {string} widgetId - Widget ID
   * @returns {boolean}
   */
  hasInstance(widgetId) {
    return this.instances.has(widgetId);
  }

  /**
   * Export registry data
   * @returns {Object} Registry data
   */
  export() {
    const definitions = {};
    for (const [type, definition] of this.definitions) {
      definitions[type] = {
        type: definition.type,
        metadata: definition.metadata
      };
    }

    const instances = {};
    for (const [widgetId, instance] of this.instances) {
      instances[widgetId] = {
        widgetId,
        type: instance.type,
        createdAt: instance.createdAt,
        state: instance.widget.serialize()
      };
    }

    return {
      definitions,
      instances,
      stats: this.getStats()
    };
  }

  /**
   * Clear all instances (useful for reset)
   */
  clearInstances() {
    log.info(module, 'Clearing all instances...');

    const widgetIds = Array.from(this.instances.keys());
    for (const widgetId of widgetIds) {
      this.destroy(widgetId);
    }

    log.info(module, 'All instances cleared');
  }

  /**
   * Get debug info
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      stats: this.getStats(),
      definitions: this.getTypes(),
      categories: Object.fromEntries(
        Array.from(this.categories.entries()).map(([cat, types]) => [
          cat,
          Array.from(types)
        ])
      ),
      instances: Array.from(this.instances.keys())
    };
  }
}
