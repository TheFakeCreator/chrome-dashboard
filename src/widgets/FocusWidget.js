/**
 * FocusWidget - Pomodoro Timer & Focus Mode
 * 
 * A beautiful focus timer with:
 * - Circular progress visualization
 * - Pomodoro technique (25/5/15 intervals)
 * - Session tracking and statistics
 * - Break reminders
 * - Customizable durations
 * 
 * @class FocusWidget
 * @extends {BaseWidget}
 */

import { BaseWidget } from './BaseWidget.js';
import { PomodoroTimer } from '../services/PomodoroTimer.js';
import { FocusStats } from '../services/FocusStats.js';

export class FocusWidget extends BaseWidget {
  constructor(app, options = {}) {
    super(app, {
      widgetId: options.widgetId || 'focus-widget',
      title: '🍅 Focus Mode',
      description: 'Pomodoro timer for focused work sessions',
      className: 'focus-widget',
      ...options
    });

    this.timer = new PomodoroTimer(options.timerOptions);
    this.stats = new FocusStats(app.storageManager);
    this.view = 'timer'; // 'timer' or 'stats'
    
    this._setupTimerListeners();
    console.log('[FocusWidget] Initialized');
  }

  /**
   * Setup timer event listeners
   * @private
   */
  _setupTimerListeners() {
    this.timer.on('tick', (data) => {
      this._updateTimerDisplay(data);
    });

    this.timer.on('stateChange', (data) => {
      this._updateControls(data);
    });

    this.timer.on('sessionComplete', async (data) => {
      await this._handleSessionComplete(data);
    });

    this.timer.on('sessionStart', (data) => {
      console.log('[FocusWidget] Session started:', data);
    });
  }

  /**
   * Load widget data
   */
  async loadData() {
    try {
      await this.stats.initialize();
      const summary = await this.stats.getSummary();
      console.log('[FocusWidget] Stats loaded:', summary);
    } catch (error) {
      console.error('[FocusWidget] Error loading data:', error);
    }
  }

  /**
   * Render widget content
   */
  renderContent() {
    return `
      <div class="focus-widget-container">
        <!-- View Toggle -->
        <div class="flex gap-2 mb-4 justify-center">
          <button 
            data-view-toggle="timer"
            class="view-toggle-btn ${this.view === 'timer' ? 'active' : ''} px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            🍅 Timer
          </button>
          <button 
            data-view-toggle="stats"
            class="view-toggle-btn ${this.view === 'stats' ? 'active' : ''} px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            📊 Stats
          </button>
        </div>

        <!-- Timer View -->
        <div data-view="timer" class="${this.view === 'timer' ? '' : 'hidden'}">
          ${this._renderTimerView()}
        </div>

        <!-- Stats View -->
        <div data-view="stats" class="${this.view === 'stats' ? '' : 'hidden'}">
          ${this._renderStatsView()}
        </div>
      </div>
    `;
  }

