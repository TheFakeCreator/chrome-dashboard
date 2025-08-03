// Search logic
export function setupSearch() {

  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const suggestionsBox = document.getElementById('search-suggestions');


  // Create ghost text element for autocomplete (commands/props only)
  const ghostInput = document.createElement('span');
  ghostInput.id = 'search-ghost';
  ghostInput.style.position = 'absolute';
  ghostInput.style.pointerEvents = 'none';
  ghostInput.style.color = '#bdbdbd';
  ghostInput.style.opacity = '0.7';
  ghostInput.style.fontSize = 'inherit';
  ghostInput.style.fontFamily = 'inherit';
  ghostInput.style.left = (searchInput.offsetLeft) + 'px';
  ghostInput.style.top = (searchInput.offsetHeight) + 'px';
  ghostInput.style.width = searchInput.offsetWidth + 'px';
  ghostInput.style.height = 'auto';
  ghostInput.style.lineHeight = 'normal';
  ghostInput.style.whiteSpace = 'pre';
  ghostInput.style.zIndex = '10';
  ghostInput.style.userSelect = 'none';
  ghostInput.style.paddingLeft = window.getComputedStyle(searchInput).paddingLeft;

  // Insert ghost below input
  searchInput.parentNode.insertBefore(ghostInput, searchInput.nextSibling);

  let ghostSuggestion = '';


  let lastQuery = '';
  let abortController = null;

  searchInput.addEventListener('input', function() {
    const query = this.value;
    if (!query) {
      suggestionsBox.style.display = 'none';
      ghostInput.textContent = '';
      ghostSuggestion = '';
      return;
    }
    lastQuery = query;
    // Command and prop completions
    const commands = ['/g', '/b', '/ddg', '/yt', '/gh'];
    const props = ['images', 'videos'];
    let completion = '';
    let found = false;
    // Command completion
    for (const cmd of commands) {
      if (cmd.startsWith(query) && cmd !== query) {
        completion = cmd.slice(query.length);
        ghostSuggestion = cmd;
        found = true;
        break;
      }
    }
    // Prop completion (after space)
    if (!found && query.includes(' ')) {
      const parts = query.split(' ');
      const last = parts[parts.length - 1];
      for (const prop of props) {
        if (prop.startsWith(last) && prop !== last) {
          completion = prop.slice(last.length);
          ghostSuggestion = parts.slice(0, -1).join(' ') + ' ' + prop;
          found = true;
          break;
        }
      }
    }
    if (found) {
      ghostInput.textContent = query + completion;
    } else {
      ghostInput.textContent = '';
      ghostSuggestion = '';
    }
    // DDG suggestions dropdown (unchanged)
    if (abortController) abortController.abort();
    abortController = new AbortController();
    fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(query.trim())}`, { signal: abortController.signal })
      .then(res => res.json())
      .then(data => {
        if (searchInput.value.trim() !== lastQuery.trim()) return;
        if (!Array.isArray(data) || data.length === 0) {
          suggestionsBox.style.display = 'none';
          return;
        }
        suggestionsBox.innerHTML = data.map(item => `<div class="suggestion-item">${item.phrase}</div>`).join('');
        suggestionsBox.style.display = 'block';
      })
      .catch(() => {
        suggestionsBox.style.display = 'none';
      });
  });

  // Tab to autocomplete ghost suggestion
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab' && ghostSuggestion) {
      e.preventDefault();
      searchInput.value = ghostSuggestion;
      ghostInput.textContent = '';
      ghostSuggestion = '';
      searchInput.dispatchEvent(new Event('input'));
    }
  });

  // Handle click on suggestion
  suggestionsBox.addEventListener('mousedown', function(e) {
    if (e.target.classList.contains('suggestion-item')) {
      searchInput.value = e.target.textContent;
      suggestionsBox.style.display = 'none';
      // Optionally, submit the form here
      // searchForm.dispatchEvent(new Event('submit'));
    }
  });

  // Hide suggestions on blur
  searchInput.addEventListener('blur', function() {
    setTimeout(() => suggestionsBox.style.display = 'none', 100);
  });

  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    let raw = searchInput.value.trim();
    if (!raw) return;

    // Command parsing
    // Syntax: /g images cats
    // Providers: /g (Google), /b (Bing), /ddg (DuckDuckGo), /yt (YouTube), /gh (GitHub)
    // Filters: images, videos
    let engine = document.querySelector('.custom-dropdown[data-name="search-engine"] input[type="hidden"]').value;
    let filter = document.querySelector('.custom-dropdown[data-name="search-filter"] input[type="hidden"]').value;
    let query = raw;

    const providerMap = {
      '/g': 'google',
      '/b': 'bing',
      '/ddg': 'duckduckgo',
      '/yt': 'youtube',
      '/gh': 'github'
    };
    const filterMap = {
      'images': 'images',
      'videos': 'videos'
    };

    // Detect provider command
    const providerMatch = raw.match(/^\/(g|b|ddg|yt|gh)\b/i);
    if (providerMatch) {
      engine = providerMap[providerMatch[0].toLowerCase()];
      query = query.replace(providerMatch[0], '').trim();
    }

    // Detect filter command
    const filterMatch = query.match(/\b(images|videos)\b/i);
    if (filterMatch) {
      filter = filterMap[filterMatch[0].toLowerCase()];
      query = query.replace(filterMatch[0], '').trim();
    }

    let url = '';
    switch (engine) {
      case 'google':
        url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        if (filter === 'images') url += '&tbm=isch';
        if (filter === 'videos') url += '&tbm=vid';
        break;
      case 'bing':
        url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        if (filter === 'images') url += '&scope=images';
        if (filter === 'videos') url += '&scope=video';
        break;
      case 'duckduckgo':
        url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        if (filter === 'images') url += '&iax=images&ia=images';
        if (filter === 'videos') url += '&iax=videos&ia=videos';
        break;
      case 'youtube':
        url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        break;
      case 'github':
        url = `https://github.com/search?q=${encodeURIComponent(query)}`;
        break;
      default:
        url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
    window.open(url, '_blank');
    searchInput.value = '';
    suggestionsBox.style.display = 'none';
  });
}
