/**
 * @module WidgetPresets
 * @description Predefined widget layout configurations for different use cases
 * 
 * Features:
 * - Work preset - For professional productivity
 * - Study preset - For learning and research
 * - Personal preset - For casual browsing and entertainment
 * - Minimal preset - Clean and simple
 * - Custom preset creation and management
 */

import { logger as log } from '../utils/logger.js';

const module = 'WidgetPresets';

export class WidgetPresets {
  /**
   * @param {Object} app - App instance
   */
  constructor(app) {
    this.app = app;
    this.storage = app.storageManager;
    this.registry = app.widgetRegistry;
    this.gridManager = app.gridManager;

    // Custom presets loaded from storage
    this.customPresets = new Map();
  }

  /**
   * Initialize presets system
   * @returns {Promise<void>}
   */
  async init() {
    log.info(module, 'Initializing...');

    // Load custom presets from storage
    await this.loadCustomPresets();

    log.info(module, 'Initialized');
  }

  /**
   * Get all available presets
   * @returns {Array<Object>}
   */
  getAll() {
    const builtIn = [
      this.getWorkPreset(),
      this.getStudyPreset(),
      this.getPersonalPreset(),
      this.getMinimalPreset(),
      this.getProductivityPreset(),
      this.getCreativePreset()
    ];

    const custom = Array.from(this.customPresets.values());

    return [...builtIn, ...custom];
  }

  /**
   * Get Work preset configuration
   * @returns {Object}
   */
  getWorkPreset() {
    return {
      id: 'work',
      name: 'Work',
      description: 'Professional productivity setup',
      icon: '💼',
      category: 'built-in',
      layout: [
        // Top row - Essential tools
        { type: 'search', position: { row: 1, col: 1, width: 12, height: 1 } },
        
        // Second row - Time and Focus
        { type: 'clock', position: { row: 2, col: 1, width: 3, height: 1 } },
        { type: 'weather', position: { row: 2, col: 4, width: 3, height: 1 } },
        { type: 'focus', position: { row: 2, col: 7, width: 6, height: 2 } },
        
        // Third row - Quick Links and Extensions
        { type: 'quicklinks', position: { row: 3, col: 1, width: 6, height: 2 } },
        
        // Fourth row - Extensions
        { type: 'extensions', position: { row: 4, col: 7, width: 6, height: 2 } }
      ]
    };
  }

  /**
   * Get Study preset configuration
   * @returns {Object}
   */
  getStudyPreset() {
    return {
      id: 'study',
      name: 'Study',
      description: 'Focused learning environment',
      icon: '📚',
      category: 'built-in',
      layout: [
        // Focus on concentration and resources
        { type: 'search', position: { row: 1, col: 1, width: 12, height: 1 } },
        { type: 'focus', position: { row: 2, col: 1, width: 8, height: 2 } },
        { type: 'clock', position: { row: 2, col: 9, width: 4, height: 1 } },
        { type: 'weather', position: { row: 3, col: 9, width: 4, height: 1 } },
        { type: 'quicklinks', position: { row: 4, col: 1, width: 12, height: 2 } }
      ]
    };
  }

  /**
   * Get Personal preset configuration
   * @returns {Object}
   */
  getPersonalPreset() {
    return {
      id: 'personal',
      name: 'Personal',
      description: 'Relaxed browsing setup',
      icon: '🏠',
      category: 'built-in',
      layout: [
        // Casual and comfortable layout
        { type: 'search', position: { row: 1, col: 1, width: 12, height: 1 } },
        { type: 'clock', position: { row: 2, col: 1, width: 4, height: 1 } },
        { type: 'weather', position: { row: 2, col: 5, width: 4, height: 1 } },
        { type: 'quicklinks', position: { row: 3, col: 1, width: 12, height: 2 } },
        { type: 'extensions', position: { row: 5, col: 1, width: 8, height: 2 } }
      ]
    };
  }

  /**
   * Get Minimal preset configuration
   * @returns {Object}
   */
  getMinimalPreset() {
    return {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and simple',
      icon: '✨',
      category: 'built-in',
      layout: [
        // Just the essentials
        { type: 'search', position: { row: 1, col: 1, width: 12, height: 1 } },
        { type: 'clock', position: { row: 2, col: 1, width: 6, height: 1 } },
        { type: 'weather', position: { row: 2, col: 7, width: 6, height: 1 } },
        { type: 'quicklinks', position: { row: 3, col: 1, width: 12, height: 1 } }
      ]
    };
  }

  /**
   * Get Productivity preset configuration
   * @returns {Object}
   */
  getProductivityPreset() {
    return {
      id: 'productivity',
      name: 'Productivity',
      description: 'Maximum efficiency setup',
      icon: '⚡',
      category: 'built-in',
      layout: [
        // All productivity tools front and center
        { type: 'search', position: { row: 1, col: 1, width: 12, height: 1 } },
        { type: 'focus', position: { row: 2, col: 1, width: 4, height: 2 } },
        { type: 'quicklinks', position: { row: 2, col: 5, width: 8, height: 2 } },
        { type: 'clock', position: { row: 4, col: 1, width: 3, height: 1 } },
        { type: 'weather', position: { row: 4, col: 4, width: 3, height: 1 } },
        { type: 'extensions', position: { row: 4, col: 7, width: 6, height: 2 } }
      ]
    };
  }

