import { logger as log } from '../utils/logger.js';
const module = 'PanelManager';
/**
 * PanelManager - Manages multi-panel navigation system
 * Handles 5 panels: center (main), top, bottom, left, right
 * Provides smooth transitions and gesture-based navigation
 */

export class PanelManager {
  /**
   * Create panel manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.panels = {
      center: { name: 'Main', position: { x: 0, y: 0 }, widgets: [] },
      top: { name: 'Top', position: { x: 0, y: -1 }, widgets: [] },
      bottom: { name: 'Bottom', position: { x: 0, y: 1 }, widgets: [] },
      left: { name: 'Left', position: { x: -1, y: 0 }, widgets: [] },
      right: { name: 'Right', position: { x: 1, y: 0 }, widgets: [] }
    };

    this.currentPanel = 'center';
    this.container = null;
    this.isTransitioning = false;
    this.transitionDuration = options.transitionDuration || 400; // ms
    this.enabledPanels = options.enabledPanels || ['center', 'top', 'bottom', 'left', 'right'];

    // Callbacks
    this.onPanelChange = options.onPanelChange || null;
    this.onPanelTransitionStart = options.onPanelTransitionStart || null;
    this.onPanelTransitionEnd = options.onPanelTransitionEnd || null;

    log.info(module, 'Initialized with panels:', this.enabledPanels);
  }

  /**
   * Initialize panel system
   * @param {HTMLElement} container - Main container element
   */
  initialize(container) {
    if (!container) {
      log.error(module, 'Container element not provided');
      return false;
    }

    this.container = container;
    this._setupPanelStructure();
    this._updatePanelPosition();

    log.info(module, 'Panel system initialized');
    return true;
  }

