/**
 * PomodoroTimer Service
 * 
 * Manages Pomodoro timer logic with configurable intervals:
 * - Work sessions (default: 25 minutes)
 * - Short breaks (default: 5 minutes)
 * - Long breaks (default: 15 minutes)
 * 
 * @class PomodoroTimer
 */

export class PomodoroTimer {
  /**
   * Timer states
   */
  static STATE = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed'
  };

  /**
   * Session types
   */
  static SESSION_TYPE = {
    WORK: 'work',
    SHORT_BREAK: 'short_break',
    LONG_BREAK: 'long_break'
  };

  /**
   * Default durations (in seconds)
   */
  static DEFAULT_DURATIONS = {
    work: 25 * 60,        // 25 minutes
    short_break: 5 * 60,  // 5 minutes
    long_break: 15 * 60   // 15 minutes
  };

  /**
   * Create PomodoroTimer instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.durations = {
      ...PomodoroTimer.DEFAULT_DURATIONS,
      ...options.durations
    };

    this.state = PomodoroTimer.STATE.IDLE;
    this.sessionType = PomodoroTimer.SESSION_TYPE.WORK;
    this.timeRemaining = this.durations.work;
    this.sessionCount = 0;
    this.sessionsBeforeLongBreak = options.sessionsBeforeLongBreak || 4;
    
    this.intervalId = null;
    this.startTime = null;
    this.pausedTime = null;
    
    this.listeners = {
      tick: [],
      stateChange: [],
      sessionComplete: [],
      sessionStart: []
    };

    console.log('[PomodoroTimer] Initialized with durations:', this.durations);
  }

  /**
   * Start or resume the timer
   */
  start() {
    if (this.state === PomodoroTimer.STATE.RUNNING) {
      console.warn('[PomodoroTimer] Timer already running');
      return;
    }

    const previousState = this.state;
    this.state = PomodoroTimer.STATE.RUNNING;

    if (previousState === PomodoroTimer.STATE.IDLE) {
      this.startTime = Date.now();
      this.emit('sessionStart', {
        sessionType: this.sessionType,
        duration: this.getDuration(),
        sessionCount: this.sessionCount
      });
    } else if (previousState === PomodoroTimer.STATE.PAUSED) {
      // Adjust start time when resuming from pause
      const pauseDuration = Date.now() - this.pausedTime;
      this.startTime += pauseDuration;
    }

    this.intervalId = setInterval(() => this._tick(), 1000);
    this.emit('stateChange', { state: this.state, sessionType: this.sessionType });
    
    console.log('[PomodoroTimer] Started:', this.sessionType);
  }

  /**
   * Pause the timer
   */
  pause() {
    if (this.state !== PomodoroTimer.STATE.RUNNING) {
      console.warn('[PomodoroTimer] Timer not running');
      return;
    }

    this.state = PomodoroTimer.STATE.PAUSED;
    this.pausedTime = Date.now();
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.emit('stateChange', { state: this.state, sessionType: this.sessionType });
    console.log('[PomodoroTimer] Paused');
  }

  /**
   * Stop the timer and reset
   */
  stop() {
    this.state = PomodoroTimer.STATE.IDLE;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.timeRemaining = this.getDuration();
    this.startTime = null;
    this.pausedTime = null;

    this.emit('stateChange', { state: this.state, sessionType: this.sessionType });
    this.emit('tick', { timeRemaining: this.timeRemaining, progress: 0 });
    
    console.log('[PomodoroTimer] Stopped');
  }

  /**
   * Reset the timer to initial state
   */
  reset() {
    this.stop();
    this.sessionType = PomodoroTimer.SESSION_TYPE.WORK;
    this.sessionCount = 0;
    this.timeRemaining = this.durations.work;
    
    this.emit('stateChange', { state: this.state, sessionType: this.sessionType });
    this.emit('tick', { timeRemaining: this.timeRemaining, progress: 0 });
    
    console.log('[PomodoroTimer] Reset');
  }

  /**
   * Skip to next session
   */
  skipSession() {
    this.stop();
    this._nextSession();
    console.log('[PomodoroTimer] Skipped to next session:', this.sessionType);
  }

  /**
   * Timer tick handler
   * @private
   */
  _tick() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const duration = this.getDuration();
    this.timeRemaining = Math.max(0, duration - elapsed);

    const progress = ((duration - this.timeRemaining) / duration) * 100;

    this.emit('tick', { 
      timeRemaining: this.timeRemaining, 
      progress: progress,
      elapsed: elapsed 
    });

    if (this.timeRemaining <= 0) {
      this._completeSession();
    }
  }

  /**
   * Complete current session and move to next
   * @private
   */
  _completeSession() {
    this.state = PomodoroTimer.STATE.COMPLETED;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const completedSessionType = this.sessionType;

    // Emit completion event
    this.emit('sessionComplete', {
      sessionType: completedSessionType,
      sessionCount: this.sessionCount,
      duration: this.getDuration()
    });

    console.log('[PomodoroTimer] Session completed:', completedSessionType);

    // Move to next session
    this._nextSession();
  }

  /**
   * Move to next session type
   * @private
   */
  _nextSession() {
    if (this.sessionType === PomodoroTimer.SESSION_TYPE.WORK) {
      this.sessionCount++;
      
      // Determine break type
      if (this.sessionCount % this.sessionsBeforeLongBreak === 0) {
        this.sessionType = PomodoroTimer.SESSION_TYPE.LONG_BREAK;
      } else {
        this.sessionType = PomodoroTimer.SESSION_TYPE.SHORT_BREAK;
      }
    } else {
      // After any break, return to work
      this.sessionType = PomodoroTimer.SESSION_TYPE.WORK;
    }

    this.state = PomodoroTimer.STATE.IDLE;
    this.timeRemaining = this.getDuration();
    this.startTime = null;

    this.emit('stateChange', { 
      state: this.state, 
      sessionType: this.sessionType,
      sessionCount: this.sessionCount 
    });
    this.emit('tick', { timeRemaining: this.timeRemaining, progress: 0 });
  }

  /**
   * Get duration for current session type
   * @returns {number} Duration in seconds
   */
  getDuration() {
    return this.durations[this.sessionType];
  }

  /**
   * Get current state
   * @returns {Object} Current timer state
   */
  getState() {
    return {
      state: this.state,
      sessionType: this.sessionType,
      timeRemaining: this.timeRemaining,
      sessionCount: this.sessionCount,
      duration: this.getDuration(),
      progress: ((this.getDuration() - this.timeRemaining) / this.getDuration()) * 100
    };
  }

  /**
   * Update timer durations
   * @param {Object} durations - New duration values
   */
  updateDurations(durations) {
    this.durations = {
      ...this.durations,
      ...durations
    };

    // If timer is idle, update time remaining
    if (this.state === PomodoroTimer.STATE.IDLE) {
      this.timeRemaining = this.getDuration();
      this.emit('tick', { timeRemaining: this.timeRemaining, progress: 0 });
    }

    console.log('[PomodoroTimer] Durations updated:', this.durations);
  }

  /**
   * Update sessions before long break
   * @param {number} count - Number of sessions
   */
  updateSessionsBeforeLongBreak(count) {
    this.sessionsBeforeLongBreak = count;
    console.log('[PomodoroTimer] Sessions before long break updated:', count);
  }

  /**
   * Format time as MM:SS
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @private
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[PomodoroTimer] Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Cleanup timer
   */
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.listeners = {
      tick: [],
      stateChange: [],
      sessionComplete: [],
      sessionStart: []
    };

    console.log('[PomodoroTimer] Destroyed');
  }
}

// Export singleton instance
export default new PomodoroTimer();
