// Search logic
export function setupSearch() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const suggestionsBox = document.getElementById('search-suggestions');


  let lastQuery = '';
  let abortController = null;

  searchInput.addEventListener('input', function() {
    const query = this.value.trim();
    if (!query) {
      suggestionsBox.style.display = 'none';
      return;
    }
    lastQuery = query;
    // Abort previous request if any
    if (abortController) abortController.abort();
    abortController = new AbortController();
    fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}`, { signal: abortController.signal })
      .then(res => res.json())
      .then(data => {
        // Only show if still relevant
        if (searchInput.value.trim() !== lastQuery) return;
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
    const query = searchInput.value.trim();
    const engine = document.querySelector('.custom-dropdown[data-name="search-engine"] input[type="hidden"]').value;
    const filter = document.querySelector('.custom-dropdown[data-name="search-filter"] input[type="hidden"]').value;
    if (!query) return;
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
