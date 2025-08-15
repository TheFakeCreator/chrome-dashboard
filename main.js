// Main entry point
import { setAIGradientBorder, updateWelcome, setWelcomeVisibility, applyTheme, applyCustomBackground } from './settings.js';
import { getTimeString, getDateString, updateClock, userLocation } from './clock.js';
import { updateWeather, getWeatherIcon } from './weather.js';
import { setupSearch } from './search.js';
import { setupAIChat } from './ai.js';
import { showModal, hideModal } from './modal.js';
import { getSections, saveSections, defaultSections, renderSections } from './sections.js';
import { getTabGroups, saveTabGroups, renderTabGroups } from './tabGroups.js';
import { userTracker } from './tracking.js';


document.addEventListener('DOMContentLoaded', () => {
  // Loading screen logic
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.transform = 'translateY(-100vh)';
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 800);
    }, 900); // Simulate quick load, adjust as needed
  }
  // Theme, welcome, AI border
  applyTheme(localStorage.getItem('dashboard-theme') || 'dark');
  updateWelcome(localStorage.getItem('dashboard-username') || 'Sanskar');
  setWelcomeVisibility(localStorage.getItem('dashboard-showWelcome') !== 'false');
  setAIGradientBorder(localStorage.getItem('dashboard-aiGradient') !== 'false');

  // Clock and weather
  setInterval(updateClock, 1000);
  updateClock();
  updateWeather();

  // Daily Quote
  fetchDailyQuote();

  // Search and AI chat
  setupSearch();
  setupAIChat();

  // Modal overlay click
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', hideModal);
  }

  // Hide modal and overlay on load
  const modal = document.getElementById('modal');
  if (modal) modal.classList.add('hidden');
  if (modalOverlay) modalOverlay.classList.add('hidden');

  // Keyboard shortcut to focus search input: / or Ctrl+K
  document.addEventListener('keydown', function(e) {
    // Focus search on "/" (ignore if typing in input/textarea)
    if (e.key === '/' && !e.ctrlKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.focus();
    }
    // Focus search on Ctrl+K
    if (e.key.toLowerCase() === 'k' && e.ctrlKey) {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.focus();
    }
  });

  // Sections rendering
  renderSections();
  // Tab groups rendering
  renderTabGroups();

  // Settings button logic
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      const currentName = localStorage.getItem('dashboard-username') || 'Sanskar';
      const currentTheme = localStorage.getItem('dashboard-theme') || 'dark';
      const showWelcome = localStorage.getItem('dashboard-showWelcome') !== 'false';
      const manualLocation = localStorage.getItem('dashboard-manualLocation') || '';
      const timeFormat = localStorage.getItem('dashboard-timeFormat') || '24';
      const dateFormat = localStorage.getItem('dashboard-dateFormat') || 'long';
      const trackingEnabled = localStorage.getItem('dashboard-tracking') !== 'false';
      const showVisitCounts = localStorage.getItem('dashboard-showVisitCounts') !== 'false';
      
      // Get tracking statistics
      const trackingData = userTracker.getTrackingData();
      const totalSearches = Object.values(trackingData.searches).reduce((sum, search) => sum + search.count, 0);
      const totalWebsites = Object.keys(trackingData.websites).length;
      const totalVisits = Object.values(trackingData.websites).reduce((sum, site) => sum + site.count, 0);
      showModal(`
        <h2>Extension Settings</h2>
        <form id="settings-form">
          <label style="display:block;margin-bottom:12px;">Username:
            <input type="text" name="username" value="${currentName}" style="margin-left:8px;padding:4px 8px;border-radius:6px;border:none;background:#23262f;color:#eaeaea;">
          </label>
          <label style="display:block;margin-bottom:12px;">Theme:
            <select name="theme">
              <option value="dark" ${currentTheme==='dark'?'selected':''}>Dark</option>
              <option value="light" ${currentTheme==='light'?'selected':''}>Light</option>
            </select>
          </label>
          <label style="display:block;margin-bottom:12px;">Location Override:
            <input type="text" name="manualLocation" value="${manualLocation}" placeholder="City, Country or leave blank" style="margin-left:8px;padding:4px 8px;border-radius:6px;border:none;background:#23262f;color:#eaeaea;">
            <span style="font-size:12px;color:#888;margin-left:8px;">(Overrides detected location)</span>
          </label>
          <label style="display:block;margin-bottom:12px;">Time Format:
            <select name="timeFormat">
              <option value="24" ${timeFormat==='24'?'selected':''}>24-hour</option>
              <option value="12" ${timeFormat==='12'?'selected':''}>12-hour (AM/PM)</option>
            </select>
          </label>
          <label style="display:block;margin-bottom:12px;">Date Format:
            <select name="dateFormat">
              <option value="long" ${dateFormat==='long'?'selected':''}>Weekday, Month Day</option>
              <option value="short" ${dateFormat==='short'?'selected':''}>Weekday, Mon Day</option>
              <option value="iso" ${dateFormat==='iso'?'selected':''}>MM-DD</option>
            </select>
          </label>
          <label style="display:block;margin-bottom:12px;">
            <input type="checkbox" name="showWelcome" ${showWelcome ? 'checked' : ''}>
            Show welcome text
          </label>
          <label style="display:block;margin-bottom:12px;">
            <input type="checkbox" name="aiGradient" ${localStorage.getItem('dashboard-aiGradient') !== 'false' ? 'checked' : ''}>
            Enable AI gradient border
          </label>
          <label style="display:block;margin-bottom:12px;">
            <input type="checkbox" name="trackingEnabled" ${trackingEnabled ? 'checked' : ''}>
            Enable search and website tracking
          </label>
          <label style="display:block;margin-bottom:12px;">
            <input type="checkbox" name="showVisitCounts" ${showVisitCounts ? 'checked' : ''}>
            Show visit counts on cards
          </label>
          <label style="display:block;margin-bottom:12px;">Custom Background Image:
            <input type="file" id="bg-image-input" accept="image/*" style="margin-left:8px;">
            <button type="button" id="clear-bg-btn" style="margin-left:8px;">Clear</button>
            <span id="bg-image-status" style="font-size:12px;color:#888;margin-left:8px;"></span>
            <br>
            <input type="text" id="bg-image-url" placeholder="Paste image URL here" style="margin-top:8px;width:70%;padding:4px 8px;border-radius:6px;border:none;background:#23262f;color:#eaeaea;">
            <button type="button" id="set-bg-url-btn" style="margin-left:8px;">Set URL</button>
          </label>
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #353945;">
            <h3 style="margin-bottom:12px;font-size:1.1em;">Usage Statistics</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;font-size:0.9em;">
              <div style="background:#1a1d24;padding:8px 12px;border-radius:6px;">
                <div style="color:#888;">Total Searches</div>
                <div style="font-size:1.2em;font-weight:600;color:#3b82f6;">${totalSearches}</div>
              </div>
              <div style="background:#1a1d24;padding:8px 12px;border-radius:6px;">
                <div style="color:#888;">Unique Websites</div>
                <div style="font-size:1.2em;font-weight:600;color:#10b981;">${totalWebsites}</div>
              </div>
              <div style="background:#1a1d24;padding:8px 12px;border-radius:6px;">
                <div style="color:#888;">Total Visits</div>
                <div style="font-size:1.2em;font-weight:600;color:#f59e0b;">${totalVisits}</div>
              </div>
              <div style="background:#1a1d24;padding:8px 12px;border-radius:6px;">
                <div style="color:#888;">Search History</div>
                <div style="font-size:1.2em;font-weight:600;color:#8b5cf6;">${trackingData.searchHistory.length}</div>
              </div>
            </div>
            <h3 style="margin-bottom:12px;font-size:1.1em;">Data Management</h3>
            <div id="tracking-stats" style="margin-bottom:12px;font-size:0.9em;color:#888;"></div>
            <button type="button" id="export-data-btn" style="margin-right:8px;">Export Tracking Data</button>
            <button type="button" id="clear-tracking-btn" style="background:#ef4444;">Clear All Tracking Data</button>
          </div>
          <button type="submit">Save</button>
          <button type="button">Cancel</button>
        </form>
      `);
      setTimeout(() => {
        const settingsForm = document.getElementById('settings-form');
        
        // Show tracking statistics
        const trackingStats = document.getElementById('tracking-stats');
        if (trackingStats) {
          const stats = userTracker.getStatistics();
          trackingStats.innerHTML = `
            <div>📊 Tracked: ${stats.totalUniqueSearches} unique searches (${stats.totalSearches} total), ${stats.totalUniqueWebsites} websites (${stats.totalVisits} visits)</div>
          `;
        }
        
        if (settingsForm) {
          settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const theme = this.theme.value;
            const username = this.username.value.trim() || 'Sanskar';
            const showWelcome = this.showWelcome.checked;
            const manualLocation = this.manualLocation.value.trim();
            const timeFormat = this.timeFormat.value;
            const dateFormat = this.dateFormat.value;
            const aiGradient = this.aiGradient.checked;
            const trackingEnabled = this.trackingEnabled.checked;
            const showVisitCounts = this.showVisitCounts.checked;
            localStorage.setItem('dashboard-theme', theme);
            localStorage.setItem('dashboard-username', username);
            localStorage.setItem('dashboard-showWelcome', showWelcome);
            localStorage.setItem('dashboard-manualLocation', manualLocation);
            localStorage.setItem('dashboard-timeFormat', timeFormat);
            localStorage.setItem('dashboard-dateFormat', dateFormat);
            localStorage.setItem('dashboard-aiGradient', aiGradient);
            localStorage.setItem('dashboard-tracking', trackingEnabled);
            localStorage.setItem('dashboard-showVisitCounts', showVisitCounts);
            applyCustomBackground();
            applyTheme(theme);
            updateWelcome(username);
            setWelcomeVisibility(showWelcome);
            setAIGradientBorder(aiGradient);
            if (manualLocation) {
              window.userLocation = manualLocation;
            }
            // Re-render sections to reflect tracking changes
            renderSections();
            hideModal();
          });

          // Custom background image logic
          const bgInput = document.getElementById('bg-image-input');
          const bgStatus = document.getElementById('bg-image-status');
          const clearBgBtn = document.getElementById('clear-bg-btn');
          const bgUrlInput = document.getElementById('bg-image-url');
          const setBgUrlBtn = document.getElementById('set-bg-url-btn');
          // Show status if already set
          if (localStorage.getItem('dashboard-bgImage')) {
            bgStatus.textContent = 'Custom background set.';
          }
          bgInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = function(e) {
                localStorage.setItem('dashboard-bgImage', e.target.result);
                applyCustomBackground();
                bgStatus.textContent = 'Custom background set.';
              };
              reader.readAsDataURL(file);
            }
          });
          setBgUrlBtn.addEventListener('click', function() {
            const url = bgUrlInput.value.trim();
            if (url) {
              localStorage.setItem('dashboard-bgImage', url);
              applyCustomBackground();
              bgStatus.textContent = 'Custom background set.';
            }
          });
          clearBgBtn.addEventListener('click', function() {
            localStorage.removeItem('dashboard-bgImage');
            applyCustomBackground();
            bgStatus.textContent = 'Custom background cleared.';
            bgUrlInput.value = '';
          });
        }
      }, 0);
    });
  }

  // Add more event listeners and initialization as needed
  applyCustomBackground();
});

