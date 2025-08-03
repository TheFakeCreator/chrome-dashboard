// Search logic
export function setupSearch() {
  const searchForm = document.getElementById('search-form');
  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    const engine = document.getElementById('search-engine').value;
    const filter = document.getElementById('search-filter').value;
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
    document.getElementById('search-input').value = '';
  });
}
