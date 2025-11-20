/**
 * @module GridManager
 * @description Manages the grid-based widget layout system with drag-and-drop functionality
 * 
 * Features:
 * - CSS Grid-based responsive layout
 * - Drag-and-drop widget positioning
 * - Layout persistence
 * - Responsive breakpoints
 * - Auto-layout for new widgets
 * 
 * @example
 * const gridManager = new GridManager(app, {
 *   container: document.getElementById('dashboard-grid'),
 *   columns: 12,
 *   rows: 'auto',
 *   gap: '1rem'
 * });
 * 
 * await gridManager.init();
 * gridManager.addWidget(widget);
 */

import { EventBus } from './EventBus.js';
import { logger as log } from '../utils/logger.js';

const module = 'GridManager';

export class GridManager {
  /**
   * @param {Object} app - App instance
   * @param {Object} options - Grid options
   */
  constructor(app, options = {}) {
    this.app = app;
    this.eventBus = app.eventBus;
    this.state = app.stateManager;
    this.storage = app.storageManager;

    // Grid configuration
    this.config = {
      container: options.container || null,
      columns: options.columns || 12,
      rows: options.rows || 'auto',
      gap: options.gap || '1rem',
      minItemWidth: options.minItemWidth || 200,
      minItemHeight: options.minItemHeight || 150,
      breakpoints: options.breakpoints || {
        xs: { maxWidth: 640, columns: 1 },
        sm: { maxWidth: 768, columns: 2 },
        md: { maxWidth: 1024, columns: 4 },
        lg: { maxWidth: 1280, columns: 6 },
        xl: { maxWidth: 1536, columns: 8 },
        '2xl': { minWidth: 1536, columns: 12 }
      }
    };

    // Grid state
    this.gridItems = new Map(); // widgetId -> GridItem
    this.layout = []; // Array of layout objects
    this.currentBreakpoint = null;
    this.isDragging = false;
    this.draggedItem = null;

    // DOM elements
    this.containerElement = null;
    this.placeholderElement = null;

    // Event handlers (bound to this)
    this.handleResize = this.handleResize.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  /**
   * Initialize the grid manager
   * @returns {Promise<void>}
   */
  async init() {
    log.info(module, 'Initializing...');

    // Get or create container
    this.containerElement = this.config.container || this.createContainer();

    // Load saved layout
    await this.loadLayout();

    // Apply grid styles
    this.applyGridStyles();

    // Setup event listeners
    this.setupEventListeners();

    // Detect initial breakpoint
    this.updateBreakpoint();

    // Emit initialized event
    this.eventBus.emit('grid:initialized', { grid: this });

    log.info(module, 'Initialized successfully');
  }

  /**
   * Create grid container element
   * @private
   * @returns {HTMLElement}
   */
  createContainer() {
    const container = document.createElement('div');
    container.id = 'dashboard-grid';
    container.className = 'dashboard-grid';
    document.body.appendChild(container);
    return container;
  }

  /**
   * Apply grid CSS styles
   * @private
   */
  applyGridStyles() {
    const { columns, gap } = this.config;
    
    this.containerElement.style.display = 'grid';
    this.containerElement.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    this.containerElement.style.gap = gap;
    this.containerElement.style.width = '100%';
    this.containerElement.style.padding = '1rem';
    this.containerElement.style.boxSizing = 'border-box';
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    // Resize observer
    window.addEventListener('resize', this.handleResize);

    // Drag and drop events
    this.containerElement.addEventListener('dragover', this.handleDragOver);
    this.containerElement.addEventListener('drop', this.handleDrop);

    // Widget events
    this.eventBus.on('widget:added', this.handleWidgetAdded.bind(this));
    this.eventBus.on('widget:removed', this.handleWidgetRemoved.bind(this));
    this.eventBus.on('widget:layout-changed', this.handleWidgetLayoutChanged.bind(this));
  }

  /**
   * Handle window resize
   * @private
   */
  handleResize() {
    this.updateBreakpoint();
    this.reflow();
  }

  /**
   * Update current breakpoint
   * @private
   */
  updateBreakpoint() {
    const width = window.innerWidth;
    let newBreakpoint = '2xl';

    for (const [name, breakpoint] of Object.entries(this.config.breakpoints)) {
      if (breakpoint.maxWidth && width <= breakpoint.maxWidth) {
        newBreakpoint = name;
        break;
      }
    }

    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint;
      const columns = this.config.breakpoints[newBreakpoint].columns;
      this.config.columns = columns;
      this.applyGridStyles();
      this.eventBus.emit('grid:breakpoint-changed', { breakpoint: newBreakpoint, columns });
    }
  }

