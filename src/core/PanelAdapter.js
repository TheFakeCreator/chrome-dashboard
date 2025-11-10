/**
 * PanelAdapter - Bridges old widget system with new panel system
 * Temporarily wraps widgets to work in panel layout
 */

export class PanelAdapter {
  constructor(panelManager) {
    this.panelManager = panelManager;
    this.panelMap = {
      'widget-clock-main': 'center',
      'widget-weather-main': 'center',
      'widget-search-main': 'center',
      'widget-quicklinks-main': 'bottom'
    };
  }

  /**
   * Mount widget to appropriate panel
   * @param {Object} widget - Widget instance
   * @param {HTMLElement} originalContainer - Original mount container (unused)
   */
  mount(widget, originalContainer) {
    // Determine which panel this widget should go to
    const panelId = this.panelMap[widget.widgetId] || 'center';
    
    // Create container for widget
    const container = document.createElement('div');
    container.className = 'widget-panel-item';
    
    // Mount widget to container
    widget.mount(container);
    
    // Add to panel
    this.panelManager.mountWidget(panelId, container, widget.widgetId);
    
    console.log(`[PanelAdapter] Mounted ${widget.widgetId} to panel: ${panelId}`);
  }

  /**
   * Update panel mapping
   * @param {string} widgetId - Widget ID
   * @param {string} panelId - Target panel
   */
  setWidgetPanel(widgetId, panelId) {
    this.panelMap[widgetId] = panelId;
  }
}
