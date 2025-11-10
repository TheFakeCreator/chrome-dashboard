/**
 * FocusStats Service
 * 
 * Tracks and manages focus session statistics:
 * - Total focus time
 * - Completed sessions
 * - Daily/weekly/monthly trends
 * - Streak tracking
 * - Session history
 * 
 * @class FocusStats
 */

export class FocusStats {
  /**
   * Storage keys
   */
  static STORAGE_KEYS = {
    STATS: 'focus_stats',
    SESSIONS: 'focus_sessions',
    STREAKS: 'focus_streaks'
  };

  /**
   * Create FocusStats instance
   * @param {StorageManager} storageManager - Storage manager instance
   */
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.stats = null;
    this.sessions = [];
    this.streaks = null;
    this.initialized = false;

    console.log('[FocusStats] Instance created');
  }

  /**
   * Initialize stats from storage
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load stats
      this.stats = await this.storageManager.get(FocusStats.STORAGE_KEYS.STATS) || this._getDefaultStats();
      
      // Load sessions (last 30 days) - ensure it's always an array
      const loadedSessions = await this.storageManager.get(FocusStats.STORAGE_KEYS.SESSIONS);
      this.sessions = Array.isArray(loadedSessions) ? loadedSessions : [];
      
      // Load streaks
      this.streaks = await this.storageManager.get(FocusStats.STORAGE_KEYS.STREAKS) || this._getDefaultStreaks();

      // Clean old sessions (keep only last 90 days)
      if (this.sessions.length > 0) {
        await this._cleanOldSessions();
      }

      this.initialized = true;
      console.log('[FocusStats] Initialized:', this.stats);
    } catch (error) {
      console.error('[FocusStats] Initialization error:', error);
      this.stats = this._getDefaultStats();
      this.sessions = [];
      this.streaks = this._getDefaultStreaks();
    }
  }

  /**
   * Get default stats structure
   * @private
   */
  _getDefaultStats() {
    return {
      totalFocusTime: 0,        // Total seconds in focus mode
      totalBreakTime: 0,         // Total seconds in break
      completedSessions: 0,      // Total completed work sessions
      completedBreaks: 0,        // Total completed breaks
      todayFocusTime: 0,         // Today's focus time
      todayDate: this._getToday(),
      weekFocusTime: 0,          // This week's focus time
      weekStart: this._getWeekStart(),
      monthFocusTime: 0,         // This month's focus time
      monthStart: this._getMonthStart(),
      lastSessionDate: null,
      createdAt: Date.now()
    };
  }

  /**
   * Get default streaks structure
   * @private
   */
  _getDefaultStreaks() {
    return {
      current: 0,
      longest: 0,
      lastSessionDate: null
    };
  }

  /**
   * Record a completed session
   * @param {Object} sessionData - Session information
   */
  async recordSession(sessionData) {
    await this.initialize();

    const session = {
      id: `session_${Date.now()}`,
      type: sessionData.sessionType,
      duration: sessionData.duration,
      completedAt: Date.now(),
      date: this._getToday()
    };

    // Add to sessions array
    this.sessions.unshift(session);

    // Update stats
    if (sessionData.sessionType === 'work') {
      this.stats.completedSessions++;
      this.stats.totalFocusTime += sessionData.duration;
      this.stats.todayFocusTime += sessionData.duration;
      this.stats.weekFocusTime += sessionData.duration;
      this.stats.monthFocusTime += sessionData.duration;
      
      // Update streaks
      await this._updateStreaks();
    } else {
      this.stats.completedBreaks++;
      this.stats.totalBreakTime += sessionData.duration;
    }

    this.stats.lastSessionDate = Date.now();

    // Reset daily stats if it's a new day
    this._checkAndResetDailyStats();

    // Save to storage
    await this._saveStats();
    await this._saveSessions();

    console.log('[FocusStats] Session recorded:', session);
  }

  /**
   * Update streak information
   * @private
   */
  async _updateStreaks() {
    const today = this._getToday();
    const yesterday = this._getYesterday();
    const lastDate = this.streaks.lastSessionDate;

    if (lastDate === today) {
      // Already recorded today, no change to streak
      return;
    } else if (lastDate === yesterday || lastDate === null) {
      // Continue or start streak
      this.streaks.current++;
      this.streaks.lastSessionDate = today;
      
      if (this.streaks.current > this.streaks.longest) {
        this.streaks.longest = this.streaks.current;
      }
    } else {
      // Streak broken
      this.streaks.current = 1;
      this.streaks.lastSessionDate = today;
    }

    await this.storageManager.set(FocusStats.STORAGE_KEYS.STREAKS, this.streaks);
    console.log('[FocusStats] Streak updated:', this.streaks);
  }

  /**
   * Check and reset daily/weekly/monthly stats
   * @private
   */
  _checkAndResetDailyStats() {
    const today = this._getToday();
    const currentWeek = this._getWeekStart();
    const currentMonth = this._getMonthStart();

    // Reset daily stats
    if (this.stats.todayDate !== today) {
      this.stats.todayFocusTime = 0;
      this.stats.todayDate = today;
    }

    // Reset weekly stats
    if (this.stats.weekStart !== currentWeek) {
      this.stats.weekFocusTime = 0;
      this.stats.weekStart = currentWeek;
    }

    // Reset monthly stats
    if (this.stats.monthStart !== currentMonth) {
      this.stats.monthFocusTime = 0;
      this.stats.monthStart = currentMonth;
    }
  }

  /**
   * Get current statistics
   * @returns {Object} Current stats
   */
  async getStats() {
    await this.initialize();
    this._checkAndResetDailyStats();
    return { ...this.stats };
  }

  /**
   * Get streak information
   * @returns {Object} Streak data
   */
  async getStreaks() {
    await this.initialize();
    return { ...this.streaks };
  }

  /**
   * Get recent sessions
   * @param {number} limit - Number of sessions to return
   * @returns {Array} Recent sessions
   */
  async getRecentSessions(limit = 10) {
    await this.initialize();
    return this.sessions.slice(0, limit);
  }

  /**
   * Get sessions for a specific date
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {Array} Sessions for the date
   */
  async getSessionsByDate(date) {
    await this.initialize();
    return this.sessions.filter(session => session.date === date);
  }

  /**
   * Get daily statistics for last N days
   * @param {number} days - Number of days
   * @returns {Array} Daily stats
   */
  async getDailyStats(days = 7) {
    await this.initialize();

    const dailyStats = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = this._formatDate(date);

      const daySessions = this.sessions.filter(s => s.date === dateStr);
      const focusTime = daySessions
        .filter(s => s.type === 'work')
        .reduce((sum, s) => sum + s.duration, 0);

      dailyStats.push({
        date: dateStr,
        focusTime: focusTime,
        sessionCount: daySessions.filter(s => s.type === 'work').length
      });
    }

    return dailyStats.reverse();
  }

  /**
   * Get productivity score (0-100)
   * @returns {number} Productivity score
   */
  async getProductivityScore() {
    await this.initialize();

    // Base score on various factors
    const todayGoal = 2 * 60 * 60; // 2 hours goal
    const todayProgress = Math.min(this.stats.todayFocusTime / todayGoal, 1);
    
    const streakBonus = Math.min(this.streaks.current * 5, 30);
    
    const baseScore = todayProgress * 70;
    const totalScore = Math.min(baseScore + streakBonus, 100);

    return Math.round(totalScore);
  }

  /**
   * Get formatted statistics summary
   * @returns {Object} Formatted stats
   */
  async getSummary() {
    await this.initialize();

    return {
      today: {
        focusTime: this._formatDuration(this.stats.todayFocusTime),
        focusTimeSeconds: this.stats.todayFocusTime
      },
      week: {
        focusTime: this._formatDuration(this.stats.weekFocusTime),
        focusTimeSeconds: this.stats.weekFocusTime
      },
      month: {
        focusTime: this._formatDuration(this.stats.monthFocusTime),
        focusTimeSeconds: this.stats.monthFocusTime
      },
      total: {
        focusTime: this._formatDuration(this.stats.totalFocusTime),
        sessions: this.stats.completedSessions
      },
      streaks: this.streaks,
      productivityScore: await this.getProductivityScore()
    };
  }

  /**
   * Reset all statistics
   */
  async reset() {
    this.stats = this._getDefaultStats();
    this.sessions = [];
    this.streaks = this._getDefaultStreaks();

    await this._saveStats();
    await this._saveSessions();
    await this.storageManager.set(FocusStats.STORAGE_KEYS.STREAKS, this.streaks);

    console.log('[FocusStats] All stats reset');
  }

  /**
   * Save stats to storage
   * @private
   */
  async _saveStats() {
    await this.storageManager.set(FocusStats.STORAGE_KEYS.STATS, this.stats);
  }

  /**
   * Save sessions to storage
   * @private
   */
  async _saveSessions() {
    // Only keep last 90 days
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    this.sessions = this.sessions.filter(s => s.completedAt > ninetyDaysAgo);
    
    await this.storageManager.set(FocusStats.STORAGE_KEYS.SESSIONS, this.sessions);
  }

  /**
   * Clean old sessions
   * @private
   */
  async _cleanOldSessions() {
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const originalLength = this.sessions.length;
    
    this.sessions = this.sessions.filter(s => s.completedAt > ninetyDaysAgo);
    
    if (this.sessions.length < originalLength) {
      await this._saveSessions();
      console.log(`[FocusStats] Cleaned ${originalLength - this.sessions.length} old sessions`);
    }
  }

  /**
   * Get today's date string (YYYY-MM-DD)
   * @private
   */
  _getToday() {
    return this._formatDate(new Date());
  }

  /**
   * Get yesterday's date string (YYYY-MM-DD)
   * @private
   */
  _getYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this._formatDate(yesterday);
  }

  /**
   * Get week start date string (YYYY-MM-DD)
   * @private
   */
  _getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
    const monday = new Date(now.setDate(diff));
    return this._formatDate(monday);
  }

  /**
   * Get month start date string (YYYY-MM-DD)
   * @private
   */
  _getMonthStart() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  /**
   * Format date as YYYY-MM-DD
   * @private
   */
  _formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format duration as human-readable string
   * @private
   */
  _formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