  /**
   * Add widget to grid
   * @param {Object} widget - Widget instance
   * @param {Object} position - Optional position {row, col, width, height}
   * @returns {GridItem}
   */
  addWidget(widget, position = null) {
    log.info(module, `Adding widget: ${widget.widgetId}`);

    // Find position if not specified
    if (!position) {
      position = this.findNextAvailablePosition(widget.layout);
    }

    // Update widget layout
    widget.layout = { ...widget.layout, ...position };

    // Create grid item wrapper
    const gridItem = this.createGridItem(widget);
    this.gridItems.set(widget.widgetId, gridItem);

    // Add to layout array
    this.layout.push({
      widgetId: widget.widgetId,
      ...widget.layout
    });

    // Append to container
    this.containerElement.appendChild(gridItem.element);

    // Mount widget
    widget.mount(gridItem.contentElement);

    // Save layout
    this.saveLayout();

    // Emit event
    this.eventBus.emit('grid:widget-added', { widget, gridItem });

    return gridItem;
  }

  /**
   * Create grid item wrapper for widget
   * @private
   * @param {Object} widget - Widget instance
   * @returns {Object} GridItem
   */
  createGridItem(widget) {
    const element = document.createElement('div');
    element.className = 'grid-item';
    element.setAttribute('data-widget-id', widget.widgetId);
    element.setAttribute('draggable', 'true');
    
    // Apply grid positioning
    element.style.gridRow = `span ${widget.layout.height}`;
    element.style.gridColumn = `span ${widget.layout.width}`;

    // Create content wrapper
    const contentElement = document.createElement('div');
    contentElement.className = 'grid-item-content';
    element.appendChild(contentElement);

    // Create drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'grid-item-drag-handle';
    dragHandle.innerHTML = '<i data-lucide="grip-vertical"></i>';
    element.appendChild(dragHandle);

    // Add drag event listeners
    element.addEventListener('dragstart', (e) => this.handleDragStart(e, widget));
    element.addEventListener('dragend', this.handleDragEnd);

    return {
      element,
      contentElement,
      dragHandle,
      widget
    };
  }

  /**
   * Remove widget from grid
   * @param {string} widgetId - Widget ID
   */
  removeWidget(widgetId) {
    log.info(module, `Removing widget: ${widgetId}`);

    const gridItem = this.gridItems.get(widgetId);
    if (!gridItem) {
      log.warn(module, `Widget not found: ${widgetId}`);
      return;
    }

    // Destroy widget
    gridItem.widget.destroy();

    // Remove from DOM
    gridItem.element.remove();

    // Remove from maps
    this.gridItems.delete(widgetId);

    // Remove from layout
    this.layout = this.layout.filter(item => item.widgetId !== widgetId);

    // Save layout
    this.saveLayout();

    // Emit event
    this.eventBus.emit('grid:widget-removed', { widgetId });
  }

  /**
   * Find next available position for widget
   * @private
   * @param {Object} widgetLayout - Widget layout requirements
   * @returns {Object} Position {row, col, width, height}
   */
  findNextAvailablePosition(widgetLayout) {
    const width = Math.min(widgetLayout.width || 1, this.config.columns);
    const height = widgetLayout.height || 1;

    // Simple auto-placement: append to end of grid
    // Browser's auto-placement will handle the positioning
    return {
      row: 'auto',
      col: 'auto',
      width,
      height
    };
  }

  /**
   * Reflow the grid layout
   * @private
   */
  reflow() {
    // Update all grid items with current column constraints
    for (const [widgetId, gridItem] of this.gridItems) {
      const widget = gridItem.widget;
      const maxWidth = Math.min(widget.layout.width, this.config.columns);
      
      gridItem.element.style.gridColumn = `span ${maxWidth}`;
      gridItem.element.style.gridRow = `span ${widget.layout.height}`;
    }

    this.eventBus.emit('grid:reflowed');
  }

  /**
   * Handle drag start
   * @private
   * @param {DragEvent} event
   * @param {Object} widget
   */
  handleDragStart(event, widget) {
    this.isDragging = true;
    this.draggedItem = this.gridItems.get(widget.widgetId);

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', widget.widgetId);

    this.draggedItem.element.classList.add('dragging');
    this.eventBus.emit('grid:drag-start', { widget });
  }

  /**
   * Handle drag over
   * @private
   * @param {DragEvent} event
   */
  handleDragOver(event) {
    if (!this.isDragging) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    // Find target grid item
    const target = event.target.closest('.grid-item');
    if (target && target !== this.draggedItem.element) {
      // Show visual feedback
      const rect = target.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;
      
      if (event.clientX < midpoint) {
        target.classList.add('drop-before');
        target.classList.remove('drop-after');
      } else {
        target.classList.add('drop-after');
        target.classList.remove('drop-before');
      }
    }
  }