  /**
   * Setup panel HTML structure
   * @private
   */
  _setupPanelStructure() {
    // Create panel viewport
    const viewport = document.createElement('div');
    viewport.className = 'panel-viewport';
    viewport.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    `;

    // Create panels container
    const panelsContainer = document.createElement('div');
    panelsContainer.className = 'panels-container';
    panelsContainer.style.cssText = `
      position: absolute;
      width: 300vw;
      height: 300vh;
      top: -100vh;
      left: -100vw;
      transition: transform ${this.transitionDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1);
      will-change: transform;
    `;

    // Create individual panels
    this.enabledPanels.forEach(panelId => {
      const panel = this._createPanel(panelId);
      panelsContainer.appendChild(panel);
    });

    viewport.appendChild(panelsContainer);
    this.container.appendChild(viewport);

    this.viewport = viewport;
    this.panelsContainer = panelsContainer;
  }

  /**
   * Create a single panel element
   * @private
   * @param {string} panelId - Panel identifier
   * @returns {HTMLElement} Panel element
   */
  _createPanel(panelId) {
    const panelData = this.panels[panelId];
    const panel = document.createElement('div');
    panel.className = `panel panel-${panelId}`;
    panel.dataset.panel = panelId;
    
    // Calculate position in 3x3 grid
    const posX = (panelData.position.x + 1) * 100; // Convert -1,0,1 to 0,100,200
    const posY = (panelData.position.y + 1) * 100; // Convert -1,0,1 to 0,100,200
    
    // Center panel gets no overflow, others get auto scroll
    const overflow = panelId === 'center' ? 'hidden' : 'auto';
    
    panel.style.cssText = `
      position: absolute;
      width: 100vw;
      height: 100vh;
      top: ${posY}vh;
      left: ${posX}vw;
      overflow-y: ${overflow};
      overflow-x: hidden;
      padding: 2rem;
      box-sizing: border-box;
    `;

    // Add panel content container
    const content = document.createElement('div');
    
    // Base classes for all panels
    let contentClasses = 'panel-content flex flex-col gap-6 max-w-7xl mx-auto';
    
    // Center panel gets special grid layout with no overflow
    if (panelId === 'center') {
      contentClasses = 'panel-content grid grid-rows-[auto_1fr] gap-6 w-full max-w-6xl mx-auto items-start justify-items-center pt-16 pb-6 overflow-hidden max-h-screen';
    }
    
    content.className = contentClasses;
    content.dataset.panelContent = panelId;
    panel.appendChild(content);

    return panel;
  }

  /**
   * Navigate to a panel
   * @param {string} panelId - Target panel ID
   * @param {boolean} animate - Whether to animate transition
   * @returns {boolean} Success status
   */
  navigateToPanel(panelId, animate = true) {
    if (this.isTransitioning) {
      log.info(module, 'Transition in progress, ignoring navigation');
      return false;
    }

    if (!this.enabledPanels.includes(panelId)) {
      log.warn(module, 'Panel not enabled:', panelId);
      return false;
    }

    if (panelId === this.currentPanel) {
      log.info(module, 'Already on panel:', panelId);
      return false;
    }

    log.info(module, `Navigating from ${this.currentPanel} to ${panelId}`);
    const previousPanel = this.currentPanel;
    this.currentPanel = panelId;

    if (this.onPanelTransitionStart) {
      this.onPanelTransitionStart(previousPanel, panelId);
    }

    if (animate) {
      this.isTransitioning = true;
      this._updatePanelPosition();

      setTimeout(() => {
        this.isTransitioning = false;
        this._onTransitionComplete(previousPanel, panelId);
      }, this.transitionDuration);
    } else {
      this._updatePanelPosition();
      this._onTransitionComplete(previousPanel, panelId);
    }

    return true;
  }

  /**
   * Navigate in a direction
   * @param {string} direction - Direction: 'up', 'down', 'left', 'right'
   * @returns {boolean} Success status
   */
  navigateDirection(direction) {
    const directionMap = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };

    const delta = directionMap[direction];
    if (!delta) {
      log.warn(module, 'Invalid direction:', direction);
      return false;
    }

    const currentPos = this.panels[this.currentPanel].position;
    const targetPos = {
      x: currentPos.x + delta.x,
      y: currentPos.y + delta.y
    };

    // Find panel at target position
    const targetPanel = Object.keys(this.panels).find(id => {
      const pos = this.panels[id].position;
      return pos.x === targetPos.x && pos.y === targetPos.y;
    });

    if (!targetPanel) {
      log.info(module, 'No panel in direction:', direction);
      return false;
    }

    return this.navigateToPanel(targetPanel);
  }

  /**
   * Update panel position based on current panel
   * @private
   */
  _updatePanelPosition() {
    if (!this.panelsContainer) return;

    const currentPos = this.panels[this.currentPanel].position;
    
    // Calculate transform to center current panel
    // Each panel is 100vw/vh, starting position is -100vw/-100vh
    const translateX = -currentPos.x * 100;
    const translateY = -currentPos.y * 100;

    this.panelsContainer.style.transform = `translate(${translateX}vw, ${translateY}vh)`;
  }

  /**
   * Handle transition completion
   * @private
   * @param {string} from - Previous panel
   * @param {string} to - Current panel
   */
  _onTransitionComplete(from, to) {
    log.info(module, `Transition complete: ${from} → ${to}`);

    if (this.onPanelTransitionEnd) {
      this.onPanelTransitionEnd(from, to);
    }

    if (this.onPanelChange) {
      this.onPanelChange(to, from);
    }
  }

  /**
   * Get panel content container
   * @param {string} panelId - Panel identifier
   * @returns {HTMLElement|null} Panel content element
   */
  getPanelContent(panelId) {
    return this.container?.querySelector(`[data-panel-content="${panelId}"]`);
  }

  /**
   * Mount widget to panel
   * @param {string} panelId - Panel identifier
   * @param {HTMLElement} widgetElement - Widget element to mount
   * @param {string} widgetId - Widget identifier
   * @returns {boolean} Success status
   */
  mountWidget(panelId, widgetElement, widgetId) {
    const panelContent = this.getPanelContent(panelId);
    if (!panelContent) {
      log.error(module, 'Panel not found:', panelId);
      return false;
    }

    panelContent.appendChild(widgetElement);
    this.panels[panelId].widgets.push(widgetId);
    
    log.info(module, `Mounted widget ${widgetId} to panel ${panelId}`);
    return true;
  }

  /**
   * Get current panel ID
   * @returns {string} Current panel identifier
   */
  getCurrentPanel() {
    return this.currentPanel;
  }

  /**
   * Get available directions from current panel
   * @returns {string[]} Array of available directions
   */
  getAvailableDirections() {
    const currentPos = this.panels[this.currentPanel].position;
    const directions = [];

    // Check each direction
    const checks = [
      { dir: 'up', delta: { x: 0, y: -1 } },
      { dir: 'down', delta: { x: 0, y: 1 } },
      { dir: 'left', delta: { x: -1, y: 0 } },
      { dir: 'right', delta: { x: 1, y: 0 } }
    ];

    checks.forEach(({ dir, delta }) => {
      const targetPos = {
        x: currentPos.x + delta.x,
        y: currentPos.y + delta.y
      };

      const hasPanel = Object.keys(this.panels).some(id => {
        const pos = this.panels[id].position;
        return pos.x === targetPos.x && pos.y === targetPos.y && this.enabledPanels.includes(id);
      });

      if (hasPanel) {
        directions.push(dir);
      }
    });

    return directions;
  }

  /**
   * Destroy panel manager
   */
  destroy() {
    if (this.viewport) {
      this.viewport.remove();
    }

    this.container = null;
    this.viewport = null;
    this.panelsContainer = null;

    log.info(module, '[PanelManager] Destroyed');
  }
}
