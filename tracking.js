// tracking.js - User activity tracking for search and website visits
// This module tracks user searches and website visits to provide better recommendations

export class UserTracker {
  constructor() {
    this.storageKey = 'dashboard-user-tracking';
    this.maxEntries = 100; // Keep only top 100 entries to avoid storage bloat
    this.minVisitsToShow = 2; // Minimum visits to show in frequently visited
  }

  // Get all tracking data
  getTrackingData() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      return JSON.parse(data);
    }
    return {
      searches: {}, // query -> { count, lastSearched, searchEngine }
      websites: {}, // url -> { count, lastVisited, title, icon, domain }
      searchHistory: [], // Recent searches for suggestions
      topSearches: [], // Cached top searches
      topWebsites: [] // Cached top websites
    };
  }

  // Save tracking data
  saveTrackingData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Track a search query
  trackSearch(query, searchEngine = 'google') {
    if (!query || query.trim().length === 0) return;
    
    const data = this.getTrackingData();
    const cleanQuery = query.trim().toLowerCase();
    
    // Update search count and metadata
    if (!data.searches[cleanQuery]) {
      data.searches[cleanQuery] = {
        count: 0,
        lastSearched: null,
        searchEngine: searchEngine,
        originalQuery: query.trim() // Keep original casing
      };
    }
    
    data.searches[cleanQuery].count += 1;
    data.searches[cleanQuery].lastSearched = Date.now();
    data.searches[cleanQuery].searchEngine = searchEngine;
    
    // Add to recent search history (keep last 20)
    data.searchHistory = data.searchHistory.filter(s => s.toLowerCase() !== cleanQuery);
    data.searchHistory.unshift(query.trim());
    data.searchHistory = data.searchHistory.slice(0, 20);
    
    // Update cached top searches
    this.updateTopSearches(data);
    
    // Clean up old entries if needed
    this.cleanupSearchData(data);
    
    this.saveTrackingData(data);
  }

  // Track a website visit
  trackWebsiteVisit(url, title = '', icon = '') {
    if (!url) return;
    
    const data = this.getTrackingData();
    const cleanUrl = this.normalizeUrl(url);
    const domain = this.extractDomain(cleanUrl);
    
    // Update website visit count and metadata
    if (!data.websites[cleanUrl]) {
      data.websites[cleanUrl] = {
        count: 0,
        lastVisited: null,
        title: title || this.extractTitleFromUrl(cleanUrl),
        icon: icon || this.generateFaviconUrl(cleanUrl),
        domain: domain,
        originalUrl: url
      };
    }
    
    data.websites[cleanUrl].count += 1;
    data.websites[cleanUrl].lastVisited = Date.now();
    
    // Update title and icon if provided
    if (title) data.websites[cleanUrl].title = title;
    if (icon) data.websites[cleanUrl].icon = icon;
    
    // Update cached top websites
    this.updateTopWebsites(data);
    
    // Clean up old entries if needed
    this.cleanupWebsiteData(data);
    
    this.saveTrackingData(data);
  }

  // Get recently visited websites
  getRecentlyVisited(limit = 10) {
    const data = this.getTrackingData();
    return Object.values(data.websites)
      .sort((a, b) => b.lastVisited - a.lastVisited)
      .slice(0, limit)
      .map(site => ({
        name: site.title,
        url: site.originalUrl,
        icon: site.icon,
        count: site.count,
        lastVisited: site.lastVisited
      }));
  }

  // Get top searches for suggestions
  getTopSearches(limit = 10) {
    const data = this.getTrackingData();
    return data.topSearches.slice(0, limit);
  }

  // Get frequently visited websites
  getFrequentlyVisited(limit = 10) {
    const data = this.getTrackingData();
    return data.topWebsites
      .filter(site => site.count >= this.minVisitsToShow)
      .slice(0, limit);
  }

  // Get recent search history
  getSearchHistory(limit = 10) {
    const data = this.getTrackingData();
    return data.searchHistory.slice(0, limit);
  }

  // Get search suggestions based on user history
  getSearchSuggestions(query, limit = 5) {
    if (!query || query.length < 2) return [];
    
    const data = this.getTrackingData();
    const lowerQuery = query.toLowerCase();
    
    // Find matching searches from history
    const matches = Object.keys(data.searches)
      .filter(search => search.includes(lowerQuery) && search !== lowerQuery)
      .map(search => ({
        query: data.searches[search].originalQuery,
        count: data.searches[search].count,
        lastSearched: data.searches[search].lastSearched
      }))
      .sort((a, b) => {
        // Sort by relevance (exact start match first, then by frequency)
        const aStartsWithQuery = a.query.toLowerCase().startsWith(lowerQuery);
        const bStartsWithQuery = b.query.toLowerCase().startsWith(lowerQuery);
        
        if (aStartsWithQuery && !bStartsWithQuery) return -1;
        if (!aStartsWithQuery && bStartsWithQuery) return 1;
        
        return b.count - a.count;
      })
      .slice(0, limit)
      .map(item => item.query);
    
    return matches;
  }

  // Get website suggestions based on domain visits
  getWebsiteSuggestions(query, limit = 5) {
    if (!query || query.length < 2) return [];
    
    const data = this.getTrackingData();
    const lowerQuery = query.toLowerCase();
    
    // Find matching websites from history
    const matches = Object.values(data.websites)
      .filter(site => 
        site.title.toLowerCase().includes(lowerQuery) || 
        site.domain.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(site => ({
        name: site.title,
        url: site.originalUrl,
        icon: site.icon,
        visits: site.count
      }));
    
    return matches;
  }

  // Helper methods
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
      return urlObj.href;
    } catch {
      return url;
    }
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  extractTitleFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return url;
    }
  }

  generateFaviconUrl(url) {
    try {
      const domain = this.extractDomain(url);
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return 'https://www.google.com/s2/favicons?domain=example.com&sz=32';
    }
  }

  updateTopSearches(data) {
    data.topSearches = Object.entries(data.searches)
      .map(([query, info]) => ({
        query: info.originalQuery,
        count: info.count,
        lastSearched: info.lastSearched,
        searchEngine: info.searchEngine
      }))
      .sort((a, b) => {
        // Sort by recency-weighted frequency
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        
        const aRecency = Math.max(0, 1 - (now - a.lastSearched) / (7 * dayMs)); // 7 day decay
        const bRecency = Math.max(0, 1 - (now - b.lastSearched) / (7 * dayMs));
        
        const aScore = a.count * (1 + aRecency);
        const bScore = b.count * (1 + bRecency);
        
        return bScore - aScore;
      });
  }

  updateTopWebsites(data) {
    data.topWebsites = Object.values(data.websites)
      .sort((a, b) => {
        // Sort by recency-weighted frequency
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        
        const aRecency = Math.max(0, 1 - (now - a.lastVisited) / (7 * dayMs)); // 7 day decay
        const bRecency = Math.max(0, 1 - (now - b.lastVisited) / (7 * dayMs));
        
        const aScore = a.count * (1 + aRecency);
        const bScore = b.count * (1 + bRecency);
        
        return bScore - aScore;
      });
  }

  cleanupSearchData(data) {
    // Keep only top searches to prevent storage bloat
    if (Object.keys(data.searches).length > this.maxEntries) {
      const sortedSearches = Object.entries(data.searches)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, this.maxEntries);
      
      data.searches = Object.fromEntries(sortedSearches);
    }
  }

  cleanupWebsiteData(data) {
    // Keep only top websites to prevent storage bloat
    if (Object.keys(data.websites).length > this.maxEntries) {
      const sortedWebsites = Object.entries(data.websites)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, this.maxEntries);
      
      data.websites = Object.fromEntries(sortedWebsites);
    }
  }

  // Clear all tracking data
  clearAllData() {
    localStorage.removeItem(this.storageKey);
  }

  // Export data for backup
  exportData() {
    return this.getTrackingData();
  }

  // Import data from backup
  importData(data) {
    this.saveTrackingData(data);
  }

  // Get usage statistics
  getStatistics() {
    const data = this.getTrackingData();
    return {
      totalUniqueSearches: Object.keys(data.searches).length,
      totalSearches: Object.values(data.searches).reduce((sum, s) => sum + s.count, 0),
      totalUniqueWebsites: Object.keys(data.websites).length,
      totalVisits: Object.values(data.websites).reduce((sum, w) => sum + w.count, 0),
      mostSearchedQuery: this.getMostSearched(),
      mostVisitedWebsite: this.getMostVisited()
    };
  }

  // Get most searched query
  getMostSearched() {
    const data = this.getTrackingData();
    const searches = Object.values(data.searches);
    if (searches.length === 0) return null;
    
    return searches.reduce((max, current) => 
      current.count > max.count ? current : max
    );
  }

  // Get most visited website
  getMostVisited() {
    const data = this.getTrackingData();
    const websites = Object.values(data.websites);
    if (websites.length === 0) return null;
    
    return websites.reduce((max, current) => 
      current.count > max.count ? current : max
    );
  }
}

// Create global instance
export const userTracker = new UserTracker();