  /**
   * Handle drag end
   * @private
   */
  handleDragEnd() {
    this.isDragging = false;
    
    if (this.draggedItem) {
      this.draggedItem.element.classList.remove('dragging');
      this.draggedItem = null;
    }

    // Remove all drop indicators
    this.containerElement.querySelectorAll('.grid-item').forEach(item => {
      item.classList.remove('drop-before', 'drop-after');
    });

    this.eventBus.emit('grid:drag-end');
  }

  /**
   * Handle drop
   * @private
   * @param {DragEvent} event
   */
  handleDrop(event) {
    event.preventDefault();
    
    if (!this.draggedItem) return;

    const target = event.target.closest('.grid-item');
    if (!target || target === this.draggedItem.element) {
      return;
    }

    // Reorder elements
    const rect = target.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    
    if (event.clientX < midpoint) {
      this.containerElement.insertBefore(this.draggedItem.element, target);
    } else {
      this.containerElement.insertBefore(this.draggedItem.element, target.nextSibling);
    }

    // Update layout order
    this.updateLayoutOrder();

    // Save layout
    this.saveLayout();

    this.eventBus.emit('grid:drop', {
      widget: this.draggedItem.widget,
      target: target.dataset.widgetId
    });
  }

  /**
   * Update layout order based on DOM order
   * @private
   */
  updateLayoutOrder() {
    const newLayout = [];
    const items = this.containerElement.querySelectorAll('.grid-item');
    
    items.forEach((item, index) => {
      const widgetId = item.dataset.widgetId;
      const gridItem = this.gridItems.get(widgetId);
      
      if (gridItem) {
        newLayout.push({
          widgetId,
          order: index,
          ...gridItem.widget.layout
        });
      }
    });

    this.layout = newLayout;
  }

  /**
   * Handle widget added event
   * @private
   * @param {Object} data
   */
  handleWidgetAdded({ widget }) {
    if (!this.gridItems.has(widget.widgetId)) {
      this.addWidget(widget);
    }
  }

  /**
   * Handle widget removed event
   * @private
   * @param {Object} data
   */
  handleWidgetRemoved({ widgetId }) {
    this.removeWidget(widgetId);
  }

  /**
   * Handle widget layout changed event
   * @private
   * @param {Object} data
   */
  handleWidgetLayoutChanged({ widget }) {
    const gridItem = this.gridItems.get(widget.widgetId);
    if (!gridItem) return;

    // Update grid positioning
    gridItem.element.style.gridRow = `span ${widget.layout.height}`;
    gridItem.element.style.gridColumn = `span ${widget.layout.width}`;

    // Update layout array
    const layoutItem = this.layout.find(item => item.widgetId === widget.widgetId);
    if (layoutItem) {
      Object.assign(layoutItem, widget.layout);
    }

    // Save layout
    this.saveLayout();
  }

  /**
   * Load layout from storage
   * @private
   * @returns {Promise<void>}
   */
  async loadLayout() {
    try {
      const savedLayout = await this.storage.get('dashboard.layout', []);
      this.layout = savedLayout;
      log.info(module, 'Loaded layout:', this.layout);
    } catch (error) {
      log.error(module, 'Error loading layout:', error);
      this.layout = [];
    }
  }

  /**
   * Save layout to storage
   * @returns {Promise<void>}
   */
  async saveLayout() {
    try {
      await this.storage.set('dashboard.layout', this.layout);
      this.eventBus.emit('grid:layout-saved', { layout: this.layout });
      log.info(module, 'Layout saved');
    } catch (error) {
      log.error(module, 'Error saving layout:', error);
    }
  }

  /**
   * Get current layout
   * @returns {Array} Layout array
   */
  getLayout() {
    return [...this.layout];
  }

  /**
   * Apply a preset layout
   * @param {Array} layout - Layout configuration
   */
  async applyLayout(layout) {
    log.info(module, 'Applying layout preset:', layout);

    // Clear current layout
    this.clear();

    // Add widgets in layout order
    for (const item of layout) {
      const widget = this.app.widgets.get(item.widgetId);
      if (widget) {
        this.addWidget(widget, item);
      }
    }

    this.eventBus.emit('grid:layout-applied', { layout });
  }

  /**
   * Clear all widgets from grid
   */
  clear() {
    log.info(module, 'Clearing grid');

    // Remove all grid items
    for (const widgetId of this.gridItems.keys()) {
      this.removeWidget(widgetId);
    }

    this.layout = [];
    this.eventBus.emit('grid:cleared');
  }

  /**
   * Destroy grid manager
   */
  destroy() {
    log.info(module, 'Destroying...');

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    this.containerElement.removeEventListener('dragover', this.handleDragOver);
    this.containerElement.removeEventListener('drop', this.handleDrop);

    // Clear grid
    this.clear();

    // Remove container
    if (this.containerElement) {
      this.containerElement.remove();
    }

    this.eventBus.emit('grid:destroyed');
  }
}