  /**
   * Get Creative preset configuration
   * @returns {Object}
   */
  getCreativePreset() {
    return {
      id: 'creative',
      name: 'Creative',
      description: 'Inspiration and tools for creators',
      icon: '🎨',
      category: 'built-in',
      layout: [
        { type: 'search', position: { row: 1, col: 1, width: 12, height: 1 } },
        { type: 'quicklinks', position: { row: 2, col: 1, width: 8, height: 2 } },
        { type: 'clock', position: { row: 2, col: 9, width: 4, height: 1 } },
        { type: 'weather', position: { row: 3, col: 9, width: 4, height: 1 } },
        { type: 'focus', position: { row: 4, col: 1, width: 6, height: 2 } },
        { type: 'extensions', position: { row: 4, col: 7, width: 6, height: 2 } }
      ]
    };
  }

  /**
   * Apply a preset layout
   * @param {string} presetId - Preset ID
   * @returns {Promise<void>}
   */
  async apply(presetId) {
    log.info(module, `Applying preset: ${presetId}`);

    // Get preset configuration
    const preset = this.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    try {
      // Clear current layout
      this.gridManager.clear();

      // Create and add widgets according to preset
      for (const item of preset.layout) {
        // Create widget instance
        const widget = await this.registry.create(item.type, {
          layout: item.position
        });

        // Add to grid
        this.gridManager.addWidget(widget, item.position);
      }

      // Save current preset ID
      await this.storage.set({ currentPreset: presetId });

      // Emit event
      this.app.eventBus.emit('widget-presets:applied', { presetId, preset });

      log.info(module, `Preset applied: ${presetId}`);
    } catch (error) {
      log.error(module, 'Error applying preset:', error);
      throw error;
    }
  }

  /**
   * Get preset by ID
   * @param {string} presetId - Preset ID
   * @returns {Object|null}
   */
  get(presetId) {
    const allPresets = this.getAll();
    return allPresets.find(p => p.id === presetId) || null;
  }

  /**
   * Save current layout as a custom preset
   * @param {string} name - Preset name
   * @param {string} description - Preset description
   * @param {string} icon - Preset icon
   * @returns {Promise<Object>}
   */
  async saveCustomPreset(name, description = '', icon = '⭐') {
    log.info(module, `Saving custom preset: ${name}`);

    // Generate unique ID
    const id = `custom-${Date.now()}`;

    // Get current layout
    const layout = this.gridManager.getLayout().map(item => ({
      type: this.gridManager.gridItems.get(item.widgetId)?.widget.name.toLowerCase() || 'unknown',
      position: {
        row: item.row,
        col: item.col,
        width: item.width,
        height: item.height
      }
    }));

    // Create preset object
    const preset = {
      id,
      name,
      description,
      icon,
      category: 'custom',
      layout,
      createdAt: Date.now()
    };

    // Save to map
    this.customPresets.set(id, preset);

    // Save to storage
    await this.saveCustomPresets();

    // Emit event
    this.app.eventBus.emit('widget-presets:saved', { preset });

    log.info(module, `Custom preset saved: ${name}`);

    return preset;
  }

  /**
   * Delete a custom preset
   * @param {string} presetId - Preset ID
   * @returns {Promise<void>}
   */
  async deleteCustomPreset(presetId) {
    if (!presetId.startsWith('custom-')) {
      throw new Error('Cannot delete built-in preset');
    }

    log.info(module, `Deleting custom preset: ${presetId}`);

    // Remove from map
    this.customPresets.delete(presetId);

    // Save to storage
    await this.saveCustomPresets();

    // Emit event
    this.app.eventBus.emit('widget-presets:deleted', { presetId });

    log.info(module, `Custom preset deleted: ${presetId}`);
  }

  /**
   * Load custom presets from storage
   * @private
   * @returns {Promise<void>}
   */
  async loadCustomPresets() {
    try {
      const data = await this.storage.get('customPresets', []);
      
      this.customPresets.clear();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        for (const preset of data) {
          this.customPresets.set(preset.id, preset);
        }
      } else if (data && typeof data === 'object') {
        // Handle case where data is an object instead of array
        log.warn(module, 'Custom presets data is not an array, converting...');
        // If it's an object, try to convert it
        const presetsArray = Object.values(data);
        for (const preset of presetsArray) {
          if (preset && preset.id) {
            this.customPresets.set(preset.id, preset);
          }
        }
      }

      log.info(module, `Loaded ${this.customPresets.size} custom presets`);
    } catch (error) {
      log.error(module, 'Error loading custom presets:', error);
    }
  }

  /**
   * Save custom presets to storage
   * @private
   * @returns {Promise<void>}
   */
  async saveCustomPresets() {
    try {
      const data = Array.from(this.customPresets.values());
      await this.storage.set({ customPresets: data });
    } catch (error) {
      log.error(module, 'Error saving custom presets:', error);
    }
  }

  /**
   * Get current preset ID
   * @returns {Promise<string|null>}
   */
  async getCurrentPresetId() {
    return await this.storage.get('currentPreset', null);
  }

  /**
   * Export preset configuration
   * @param {string} presetId - Preset ID
   * @returns {string} JSON string
   */
  export(presetId) {
    const preset = this.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    return JSON.stringify(preset, null, 2);
  }

  /**
   * Import preset configuration
   * @param {string} json - JSON string
   * @returns {Promise<Object>} Imported preset
   */
  async import(json) {
    try {
      const preset = JSON.parse(json);

      // Validate preset structure
      if (!preset.id || !preset.name || !preset.layout) {
        throw new Error('Invalid preset structure');
      }

      // Generate new ID to avoid conflicts
      preset.id = `custom-${Date.now()}`;
      preset.category = 'custom';

      // Save as custom preset
      this.customPresets.set(preset.id, preset);
      await this.saveCustomPresets();

      log.info(module, `Preset imported: ${preset.name}`);

      return preset;
    } catch (error) {
      log.error(module, 'Error importing preset:', error);
      throw error;
    }
  }
}
