/**
 * @module ClockWidget
 * @description Real-time clock widget with date and customizable format
 * 
 * @example
 * const clock = new ClockWidget(app, {
 *   settings: { format: '24h', showSeconds: true }
 * });
 * clock.mount('#widget-grid');
 */

import { BaseWidget } from '../widgets/BaseWidget.js';
import { logger as log } from '../utils/logger.js';
const module = 'ClockWidget';
export class ClockWidget extends BaseWidget {
  constructor(app, options = {}) {
    super(app, {
      ...options,
      name: 'Clock',
      title: 'Clock',
      icon: '<i data-lucide="clock" class="w-5 h-5"></i>',
      description: 'Display current time and date',
      category: 'productivity',
      updateInterval: 1000 // Update every second
    });

    this.time = '';
    this.date = '';
    this.dayOfWeek = '';
  }

  /**
   * Get default settings
   * @returns {Object} Default settings
   */
  getDefaultSettings() {
    return {
      format: '24h', // '12h' or '24h'
      showSeconds: true,
      showDate: true,
      showDayOfWeek: true,
      showTimezone: false
    };
  }

  /**
   * Load widget data
   * @returns {Promise<void>}
   */
  async loadData() {
    this.updateTime();
  }

  /**
   * Update current time
   */
  updateTime() {
    // Ensure settings are initialized
    if (!this.settings) {
      this.settings = this.getDefaultSettings();
    }
    
    const now = new Date();
    
    // Format time based on settings
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    if (this.settings.format === '12h') {
      // 12-hour format
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const timeStr = this.settings.showSeconds
        ? `${this.pad(displayHours)}:${this.pad(minutes)}:${this.pad(seconds)}`
        : `${this.pad(displayHours)}:${this.pad(minutes)}`;
      this.time = `${timeStr} ${period}`;
    } else {
      // 24-hour format
      const timeStr = this.settings.showSeconds
        ? `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`
        : `${this.pad(hours)}:${this.pad(minutes)}`;
      this.time = timeStr;
    }

    // Format date
    if (this.settings.showDate) {
      const options = { month: 'long', day: 'numeric', year: 'numeric' };
      this.date = now.toLocaleDateString('en-US', options);
    }

    // Day of week
    if (this.settings.showDayOfWeek) {
      const options = { weekday: 'long' };
      this.dayOfWeek = now.toLocaleDateString('en-US', options);
    }

    // Timezone
    if (this.settings.showTimezone) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      this.timezone = timezone;
    }

    this.data = {
      time: this.time,
      date: this.date,
      dayOfWeek: this.dayOfWeek,
      timezone: this.timezone,
      timestamp: now.getTime()
    };
  }

  /**
   * Pad number with leading zero
   * @param {number} num - Number to pad
   * @returns {string} Padded string
   */
  pad(num) {
    return num.toString().padStart(2, '0');
  }

  /**
   * Settings changed handler
   * @param {Object} oldSettings - Old settings
   * @param {Object} newSettings - New settings
   */
  onSettingsChanged(oldSettings, newSettings) {
    // Update time immediately when settings change
    this.updateTime();
  }

  /**
   * Override render to remove widget chrome and use pure Tailwind
   * @returns {string} HTML string
   */
  render() {
    if (!this.data) {
      return `
        <div class="flex flex-col items-center justify-center py-2" data-widget-id="${this.widgetId}">
          <p class="text-dark-muted text-sm">Loading time...</p>
        </div>
      `;
    }

    return `
      <div class="flex flex-col items-center justify-center gap-1 py-2 text-center" data-widget-id="${this.widgetId}">
        <div class="clock-time text-4xl font-bold text-primary-500 tabular-nums tracking-tight cursor-pointer transition-all duration-200 hover:text-primary-400 select-none">
          ${this.data.time}
        </div>
        
        ${this.settings.showDayOfWeek ? `
          <div class="text-sm font-semibold text-dark-text capitalize">
            ${this.data.dayOfWeek}
          </div>
        ` : ''}
        
        ${this.settings.showDate ? `
          <div class="text-xs text-dark-muted">
            ${this.data.date}
          </div>
        ` : ''}
        
        ${this.settings.showTimezone ? `
          <div class="text-xs text-dark-muted font-mono mt-1 px-2 py-0.5 bg-dark-elevated rounded-full">
            ${this.data.timezone}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render widget content (not used since we override render())
   * @returns {string} HTML string
   */
  renderContent() {
    // This is now handled by render() override
    return '';
  }

  /**
   * Widget mounted
   */
  onMount() {
    // Don't call super.onMount() to avoid BaseWidget's default event listeners
    // which expect widget header structure
    
    // Setup format toggle on click
    const timeEl = this.element.querySelector('.clock-time');
    if (timeEl) {
      timeEl.addEventListener('click', () => {
        const newFormat = this.settings.format === '12h' ? '24h' : '12h';
        this.updateSettings({ format: newFormat });
      });
    }
    
    // Start real-time clock updates
    this.startClock();
  }
  
  /**
   * Start clock timer for real-time updates
   */
  startClock() {
    // Clear any existing timer
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
    
    // Update every second
    this.clockTimer = setInterval(() => {
      this.updateTime();
      this.refresh();
    }, 1000);
  }
  
  /**
   * Stop clock timer
   */
  stopClock() {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }
  
  /**
   * Component destroyed - cleanup timer
   */
  onDestroy() {
    this.stopClock();
    super.onDestroy();
  }
}
