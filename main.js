// Main entry point
import { setAIGradientBorder, updateWelcome, setWelcomeVisibility, applyTheme } from './settings.js';
import { getTimeString, getDateString, updateClock, userLocation } from './clock.js';
import { updateWeather, getWeatherIcon } from './weather.js';
import { setupSearch } from './search.js';
import { setupAIChat } from './ai.js';
import { showModal, hideModal } from './modal.js';
import { getSections, saveSections, defaultSections, renderSections } from './sections.js';
import { getTabGroups, saveTabGroups, renderTabGroups } from './tabGroups.js';


document.addEventListener('DOMContentLoaded', () => {
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
              <option value="long" ${dateFormat==='long'?'selected':''}>Weekday, Month Day, Year</option>
              <option value="short" ${dateFormat==='short'?'selected':''}>MM/DD/YYYY</option>
              <option value="iso" ${dateFormat==='iso'?'selected':''}>YYYY-MM-DD</option>
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
          <button type="submit">Save</button>
          <button type="button">Cancel</button>
        </form>
      `);
      setTimeout(() => {
        const settingsForm = document.getElementById('settings-form');
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
            localStorage.setItem('dashboard-theme', theme);
            localStorage.setItem('dashboard-username', username);
            localStorage.setItem('dashboard-showWelcome', showWelcome);
            localStorage.setItem('dashboard-manualLocation', manualLocation);
            localStorage.setItem('dashboard-timeFormat', timeFormat);
            localStorage.setItem('dashboard-dateFormat', dateFormat);
            localStorage.setItem('dashboard-aiGradient', aiGradient);
            applyTheme(theme);
            updateWelcome(username);
            setWelcomeVisibility(showWelcome);
            setAIGradientBorder(aiGradient);
            if (manualLocation) {
              window.userLocation = manualLocation;
            }
            hideModal();
          });
        }
      }, 0);
    });
  }

  // Add more event listeners and initialization as needed
});

// Daily Quote logic
function fetchDailyQuote() {
  fetch('https://api.quotable.io/random')
    .then(res => res.json())
    .then(data => {
      document.getElementById('quote-text').textContent = `"${data.content}"`;
      document.getElementById('quote-author').textContent = `— ${data.author}`;
    })
    .catch(() => {
      document.getElementById('quote-text').textContent = '"The best way to get started is to quit talking and begin doing."';
      document.getElementById('quote-author').textContent = '— Walt Disney';
    });
}
