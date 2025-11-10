// Developer Tools Module
// Provides developer-friendly features for the dashboard

import { showModal, hideModal } from './modal.js';

// Simple notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.background = type === 'error' ? '#ff6b6b' : '#6bcf7f';
  notification.style.color = 'white';
  notification.style.padding = '12px 16px';
  notification.style.borderRadius = '6px';
  notification.style.zIndex = '10000';
  notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  notification.style.fontSize = '14px';
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

export function setupDevTools() {
  // Add developer tools section to settings
  addDevToolsToSettings();

  // Add keyboard shortcuts for developer features
  setupDevShortcuts();

  // Initialize developer tools if enabled
  if (localStorage.getItem('dashboard-devMode') === 'true') {
    initializeDevTools();
  }
}

function addDevToolsToSettings() {
  // This will be called when settings modal is opened
  const originalSettingsBtn = document.getElementById('settings-btn');
  if (originalSettingsBtn) {
    originalSettingsBtn.addEventListener('click', () => {
      setTimeout(() => {
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
          // Add developer tools section
          const devSection = document.createElement('div');
          devSection.innerHTML = `
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid #353945;">
              <h3 style="margin-bottom:12px;font-size:1.1em;">Developer Tools</h3>
              <label style="display:block;margin-bottom:12px;">
                <input type="checkbox" name="devMode" ${localStorage.getItem('dashboard-devMode') === 'true' ? 'checked' : ''}>
                Enable Developer Mode
              </label>
              <label style="display:block;margin-bottom:12px;">
                <input type="checkbox" name="devConsole" ${localStorage.getItem('dashboard-devConsole') === 'true' ? 'checked' : ''}>
                Show Console Output
              </label>
              <label style="display:block;margin-bottom:12px;">
                <input type="checkbox" name="devNetwork" ${localStorage.getItem('dashboard-devNetwork') === 'true' ? 'checked' : ''}>
                Network Request Monitor
              </label>
              <label style="display:block;margin-bottom:12px;">
                <input type="checkbox" name="devPerformance" ${localStorage.getItem('dashboard-devPerformance') === 'true' ? 'checked' : ''}>
                Performance Metrics
              </label>
              <div style="display:flex;gap:8px;margin-bottom:12px;">
                <button type="button" id="dev-inspect-storage">Inspect Storage</button>
                <button type="button" id="dev-clear-cache">Clear Cache</button>
                <button type="button" id="dev-export-logs">Export Logs</button>
                <button type="button" id="dev-code-snippets">Code Snippets</button>
                <button type="button" id="dev-api-tester">API Tester</button>
              </div>
            </div>
          `;
          settingsForm.appendChild(devSection);

          // Add event listeners for dev tools
          setTimeout(() => {
            // Checkbox event listeners
            const devModeCheckbox = settingsForm.querySelector('input[name="devMode"]');
            const devConsoleCheckbox = settingsForm.querySelector('input[name="devConsole"]');
            const devNetworkCheckbox = settingsForm.querySelector('input[name="devNetwork"]');
            const devPerformanceCheckbox = settingsForm.querySelector('input[name="devPerformance"]');

            devModeCheckbox?.addEventListener('change', (e) => {
              localStorage.setItem('dashboard-devMode', e.target.checked);
              if (e.target.checked) {
                initializeDevTools();
              } else {
                // Remove dev indicator if exists
                const indicator = document.getElementById('dev-indicator');
                if (indicator) indicator.remove();
              }
              showNotification(`Developer mode ${e.target.checked ? 'enabled' : 'disabled'}`);
            });

            devConsoleCheckbox?.addEventListener('change', (e) => {
              localStorage.setItem('dashboard-devConsole', e.target.checked);
              if (e.target.checked) {
                setupConsoleMonitoring();
              }
            });

            devNetworkCheckbox?.addEventListener('change', (e) => {
              localStorage.setItem('dashboard-devNetwork', e.target.checked);
            });

            devPerformanceCheckbox?.addEventListener('change', (e) => {
              localStorage.setItem('dashboard-devPerformance', e.target.checked);
            });

            // Button event listeners
            document.getElementById('dev-inspect-storage')?.addEventListener('click', inspectStorage);
            document.getElementById('dev-clear-cache')?.addEventListener('click', clearCache);
            document.getElementById('dev-export-logs')?.addEventListener('click', exportLogs);
            document.getElementById('dev-code-snippets')?.addEventListener('click', showCodeSnippets);
            document.getElementById('dev-api-tester')?.addEventListener('click', showApiTester);
          }, 100);
        }
      }, 100);
    });
  }
}

function setupDevShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D: Toggle developer mode
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      toggleDevMode();
    }

    // Ctrl+Shift+C: Open console
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      showDevConsole();
    }

    // Ctrl+Shift+P: Show performance metrics
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      showPerformanceMetrics();
    }
  });
}

function initializeDevTools() {
  // Add developer indicator
  addDevIndicator();

  // Initialize console monitoring
  if (localStorage.getItem('dashboard-devConsole') === 'true') {
    setupConsoleMonitoring();
  }

  // Initialize network monitoring
  if (localStorage.getItem('dashboard-devNetwork') === 'true') {
    setupNetworkMonitoring();
  }

  // Initialize performance monitoring
  if (localStorage.getItem('dashboard-devPerformance') === 'true') {
    setupPerformanceMonitoring();
  }
}

function addDevIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'dev-indicator';
  indicator.textContent = 'DEV';
  indicator.style.position = 'fixed';
  indicator.style.top = '10px';
  indicator.style.right = '10px';
  indicator.style.background = '#ff6b35';
  indicator.style.color = 'white';
  indicator.style.padding = '4px 8px';
  indicator.style.borderRadius = '4px';
  indicator.style.fontSize = '12px';
  indicator.style.fontWeight = 'bold';
  indicator.style.zIndex = '10000';
  indicator.style.cursor = 'pointer';
  indicator.title = 'Developer Mode Active - Click to toggle';

  indicator.addEventListener('click', toggleDevMode);
  document.body.appendChild(indicator);
}

function toggleDevMode() {
  const currentMode = localStorage.getItem('dashboard-devMode') === 'true';
  const newMode = !currentMode;

  localStorage.setItem('dashboard-devMode', newMode);

  if (newMode) {
    initializeDevTools();
  } else {
    // Remove dev indicator and tools
    const indicator = document.getElementById('dev-indicator');
    if (indicator) indicator.remove();

    const consolePanel = document.getElementById('dev-console-panel');
    if (consolePanel) consolePanel.remove();

    const perfPanel = document.getElementById('dev-performance-panel');
    if (perfPanel) perfPanel.remove();
  }

  // Show notification
  showNotification(`Developer mode ${newMode ? 'enabled' : 'disabled'}`);
}

function setupConsoleMonitoring() {
  // Override console methods to capture output
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = function(...args) {
    logToDevConsole('log', ...args);
    originalLog.apply(console, args);
  };

  console.error = function(...args) {
    logToDevConsole('error', ...args);
    originalError.apply(console, args);
  };

  console.warn = function(...args) {
    logToDevConsole('warn', ...args);
    originalWarn.apply(console, args);
  };
}

function setupNetworkMonitoring() {
  // Monitor fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const startTime = Date.now();
    const url = args[0];

    return originalFetch.apply(this, args)
      .then(response => {
        const duration = Date.now() - startTime;
        logNetworkRequest(url, response.status, duration);
        return response;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        logNetworkRequest(url, 'ERROR', duration, error);
        throw error;
      });
  };
}

function setupPerformanceMonitoring() {
  // Monitor page performance
  if ('performance' in window) {
    setInterval(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        updatePerformanceMetrics(perfData);
      }
    }, 5000);
  }
}

function logToDevConsole(type, ...args) {
  // Store logs for dev console
  const logs = JSON.parse(localStorage.getItem('dev-logs') || '[]');
  logs.push({
    timestamp: new Date().toISOString(),
    type,
    message: args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
  });

  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.shift();
  }

  localStorage.setItem('dev-logs', JSON.stringify(logs));
}

function logNetworkRequest(url, status, duration, error = null) {
  const requests = JSON.parse(localStorage.getItem('dev-network') || '[]');
  requests.push({
    timestamp: new Date().toISOString(),
    url: String(url),
    status,
    duration,
    error: error ? String(error) : null
  });

  // Keep only last 50 requests
  if (requests.length > 50) {
    requests.shift();
  }

  localStorage.setItem('dev-network', JSON.stringify(requests));
}

function updatePerformanceMetrics(perfData) {
  const metrics = {
    timestamp: new Date().toISOString(),
    loadTime: perfData.loadEventEnd - perfData.loadEventStart,
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
    firstPaint: perfData.responseEnd - perfData.requestStart
  };

  localStorage.setItem('dev-performance', JSON.stringify(metrics));
}

