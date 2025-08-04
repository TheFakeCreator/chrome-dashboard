document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('add-bookmark-btn');
  const status = document.getElementById('status');
  btn.addEventListener('click', () => {
    status.textContent = '';
    try {
      if (chrome && chrome.tabs) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (chrome.runtime.lastError) {
            status.textContent = 'Error: ' + chrome.runtime.lastError.message;
            console.error('Chrome runtime error:', chrome.runtime.lastError);
            return;
          }
          if (!tabs || tabs.length === 0) {
            status.textContent = 'No active tab found.';
            console.error('No active tab found.');
            return;
          }
          const tab = tabs[0];
          const url = tab.url;
          const title = tab.title || url;
          const icon = tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${url}`;
          chrome.storage.local.get('sections', function(data) {
            if (chrome.runtime.lastError) {
              status.textContent = 'Storage error: ' + chrome.runtime.lastError.message;
              console.error('Storage error:', chrome.runtime.lastError);
              return;
            }
            let sections = data.sections || null;
            if (!sections) {
              sections = [
                { key: 'apps', name: 'App Drawer', items: [] },
                { key: 'websites', name: 'Website Drawer', items: [] },
                { key: 'visited', name: 'Frequently Visited', items: [] },
                { key: 'bookmarks', name: 'Bookmarks', items: [] }
              ];
            }
            let bookmarksSection = sections.find(s => s.key === 'bookmarks');
            if (!bookmarksSection) {
              bookmarksSection = { key: 'bookmarks', name: 'Bookmarks', items: [] };
              sections.push(bookmarksSection);
            }
            if (!bookmarksSection.items.some(item => item.url === url)) {
              bookmarksSection.items.push({ name: title, url, icon });
              chrome.storage.local.set({sections}, () => {
                if (chrome.runtime.lastError) {
                  status.textContent = 'Save error: ' + chrome.runtime.lastError.message;
                  console.error('Save error:', chrome.runtime.lastError);
                  return;
                }
                status.textContent = 'Bookmarked!';
                console.log('Bookmarked:', {title, url, icon});
                setTimeout(() => { status.textContent = ''; }, 1200);
              });
            } else {
              status.textContent = 'Already Bookmarked';
              console.log('Already Bookmarked:', url);
              setTimeout(() => { status.textContent = ''; }, 1200);
            }
          });
        });
      } else {
        status.textContent = 'chrome.tabs API not available.';
        console.error('chrome.tabs API not available.');
      }
    } catch (err) {
      status.textContent = 'Exception: ' + err.message;
      console.error('Exception:', err);
    }
  });
});
