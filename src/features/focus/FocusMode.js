/**
 * @module FocusMode
 * @description Manages focus mode sessions and Pomodoro timer functionality
 */

import { PomodoroTimer } from './PomodoroTimer.js';
import { FocusStats } from './FocusStats.js';

export class FocusMode {
  constructor() {
    this.isActive = false;
    this.isPaused = false;
    this.pomodoroTimer = new PomodoroTimer();
    this.focusStats = new FocusStats();
    this.blockedSites = [];
    this.currentSession = null;
    
    this.init();
  }

  /**
   * Initialize focus mode
   */
  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  /**
   * Load focus mode settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get({
        focusMode: {
          blockedSites: [
            'facebook.com',
            'twitter.com',
            'youtube.com',
            'instagram.com',
            'reddit.com',
            'tiktok.com'
          ],
          workDuration: 25,
          shortBreak: 5,
          longBreak: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartPomodoros: false,
          notifications: true,
          sound: true
        }
      });

      this.settings = result.focusMode;
      this.blockedSites = this.settings.blockedSites;
      this.pomodoroTimer.setDurations(
        this.settings.workDuration,
        this.settings.shortBreak,
        this.settings.longBreak
      );
    } catch (error) {
      console.error('Error loading focus mode settings:', error);
    }
  }

  /**
   * Setup event listeners for focus mode controls
   */
  setupEventListeners() {
    // Start/Stop focus mode button
    const focusBtn = document.getElementById('focus-mode-btn');
    if (focusBtn) {
      focusBtn.addEventListener('click', () => this.toggle());
    }

    // Timer controls
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');
    const skipBtn = document.getElementById('timer-skip');

    if (startBtn) {
      startBtn.addEventListener('click', () => this.startTimer());
    }
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pauseTimer());
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetTimer());
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipTimer());
    }

    // Listen for timer events
    this.pomodoroTimer.on('tick', (timeLeft) => this.onTimerTick(timeLeft));
    this.pomodoroTimer.on('complete', () => this.onTimerComplete());
    this.pomodoroTimer.on('sessionComplete', (session) => this.onSessionComplete(session));
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+F to toggle focus mode
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        this.toggle();
      }
      
      // Space to start/pause timer (when focus mode is active)
      if (this.isActive && e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (this.pomodoroTimer.isRunning) {
          this.pauseTimer();
        } else {
          this.startTimer();
        }
      }
    });
  }

  /**
   * Toggle focus mode on/off
   */
  async toggle() {
    if (this.isActive) {
      await this.stop();
    } else {
      await this.start();
    }
  }

  /**
   * Start focus mode
   */
  async start() {
    this.isActive = true;
    this.currentSession = {
      startTime: Date.now(),
      type: 'focus',
      completed: false
    };

    // Update UI
    this.updateUI();
    
    // Enable site blocking
    await this.enableSiteBlocking();
    
    // Show notification
    if (this.settings.notifications) {
      this.showNotification('Focus Mode Started', 'Stay focused! Distracting sites are now blocked.');
    }

    // Save state
    await this.saveState();
  }

  /**
   * Stop focus mode
   */
  async stop() {
    this.isActive = false;
    
    // Stop timer if running
    if (this.pomodoroTimer.isRunning) {
      this.pomodoroTimer.stop();
    }

    // Complete current session
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.completed = false; // Manually stopped
      await this.focusStats.saveSession(this.currentSession);
      this.currentSession = null;
    }

    // Update UI
    this.updateUI();
    
    // Disable site blocking
    await this.disableSiteBlocking();
    
    // Show notification
    if (this.settings.notifications) {
      this.showNotification('Focus Mode Ended', 'Well done! You can now access all sites.');
    }

    // Save state
    await this.saveState();
  }

  /**
   * Start the Pomodoro timer
   */
  startTimer() {
    if (!this.isActive) {
      this.start();
    }
    this.pomodoroTimer.start();
    this.isPaused = false;
    this.updateUI();
  }

  /**
   * Pause the Pomodoro timer
   */
  pauseTimer() {
    this.pomodoroTimer.pause();
    this.isPaused = true;
    this.updateUI();
  }

  /**
   * Reset the Pomodoro timer
   */
  resetTimer() {
    this.pomodoroTimer.reset();
    this.isPaused = false;
    this.updateUI();
  }

  /**
   * Skip current timer session
   */
  skipTimer() {
    this.pomodoroTimer.skip();
    this.updateUI();
  }

  /**
   * Handle timer tick event
   */
  onTimerTick(timeLeft) {
    this.updateTimerDisplay(timeLeft);
  }

  /**
   * Handle timer complete event
   */
  onTimerComplete() {
    // Play sound if enabled
    if (this.settings.sound) {
      this.playNotificationSound();
    }

    // Show notification
    const isBreak = this.pomodoroTimer.isBreakTime();
    const message = isBreak 
      ? 'Break time! Take a rest.' 
      : 'Break is over! Time to focus.';
    
    if (this.settings.notifications) {
      this.showNotification('Timer Complete', message);
    }
  }

  /**
   * Handle session complete event
   */
  async onSessionComplete(session) {
    // Save session stats
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.completed = true;
      this.currentSession.duration = session.duration;
      await this.focusStats.saveSession(this.currentSession);
    }

    // Start new session if auto-start is enabled
    if (session.type === 'work' && this.settings.autoStartBreaks) {
      this.startTimer();
    } else if (session.type === 'break' && this.settings.autoStartPomodoros) {
      this.startTimer();
    }
  }

  /**
   * Enable site blocking
   */
  async enableSiteBlocking() {
    try {
      await chrome.storage.local.set({ focusModeActive: true, blockedSites: this.blockedSites });
      // Background script will handle the actual blocking
    } catch (error) {
      console.error('Error enabling site blocking:', error);
    }
  }

  /**
   * Disable site blocking
   */
  async disableSiteBlocking() {
    try {
      await chrome.storage.local.set({ focusModeActive: false });
    } catch (error) {
      console.error('Error disabling site blocking:', error);
    }
  }

  /**
   * Update UI to reflect current focus mode state
   */
  updateUI() {
    const focusContainer = document.getElementById('focus-mode-container');
    if (!focusContainer) return;

    if (this.isActive) {
      focusContainer.classList.add('active');
      document.body.classList.add('focus-mode-active');
    } else {
      focusContainer.classList.remove('active');
      document.body.classList.remove('focus-mode-active');
    }

    // Update button states
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    
    if (this.pomodoroTimer.isRunning) {
      startBtn?.classList.add('hidden');
      pauseBtn?.classList.remove('hidden');
    } else {
      startBtn?.classList.remove('hidden');
      pauseBtn?.classList.add('hidden');
    }
  }

  /**
   * Update timer display
   */
  updateTimerDisplay(timeLeft) {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * Show browser notification
   */
  showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/src/assets/icons/icon128.png'
      });
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    const audio = new Audio('/src/assets/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.error('Error playing sound:', err));
  }

  /**
   * Save focus mode state
   */
  async saveState() {
    try {
      await chrome.storage.local.set({
        focusModeState: {
          isActive: this.isActive,
          isPaused: this.isPaused,
          currentSession: this.currentSession
        }
      });
    } catch (error) {
      console.error('Error saving focus mode state:', error);
    }
  }

  /**
   * Get focus mode statistics
   */
  async getStats() {
    return await this.focusStats.getStats();
  }
}