function showDevConsole() {
  let consolePanel = document.getElementById('dev-console-panel');
  if (consolePanel) {
    consolePanel.style.display = consolePanel.style.display === 'none' ? 'block' : 'none';
    return;
  }

  consolePanel = document.createElement('div');
  consolePanel.id = 'dev-console-panel';
  consolePanel.style.position = 'fixed';
  consolePanel.style.bottom = '10px';
  consolePanel.style.right = '10px';
  consolePanel.style.width = '400px';
  consolePanel.style.height = '300px';
  consolePanel.style.background = '#1a1d24';
  consolePanel.style.border = '1px solid #353945';
  consolePanel.style.borderRadius = '8px';
  consolePanel.style.zIndex = '10001';
  consolePanel.style.display = 'flex';
  consolePanel.style.flexDirection = 'column';
  consolePanel.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';

  consolePanel.innerHTML = `
    <div style="padding: 8px; background: #23262f; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: bold; color: #eaeaea;">Developer Console</span>
      <div>
        <button id="dev-console-clear" style="background: none; border: none; color: #888; cursor: pointer; font-size: 14px; margin-right: 8px;">Clear</button>
        <button id="dev-console-close" style="background: none; border: none; color: #888; cursor: pointer; font-size: 18px;">×</button>
      </div>
    </div>
    <div id="dev-console-content" style="flex: 1; padding: 8px; overflow-y: auto; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 12px; color: #eaeaea; background: #0f1117;">
      Loading logs...
    </div>
    <div style="padding: 8px; background: #23262f; border-radius: 0 0 8px 8px; border-top: 1px solid #353945;">
      <input id="dev-console-input" type="text" placeholder="Enter JavaScript to execute..." style="width: 100%; padding: 6px; background: #1a1d24; border: 1px solid #353945; border-radius: 4px; color: #eaeaea; font-family: inherit; font-size: 12px;">
    </div>
  `;

  document.body.appendChild(consolePanel);

  // Load and display logs
  loadConsoleLogs();

  // Event listeners
  document.getElementById('dev-console-close').addEventListener('click', () => {
    consolePanel.style.display = 'none';
  });

  document.getElementById('dev-console-clear').addEventListener('click', () => {
    localStorage.removeItem('dev-logs');
    document.getElementById('dev-console-content').innerHTML = 'Logs cleared';
  });

  // JavaScript execution
  const input = document.getElementById('dev-console-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const code = input.value.trim();
      if (code) {
        try {
          const result = eval(code);
          logToDevConsole('result', `> ${code}`, result);
          input.value = '';
          loadConsoleLogs();
        } catch (error) {
          logToDevConsole('error', `> ${code}`, error.message);
          loadConsoleLogs();
        }
      }
    }
  });
}

function loadConsoleLogs() {
  const logs = JSON.parse(localStorage.getItem('dev-logs') || '[]');
  const content = document.getElementById('dev-console-content');

  if (logs.length === 0) {
    content.textContent = 'No logs available';
    return;
  }

  content.innerHTML = logs.map(log => `
    <div style="margin-bottom: 4px; padding: 4px; background: ${getLogColor(log.type)}; border-radius: 4px;">
      <span style="color: #888; font-size: 10px;">${new Date(log.timestamp).toLocaleTimeString()}</span>
      <span style="color: ${getLogTextColor(log.type)}; font-weight: bold;">[${log.type.toUpperCase()}]</span>
      <span>${log.message}</span>
    </div>
  `).join('');
}

function getLogColor(type) {
  switch (type) {
    case 'error': return '#2d1b1b';
    case 'warn': return '#2d2d1b';
    default: return '#1b2d1b';
  }
}

function getLogTextColor(type) {
  switch (type) {
    case 'error': return '#ff6b6b';
    case 'warn': return '#ffd93d';
    default: return '#6bcf7f';
  }
}

function showPerformanceMetrics() {
  const metrics = JSON.parse(localStorage.getItem('dev-performance') || '{}');

  showModal(`
    <h3>Performance Metrics</h3>
    <div style="font-family: monospace; font-size: 14px;">
      <div>Load Time: ${metrics.loadTime || 'N/A'}ms</div>
      <div>DOM Content Loaded: ${metrics.domContentLoaded || 'N/A'}ms</div>
      <div>First Paint: ${metrics.firstPaint || 'N/A'}ms</div>
      <div>Memory Usage: ${performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'N/A'}</div>
    </div>
  `);
}

