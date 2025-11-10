/**
 * @file background.js
 * @description Background service worker for Chrome Dashboard v2.0
 */

console.log('[Background] Chrome Dashboard v2.0 - Service Worker Started');

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('[Background] First time installation');
    // Set default values on first install
    chrome.storage.local.set({
      dashboard_firstRun: true,
      dashboard_version: '2.0.0-alpha'
    });
  } else if (details.reason === 'update') {
    console.log('[Background] Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message);
  
  // Handle different message types
  switch (message.type) {
    case 'ping':
      sendResponse({ status: 'pong' });
      break;
      
    case 'getVersion':
      sendResponse({ version: chrome.runtime.getManifest().version });
      break;
      
    default:
      console.warn('[Background] Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
  
  return true; // Keep the message channel open for async response
});

console.log('[Background] Service worker initialized');