  /**
   * Render timer view
   * @private
   */
  _renderTimerView() {
    const state = this.timer.getState();
    const sessionLabel = this._getSessionLabel(state.sessionType);
    
    return `
      <div class="timer-view">
        <!-- Session Type -->
        <div class="text-center mb-4">
          <div class="text-lg font-semibold text-primary-400" data-session-label>
            ${sessionLabel}
          </div>
          <div class="text-sm text-dark-text-muted mt-1">
            Session #<span data-session-count>${state.sessionCount}</span>
          </div>
        </div>

        <!-- Circular Timer -->
        <div class="timer-circle-container relative mx-auto" style="width: 240px; height: 240px;">
          <!-- SVG Circle Progress -->
          <svg class="timer-circle" width="240" height="240" viewBox="0 0 240 240">
            <circle
              class="timer-circle-bg"
              cx="120"
              cy="120"
              r="110"
              fill="none"
              stroke="currentColor"
              stroke-width="8"
              opacity="0.1"
            />
            <circle
              class="timer-circle-progress"
              data-progress-circle
              cx="120"
              cy="120"
              r="110"
              fill="none"
              stroke="currentColor"
              stroke-width="8"
              stroke-linecap="round"
              transform="rotate(-90 120 120)"
              style="
                stroke-dasharray: ${2 * Math.PI * 110};
                stroke-dashoffset: ${2 * Math.PI * 110 * (1 - state.progress / 100)};
                transition: stroke-dashoffset 0.3s ease;
              "
            />
          </svg>

          <!-- Time Display -->
          <div class="absolute inset-0 flex items-center justify-center flex-col">
            <div 
              class="text-5xl font-bold text-primary-300"
              data-time-display
            >
              ${PomodoroTimer.formatTime(state.timeRemaining)}
            </div>
            <div class="text-sm text-dark-text-muted mt-2">
              ${this._getStateLabel(state.state)}
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="timer-controls flex gap-3 justify-center mt-8">
          <button
            data-action="start"
            class="control-btn control-btn-primary ${state.state === PomodoroTimer.STATE.RUNNING ? 'hidden' : ''} 
                   px-6 py-3 rounded-lg font-medium text-white transition-all hover:scale-105"
          >
            ${state.state === PomodoroTimer.STATE.PAUSED ? '▶️ Resume' : '▶️ Start'}
          </button>
          
          <button
            data-action="pause"
            class="control-btn control-btn-warning ${state.state === PomodoroTimer.STATE.RUNNING ? '' : 'hidden'}
                   px-6 py-3 rounded-lg font-medium text-white transition-all hover:scale-105"
          >
            ⏸️ Pause
          </button>

          <button
            data-action="stop"
            class="control-btn control-btn-danger ${state.state === PomodoroTimer.STATE.IDLE ? 'hidden' : ''}
                   px-4 py-3 rounded-lg font-medium text-white transition-all hover:scale-105"
          >
            ⏹️ Stop
          </button>

          <button
            data-action="skip"
            class="control-btn control-btn-secondary px-4 py-3 rounded-lg font-medium transition-all hover:scale-105"
          >
            ⏭️ Skip
          </button>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats grid grid-cols-3 gap-3 mt-6" data-quick-stats>
          <div class="stat-card bg-dark-surface/40 p-3 rounded-lg text-center">
            <div class="text-2xl font-bold text-primary-400" data-stat="today">--</div>
            <div class="text-xs text-dark-text-muted mt-1">Today</div>
          </div>
          <div class="stat-card bg-dark-surface/40 p-3 rounded-lg text-center">
            <div class="text-2xl font-bold text-green-400" data-stat="streak">--</div>
            <div class="text-xs text-dark-text-muted mt-1">Streak</div>
          </div>
          <div class="stat-card bg-dark-surface/40 p-3 rounded-lg text-center">
            <div class="text-2xl font-bold text-blue-400" data-stat="total">--</div>
            <div class="text-xs text-dark-text-muted mt-1">Total</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render stats view
   * @private
   */
  _renderStatsView() {
    return `
      <div class="stats-view" data-stats-container>
        <div class="text-center text-dark-text-muted py-8">
          Loading statistics...
        </div>
      </div>
    `;
  }

  /**
   * Get session label
   * @private
   */
  _getSessionLabel(sessionType) {
    const labels = {
      work: '🎯 Focus Session',
      short_break: '☕ Short Break',
      long_break: '🌟 Long Break'
    };
    return labels[sessionType] || 'Session';
  }

  /**
   * Get state label
   * @private
   */
  _getStateLabel(state) {
    const labels = {
      idle: 'Ready to start',
      running: 'In progress',
      paused: 'Paused',
      completed: 'Completed'
    };
    return labels[state] || '';
  }

  /**
   * Update timer display
   * @private
   */
  _updateTimerDisplay(data) {
    const timeDisplay = this.element.querySelector('[data-time-display]');
    const progressCircle = this.element.querySelector('[data-progress-circle]');

    if (timeDisplay) {
      timeDisplay.textContent = PomodoroTimer.formatTime(data.timeRemaining);
    }

    if (progressCircle) {
      const circumference = 2 * Math.PI * 110;
      const offset = circumference * (1 - data.progress / 100);
      progressCircle.style.strokeDashoffset = offset;
    }
  }

  /**
   * Update control buttons
   * @private
   */
  _updateControls(data) {
    const startBtn = this.element.querySelector('[data-action="start"]');
    const pauseBtn = this.element.querySelector('[data-action="pause"]');
    const stopBtn = this.element.querySelector('[data-action="stop"]');
    const sessionLabel = this.element.querySelector('[data-session-label]');
    const sessionCount = this.element.querySelector('[data-session-count]');

    if (sessionLabel) {
      sessionLabel.textContent = this._getSessionLabel(data.sessionType);
    }

    if (sessionCount) {
      sessionCount.textContent = data.sessionCount || 0;
    }

    if (startBtn && pauseBtn && stopBtn) {
      if (data.state === PomodoroTimer.STATE.RUNNING) {
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        stopBtn.classList.remove('hidden');
      } else if (data.state === PomodoroTimer.STATE.PAUSED) {
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        startBtn.textContent = '▶️ Resume';
      } else {
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        stopBtn.classList.add('hidden');
        startBtn.textContent = '▶️ Start';
      }
    }
  }

  /**
   * Handle session completion
   * @private
   */
  async _handleSessionComplete(data) {
    console.log('[FocusWidget] Session completed:', data);

    // Record stats
    await this.stats.recordSession(data);

    // Update quick stats
    await this._updateQuickStats();

    // Show notification
    this._showNotification(data);

    // Auto-start next session if it's a break
    if (data.sessionType === 'work') {
      // Optional: auto-start break
      // setTimeout(() => this.timer.start(), 3000);
    }
  }

  /**
   * Show notification for session completion
   * @private
   */
  _showNotification(data) {
    const isWork = data.sessionType === 'work';
    const title = isWork ? '🎉 Focus Session Complete!' : '✨ Break Complete!';
    const message = isWork 
      ? 'Great work! Time for a break.'
      : 'Break is over. Ready to focus?';

    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: title,
        message: message,
        priority: 2
      });
    }
  }

  /**
   * Update quick stats display
   * @private
   */
  async _updateQuickStats() {
    const summary = await this.stats.getSummary();
    
    const todayEl = this.element.querySelector('[data-stat="today"]');
    const streakEl = this.element.querySelector('[data-stat="streak"]');
    const totalEl = this.element.querySelector('[data-stat="total"]');

    if (todayEl) todayEl.textContent = summary.today.focusTime;
    if (streakEl) streakEl.textContent = `${summary.streaks.current}d`;
    if (totalEl) totalEl.textContent = summary.total.sessions;
  }

  /**
   * Load and render full stats
   * @private
   */
  async _loadFullStats() {
    const summary = await this.stats.getSummary();
    const dailyStats = await this.stats.getDailyStats(7);

    const statsContainer = this.element.querySelector('[data-stats-container]');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
      <div class="space-y-4">
        <!-- Productivity Score -->
        <div class="bg-gradient-to-r from-primary-500/20 to-purple-500/20 p-4 rounded-lg">
          <div class="text-center">
            <div class="text-4xl font-bold text-primary-300">${summary.productivityScore}</div>
            <div class="text-sm text-dark-text-muted mt-1">Productivity Score</div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div class="stat-card bg-dark-surface/40 p-4 rounded-lg">
            <div class="text-sm text-dark-text-muted mb-1">Today</div>
            <div class="text-2xl font-bold text-primary-400">${summary.today.focusTime}</div>
          </div>
          <div class="stat-card bg-dark-surface/40 p-4 rounded-lg">
            <div class="text-sm text-dark-text-muted mb-1">This Week</div>
            <div class="text-2xl font-bold text-blue-400">${summary.week.focusTime}</div>
          </div>
          <div class="stat-card bg-dark-surface/40 p-4 rounded-lg">
            <div class="text-sm text-dark-text-muted mb-1">Current Streak</div>
            <div class="text-2xl font-bold text-green-400">${summary.streaks.current} days</div>
          </div>
          <div class="stat-card bg-dark-surface/40 p-4 rounded-lg">
            <div class="text-sm text-dark-text-muted mb-1">Longest Streak</div>
            <div class="text-2xl font-bold text-purple-400">${summary.streaks.longest} days</div>
          </div>
        </div>

        <!-- Total Stats -->
        <div class="bg-dark-surface/40 p-4 rounded-lg">
          <div class="text-sm text-dark-text-muted mb-2">All Time</div>
          <div class="flex justify-between items-center">
            <div>
              <div class="text-xl font-bold text-primary-300">${summary.total.focusTime}</div>
              <div class="text-xs text-dark-text-muted">Total Focus Time</div>
            </div>
            <div>
              <div class="text-xl font-bold text-primary-300">${summary.total.sessions}</div>
              <div class="text-xs text-dark-text-muted">Sessions Completed</div>
            </div>
          </div>
        </div>

        <!-- Last 7 Days Chart (Simple) -->
        <div class="bg-dark-surface/40 p-4 rounded-lg">
          <div class="text-sm text-dark-text-muted mb-3">Last 7 Days</div>
          <div class="space-y-2">
            ${dailyStats.map(day => `
              <div class="flex items-center gap-2">
                <div class="text-xs text-dark-text-muted w-20">${this._formatDateShort(day.date)}</div>
                <div class="flex-1 h-6 bg-dark-surface rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all"
                    style="width: ${Math.min((day.focusTime / (2 * 60 * 60)) * 100, 100)}%"
                  ></div>
                </div>
                <div class="text-xs text-dark-text-muted w-16 text-right">${this._formatMinutes(day.focusTime)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format date for display (e.g., "Mon 11")
   * @private
   */
  _formatDateShort(dateStr) {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()}`;
  }

  /**
   * Format seconds to minutes
   * @private
   */
  _formatMinutes(seconds) {
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      return `${hours}h ${mins % 60}m`;
    }
    return `${mins}m`;
  }

  /**
   * Switch between views
   * @private
   */
  _switchView(view) {
    this.view = view;
    
    const timerView = this.element.querySelector('[data-view="timer"]');
    const statsView = this.element.querySelector('[data-view="stats"]');
    const toggleBtns = this.element.querySelectorAll('[data-view-toggle]');

    toggleBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.viewToggle === view);
    });

    if (view === 'timer') {
      timerView?.classList.remove('hidden');
      statsView?.classList.add('hidden');
    } else {
      timerView?.classList.add('hidden');
      statsView?.classList.remove('hidden');
      this._loadFullStats();
    }
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    // Control buttons
    this.element.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action) {
        this._handleAction(action);
      }

      // View toggle
      const viewToggle = e.target.closest('[data-view-toggle]')?.dataset.viewToggle;
      if (viewToggle) {
        this._switchView(viewToggle);
      }
    });
  }

  /**
   * Handle action button clicks
   * @private
   */
  _handleAction(action) {
    switch (action) {
      case 'start':
        this.timer.start();
        break;
      case 'pause':
        this.timer.pause();
        break;
      case 'stop':
        this.timer.stop();
        break;
      case 'skip':
        this.timer.skipSession();
        break;
    }
  }

  /**
   * Called after rendering
   */
  async afterRender() {
    await this._updateQuickStats();
  }

  /**
   * Cleanup
   */
  destroy() {
    this.timer.destroy();
    super.destroy();
  }
}