// Daily Quote logic
function fetchDailyQuote() {
  const today = new Date().toISOString().slice(0, 10);
  const cachedQuote = localStorage.getItem('dashboard-quote');
  const cachedDate = localStorage.getItem('dashboard-quote-date');
  // If cached date is not today, clear cache so a new quote is fetched
  if (cachedDate !== today) {
    localStorage.removeItem('dashboard-quote');
    localStorage.setItem('dashboard-quote-date', today);
  }
  const freshQuote = localStorage.getItem('dashboard-quote');
  if (freshQuote && localStorage.getItem('dashboard-quote-date') === today) {
    try {
      const data = JSON.parse(freshQuote);
      document.getElementById('quote-text').textContent = `"${data.content}"`;
      document.getElementById('quote-author').textContent = `— ${data.author}`;
      return;
    } catch {}
  }
  fetch('https://api.quotable.io/random')
    .then(res => res.json())
    .then(data => {
      document.getElementById('quote-text').textContent = `"${data.content}"`;
      document.getElementById('quote-author').textContent = `— ${data.author}`;
      localStorage.setItem('dashboard-quote', JSON.stringify(data));
      localStorage.setItem('dashboard-quote-date', today);
    })
    .catch(() => {
      document.getElementById('quote-text').textContent = '"The best way to get started is to quit talking and begin doing."';
      document.getElementById('quote-author').textContent = '— Walt Disney';
    });
}

