// background.js - Track all website visits and searches

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (!details.url || details.frameId !== 0) return;
  const url = details.url;
  const hostname = (new URL(url)).hostname;
  // Exclude dashboard newtab and settings pages
  if (url.includes('newtab.html') || url.includes('settings') || hostname === 'chrome-dashboard' || url.startsWith('chrome://')) return;
  const title = hostname;
  let icon = `https://logo.clearbit.com/${hostname}`;

  // Detect search queries (Google, Bing, DuckDuckGo, etc.)
  let searchQuery = null;
  if (hostname.includes('google.') && url.includes('search?q=')) {
    searchQuery = new URLSearchParams((new URL(url)).search).get('q');
  } else if (hostname.includes('bing.') && url.includes('search?q=')) {
    searchQuery = new URLSearchParams((new URL(url)).search).get('q');
  } else if (hostname.includes('duckduckgo.') && url.includes('?q=')) {
    searchQuery = new URLSearchParams((new URL(url)).search).get('q');
  }

  chrome.storage.local.get(['sections'], (data) => {
    let sections = data.sections || [
      { key: 'apps', name: 'App Drawer', items: [] },
      { key: 'websites', name: 'Website Drawer', items: [] },
      { key: 'visited', name: 'Frequently Visited', items: [] },
      { key: 'bookmarks', name: 'Bookmarks', items: [] }
    ];
    let visitedSection = sections.find(s => s.key === 'visited');
    if (!visitedSection) {
      visitedSection = { key: 'visited', name: 'Frequently Visited', items: [] };
      sections.push(visitedSection);
    }
    // Track site visit
    let existing = visitedSection.items.find(item => item.url === url);
    if (!existing) {
      visitedSection.items.push({ name: title, url, icon, count: 1 });
    } else {
      existing.count = (existing.count || 1) + 1;
    }
    // Track search
    if (searchQuery) {
      let searchItem = visitedSection.items.find(item => item.url === url && item.name === searchQuery);
      if (!searchItem) {
        visitedSection.items.push({ name: searchQuery, url, icon, count: 1 });
      } else {
        searchItem.count = (searchItem.count || 1) + 1;
      }
    }
    chrome.storage.local.set({ sections });
  });
});