function inspectStorage() {
  const data = {
    localStorage: { ...localStorage },
    sessionStorage: { ...sessionStorage }
  };

  showModal(`
    <h3>Storage Inspector</h3>
    <pre style="background: #1a1d24; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px; max-height: 400px; overflow-y: auto;">${JSON.stringify(data, null, 2)}</pre>
  `);
}

function clearCache() {
  // Clear various caches
  localStorage.removeItem('dashboard-quote');
  localStorage.removeItem('dashboard-quote-date');
  localStorage.removeItem('dev-logs');
  localStorage.removeItem('dev-network');

  showNotification('Cache cleared successfully');
}

function exportLogs() {
  const logs = JSON.parse(localStorage.getItem('dev-logs') || '[]');
  const network = JSON.parse(localStorage.getItem('dev-network') || '[]');

  const data = {
    timestamp: new Date().toISOString(),
    consoleLogs: logs,
    networkRequests: network
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `dev-logs-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification('Logs exported successfully');
}

function showApiTester() {
  showModal(`
    <h3>API Tester</h3>
    <div style="margin-bottom: 16px;">
      <select id="api-method" style="padding: 8px; background: #1a1d24; border: 1px solid #353945; border-radius: 4px; color: #eaeaea; margin-right: 8px;">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="PATCH">PATCH</option>
      </select>
      <input id="api-url" type="text" placeholder="Enter API URL..." style="flex: 1; padding: 8px; background: #1a1d24; border: 1px solid #353945; border-radius: 4px; color: #eaeaea; margin-right: 8px;">
      <button id="send-api-request" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Send</button>
    </div>
    <div style="margin-bottom: 12px;">
      <label style="display: block; margin-bottom: 4px; color: #eaeaea;">Headers (JSON):</label>
      <textarea id="api-headers" rows="3" placeholder='{"Content-Type": "application/json"}' style="width: 100%; padding: 8px; background: #1a1d24; border: 1px solid #353945; border-radius: 4px; color: #eaeaea; font-family: 'JetBrains Mono', monospace; font-size: 12px;"></textarea>
    </div>
    <div style="margin-bottom: 12px;">
      <label style="display: block; margin-bottom: 4px; color: #eaeaea;">Body (JSON):</label>
      <textarea id="api-body" rows="5" placeholder='{"key": "value"}' style="width: 100%; padding: 8px; background: #1a1d24; border: 1px solid #353945; border-radius: 4px; color: #eaeaea; font-family: 'JetBrains Mono', monospace; font-size: 12px;"></textarea>
    </div>
    <div id="api-response" style="background: #1a1d24; padding: 12px; border-radius: 6px; border: 1px solid #353945; max-height: 300px; overflow-y: auto; display: none;">
      <h4 style="margin: 0 0 8px 0; color: #eaeaea;">Response</h4>
      <div id="api-response-status" style="font-weight: bold; margin-bottom: 8px;"></div>
      <div id="api-response-headers" style="font-size: 12px; color: #888; margin-bottom: 8px;"></div>
      <pre id="api-response-body" style="background: #0f1117; padding: 8px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #b8c5d6; overflow-x: auto; margin: 0;"></pre>
    </div>
  `);

  setTimeout(() => {
    document.getElementById('send-api-request')?.addEventListener('click', async () => {
      const method = document.getElementById('api-method').value;
      const url = document.getElementById('api-url').value.trim();
      const headersText = document.getElementById('api-headers').value.trim();
      const bodyText = document.getElementById('api-body').value.trim();

      if (!url) {
        showNotification('Please enter a URL');
        return;
      }

      try {
        const options = { method };

        // Parse headers
        if (headersText) {
          try {
            options.headers = JSON.parse(headersText);
          } catch (e) {
            showNotification('Invalid JSON in headers');
            return;
          }
        }

        // Add body for non-GET requests
        if (bodyText && method !== 'GET') {
          try {
            options.body = JSON.parse(bodyText);
          } catch (e) {
            options.body = bodyText; // Send as plain text if not valid JSON
          }
        }

        const startTime = Date.now();
        const response = await fetch(url, options);
        const duration = Date.now() - startTime;

        const responseText = await response.text();
        let responseBody;
        try {
          responseBody = JSON.parse(responseText);
        } catch {
          responseBody = responseText;
        }

        // Display response
        document.getElementById('api-response').style.display = 'block';
        document.getElementById('api-response-status').innerHTML = `
          <span style="color: ${response.ok ? '#6bcf7f' : '#ff6b6b'};">${response.status} ${response.statusText}</span>
          <span style="color: #888; margin-left: 8px;">${duration}ms</span>
        `;

        // Display headers
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        document.getElementById('api-response-headers').textContent = JSON.stringify(headers, null, 2);

        // Display body
        document.getElementById('api-response-body').textContent = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2);

        // Log to dev console
        logToDevConsole('api', `${method} ${url}`, { status: response.status, duration, body: responseBody });

      } catch (error) {
        document.getElementById('api-response').style.display = 'block';
        document.getElementById('api-response-status').innerHTML = '<span style="color: #ff6b6b;">ERROR</span>';
        document.getElementById('api-response-body').textContent = error.message;
        logToDevConsole('error', `API Request failed: ${method} ${url}`, error.message);
      }
    });
  }, 100);
}

function showCodeSnippets() {
  const snippets = JSON.parse(localStorage.getItem('dev-code-snippets') || '[]');

  showModal(`
    <h3>Code Snippets Manager</h3>
    <div style="margin-bottom: 16px;">
      <button id="add-snippet-btn" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Add Snippet</button>
    </div>
    <div id="snippets-list" style="max-height: 300px; overflow-y: auto;">
      ${snippets.length === 0 ? '<p>No snippets saved yet.</p>' : snippets.map((snippet, index) => `
        <div style="background: #1a1d24; padding: 12px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #353945;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #eaeaea;">${snippet.title}</strong>
            <div>
              <button onclick="copySnippet(${index})" style="background: #6bcf7f; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-right: 4px;">Copy</button>
              <button onclick="deleteSnippet(${index})" style="background: #ff6b6b; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Delete</button>
            </div>
          </div>
          <div style="background: #0f1117; padding: 8px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #b8c5d6; overflow-x: auto;">
            ${snippet.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
          ${snippet.description ? `<div style="margin-top: 8px; font-size: 12px; color: #888;">${snippet.description}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `);

  // Add snippet functionality
  setTimeout(() => {
    document.getElementById('add-snippet-btn')?.addEventListener('click', () => {
      showModal(`
        <h3>Add Code Snippet</h3>
        <form id="snippet-form">
          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; color: #eaeaea;">Title:</label>
            <input type="text" name="title" required style="width: 100%; padding: 8px; background: #1a1d24; border: 1px solid #353945; border-radius: 4px; color: #eaeaea;">
          </div>
          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; color: #eaeaea;">Description:</label>
            <input type="text" name="description" style="width: 100%; padding: 8px; background: #1a1d24; border: 1px solid #353945; border-radius: 4px; color: #eaeaea;">
          </div>
          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; color: #eaeaea;">Language:</label>
            <select name="language" style="width: 100%; padding: 8px; background: #1a1d24; border: 1px solid #353945; border-radius: 4px; color: #eaeaea;">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
              <option value="bash">Bash</option>
            </select>
          </div>
          <div style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; color: #eaeaea;">Code:</label>
            <textarea name="code" required rows="8" style="width: 100%; padding: 8px; background: #1a1d24; border: 1px solid #353945; border-radius: 4px; color: #eaeaea; font-family: 'JetBrains Mono', monospace; font-size: 12px;"></textarea>
          </div>
          <button type="submit" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Save Snippet</button>
          <button type="button" onclick="hideModal()" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 8px;">Cancel</button>
        </form>
      `);

      setTimeout(() => {
        document.getElementById('snippet-form')?.addEventListener('submit', function(e) {
          e.preventDefault();
          const formData = new FormData(this);
          const snippet = {
            title: formData.get('title'),
            description: formData.get('description'),
            language: formData.get('language'),
            code: formData.get('code'),
            created: new Date().toISOString()
          };

          const snippets = JSON.parse(localStorage.getItem('dev-code-snippets') || '[]');
          snippets.push(snippet);
          localStorage.setItem('dev-code-snippets', JSON.stringify(snippets));

          hideModal();
          showCodeSnippets();
          showNotification('Snippet saved successfully!');
        });
      }, 100);
    });
  }, 100);
}

// Global functions for snippet management
window.copySnippet = function(index) {
  const snippets = JSON.parse(localStorage.getItem('dev-code-snippets') || '[]');
  if (snippets[index]) {
    navigator.clipboard.writeText(snippets[index].code).then(() => {
      showNotification('Snippet copied to clipboard!');
    });
  }
};

window.deleteSnippet = function(index) {
  const snippets = JSON.parse(localStorage.getItem('dev-code-snippets') || '[]');
  snippets.splice(index, 1);
  localStorage.setItem('dev-code-snippets', JSON.stringify(snippets));
  showCodeSnippets();
  showNotification('Snippet deleted!');
};
