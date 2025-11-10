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
   * Render widget content
   * @returns {string} HTML string
   */
  renderContent() {
    if (!this.data) {
      return '<p class="text-dark-muted">Loading time...</p>';
    }

    return `
      <div class="flex flex-col items-center justify-center gap-1.5 py-3 text-center">
        <div class="clock-time text-3xl font-bold text-primary-500 tabular-nums tracking-tight cursor-pointer transition-all duration-200 hover:scale-105 hover:text-primary-400 select-none">
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
   * Widget mounted
   */
  onMount() {
    super.onMount();
    
    // Setup format toggle on click
    const timeEl = this.$('.clock-time');
    if (timeEl) {
      this.on(timeEl, 'click', () => {
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

  /**
   * Add custom styles for clock (REMOVED - using Tailwind now)
   */
  addClockStyles() {
    // No longer needed - using Tailwind CSS
    /*
    const styleId = 'clock-widget-styles';
    
    // Check if styles already exist
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .clock-widget-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-6);
        text-align: center;
        min-height: 150px;
      }

      .clock-time {
        font-size: 3rem;
        font-weight: var(--font-weight-bold);
        color: var(--color-primary);
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.02em;
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
        user-select: none;
      }

      .clock-time:hover {
        transform: scale(1.05);
        color: var(--color-primary-light);
      }

      .clock-day {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        text-transform: capitalize;
      }

      .clock-date {
        font-size: var(--font-size-md);
        color: var(--color-text-secondary);
      }

      .clock-timezone {
        font-size: var(--font-size-sm);
        color: var(--color-text-tertiary);
        margin-top: var(--space-2);
      }

      @media (max-width: 768px) {
        .clock-time {
          font-size: 2.5rem;
        }
        
        .clock-day {
          font-size: var(--font-size-md);
        }
        
        .clock-date {
          font-size: var(--font-size-sm);
        }
      }
    `;
    
    document.head.appendChild(style);
    */
  }
}
