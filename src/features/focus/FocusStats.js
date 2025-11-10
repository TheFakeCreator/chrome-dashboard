/**
 * @module FocusStats
 * @description Tracks and manages focus session statistics
 */

export class FocusStats {
  constructor() {
    this.sessions = [];
    this.init();
  }

  /**
   * Initialize stats
   */
  async init() {
    await this.loadSessions();
  }

  /**
   * Load sessions from storage
   */
  async loadSessions() {
    try {
      const result = await chrome.storage.local.get({ focusSessions: [] });
      this.sessions = result.focusSessions || [];
    } catch (error) {
      console.error('Error loading focus sessions:', error);
      this.sessions = [];
    }
  }

  /**
   * Save a new session
   */
  async saveSession(session) {
    try {
      this.sessions.push({
        ...session,
        id: Date.now(),
        duration: session.endTime - session.startTime
      });

      // Keep only last 1000 sessions
      if (this.sessions.length > 1000) {
        this.sessions = this.sessions.slice(-1000);
      }

      await chrome.storage.local.set({ focusSessions: this.sessions });
    } catch (error) {
      console.error('Error saving focus session:', error);
    }
  }

  /**
   * Get all statistics
   */
  async getStats() {
    await this.loadSessions();

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const todaySessions = this.sessions.filter(s => s.startTime >= oneDayAgo);
    const weekSessions = this.sessions.filter(s => s.startTime >= oneWeekAgo);
    const monthSessions = this.sessions.filter(s => s.startTime >= oneMonthAgo);

    return {
      total: {
        sessions: this.sessions.length,
        completedSessions: this.sessions.filter(s => s.completed).length,
        totalTime: this.calculateTotalTime(this.sessions),
        averageSession: this.calculateAverageSession(this.sessions)
      },
      today: {
        sessions: todaySessions.length,
        completedSessions: todaySessions.filter(s => s.completed).length,
        totalTime: this.calculateTotalTime(todaySessions),
        averageSession: this.calculateAverageSession(todaySessions)
      },
      week: {
        sessions: weekSessions.length,
        completedSessions: weekSessions.filter(s => s.completed).length,
        totalTime: this.calculateTotalTime(weekSessions),
        averageSession: this.calculateAverageSession(weekSessions),
        dailyAverage: this.calculateTotalTime(weekSessions) / 7
      },
      month: {
        sessions: monthSessions.length,
        completedSessions: monthSessions.filter(s => s.completed).length,
        totalTime: this.calculateTotalTime(monthSessions),
        averageSession: this.calculateAverageSession(monthSessions),
        dailyAverage: this.calculateTotalTime(monthSessions) / 30
      },
      streak: this.calculateStreak(),
      bestDay: this.getBestDay(),
      productivity: this.calculateProductivityScore()
    };
  }

  /**
   * Calculate total time from sessions
   */
  calculateTotalTime(sessions) {
    return sessions.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0);
  }

  /**
   * Calculate average session duration
   */
  calculateAverageSession(sessions) {
    if (sessions.length === 0) return 0;
    return this.calculateTotalTime(sessions) / sessions.length;
  }

  /**
   * Calculate current focus streak (consecutive days)
   */
  calculateStreak() {
    if (this.sessions.length === 0) return 0;

    const today = new Date().setHours(0, 0, 0, 0);
    let currentDate = today;
    let streak = 0;

    while (true) {
      const dayStart = currentDate;
      const dayEnd = currentDate + (24 * 60 * 60 * 1000);
      
      const hasFocusSession = this.sessions.some(s => 
        s.completed && s.startTime >= dayStart && s.startTime < dayEnd
      );

      if (hasFocusSession) {
        streak++;
        currentDate -= (24 * 60 * 60 * 1000); // Go back one day
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get the best day (most focus time)
   */
  getBestDay() {
    if (this.sessions.length === 0) return null;

    const dayTotals = {};
    
    this.sessions.forEach(session => {
      if (!session.completed) return;
      
      const day = new Date(session.startTime).toDateString();
      dayTotals[day] = (dayTotals[day] || 0) + session.duration;
    });

    const bestDay = Object.entries(dayTotals)
      .sort((a, b) => b[1] - a[1])[0];

    return bestDay ? {
      date: bestDay[0],
      totalTime: bestDay[1]
    } : null;
  }

  /**
   * Calculate productivity score (0-100)
   */
  calculateProductivityScore() {
    const weekSessions = this.sessions.filter(s => 
      s.startTime >= Date.now() - (7 * 24 * 60 * 60 * 1000)
    );

    if (weekSessions.length === 0) return 0;

    const completionRate = weekSessions.filter(s => s.completed).length / weekSessions.length;
    const totalTime = this.calculateTotalTime(weekSessions);
    const targetTime = 4 * 60 * 60 * 1000; // 4 hours per day * 7 days
    const timeScore = Math.min(totalTime / (targetTime * 7), 1);
    const streakScore = Math.min(this.calculateStreak() / 30, 1); // 30-day streak = max

    return Math.round((completionRate * 40 + timeScore * 40 + streakScore * 20) * 100);
  }

  /**
   * Get sessions for a specific date range
   */
  getSessionsByDateRange(startDate, endDate) {
    return this.sessions.filter(s => 
      s.startTime >= startDate && s.startTime <= endDate
    );
  }

  /**
   * Get daily stats for charting
   */
  getDailyStats(days = 30) {
    const stats = [];
    const now = Date.now();

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i * 24 * 60 * 60 * 1000);
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      const daySessions = this.sessions.filter(s => 
        s.startTime >= dayStart && s.startTime < dayEnd
      );

      stats.push({
        date: new Date(dayStart).toDateString(),
        sessions: daySessions.length,
        completedSessions: daySessions.filter(s => s.completed).length,
        totalTime: this.calculateTotalTime(daySessions)
      });
    }

    return stats;
  }

  /**
   * Clear all sessions
   */
  async clearSessions() {
    try {
      this.sessions = [];
      await chrome.storage.local.set({ focusSessions: [] });
    } catch (error) {
      console.error('Error clearing focus sessions:', error);
    }
  }

  /**
   * Export sessions to JSON
   */
  exportSessions() {
    return JSON.stringify(this.sessions, null, 2);
  }

  /**
   * Import sessions from JSON
   */
  async importSessions(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      if (Array.isArray(imported)) {
        this.sessions = [...this.sessions, ...imported];
        await chrome.storage.local.set({ focusSessions: this.sessions });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing focus sessions:', error);
      return false;
    }
  }
}
