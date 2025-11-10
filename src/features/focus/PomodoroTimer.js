/**
 * @module PomodoroTimer
 * @description Handles Pomodoro timer functionality with work/break intervals
 */

export class PomodoroTimer {
  constructor() {
    this.workDuration = 25 * 60; // 25 minutes in seconds
    this.shortBreakDuration = 5 * 60; // 5 minutes
    this.longBreakDuration = 15 * 60; // 15 minutes
    this.sessionsBeforeLongBreak = 4;
    
    this.timeLeft = this.workDuration;
    this.isRunning = false;
    this.currentType = 'work'; // 'work', 'shortBreak', 'longBreak'
    this.completedSessions = 0;
    this.intervalId = null;
    
    this.listeners = {
      tick: [],
      complete: [],
      sessionComplete: []
    };
  }

  /**
   * Set timer durations
   */
  setDurations(work, shortBreak, longBreak) {
    this.workDuration = work * 60;
    this.shortBreakDuration = shortBreak * 60;
    this.longBreakDuration = longBreak * 60;
    
    // Reset to work duration if not running
    if (!this.isRunning && this.currentType === 'work') {
      this.timeLeft = this.workDuration;
    }
  }

  /**
   * Start the timer
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
    
    this.emit('tick', this.timeLeft);
  }

  /**
   * Pause the timer
   */
  pause() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Stop the timer completely
   */
  stop() {
    this.pause();
    this.reset();
  }

  /**
   * Reset the timer to the current type's duration
   */
  reset() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.timeLeft = this.getCurrentDuration();
    this.emit('tick', this.timeLeft);
  }

  /**
   * Skip to next session
   */
  skip() {
    this.complete();
  }

  /**
   * Timer tick (called every second)
   */
  tick() {
    if (this.timeLeft > 0) {
      this.timeLeft--;
      this.emit('tick', this.timeLeft);
    } else {
      this.complete();
    }
  }

  /**
   * Complete current session
   */
  complete() {
    const sessionData = {
      type: this.currentType,
      duration: this.getCurrentDuration(),
      timestamp: Date.now()
    };
    
    // Emit complete event
    this.emit('complete');
    this.emit('sessionComplete', sessionData);
    
    // Move to next session type
    if (this.currentType === 'work') {
      this.completedSessions++;
      
      // Determine if it's time for a long break
      if (this.completedSessions % this.sessionsBeforeLongBreak === 0) {
        this.currentType = 'longBreak';
      } else {
        this.currentType = 'shortBreak';
      }
    } else {
      // After any break, go back to work
      this.currentType = 'work';
    }
    
    // Reset timer to new duration
    this.timeLeft = this.getCurrentDuration();
    this.pause();
    this.emit('tick', this.timeLeft);
  }

  /**
   * Get current duration based on type
   */
  getCurrentDuration() {
    switch (this.currentType) {
      case 'work':
        return this.workDuration;
      case 'shortBreak':
        return this.shortBreakDuration;
      case 'longBreak':
        return this.longBreakDuration;
      default:
        return this.workDuration;
    }
  }

  /**
   * Check if currently in break time
   */
  isBreakTime() {
    return this.currentType === 'shortBreak' || this.currentType === 'longBreak';
  }

  /**
   * Get current session info
   */
  getCurrentSession() {
    return {
      type: this.currentType,
      timeLeft: this.timeLeft,
      totalDuration: this.getCurrentDuration(),
      completedSessions: this.completedSessions,
      isRunning: this.isRunning,
      progress: 1 - (this.timeLeft / this.getCurrentDuration())
    };
  }

  /**
   * Get session count until long break
   */
  getSessionsUntilLongBreak() {
    return this.sessionsBeforeLongBreak - (this.completedSessions % this.sessionsBeforeLongBreak);
  }

  /**
   * Event listener management
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Get timer state for saving
   */
  getState() {
    return {
      timeLeft: this.timeLeft,
      isRunning: this.isRunning,
      currentType: this.currentType,
      completedSessions: this.completedSessions
    };
  }

  /**
   * Restore timer state
   */
  setState(state) {
    this.timeLeft = state.timeLeft || this.workDuration;
    this.currentType = state.currentType || 'work';
    this.completedSessions = state.completedSessions || 0;
    
    if (state.isRunning) {
      this.start();
    }
  }
}
