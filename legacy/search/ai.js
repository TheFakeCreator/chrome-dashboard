// AI chat logic
export function setupAIChat() {
  const aiForm = document.getElementById('ai-form');
  aiForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = document.getElementById('ai-input').value.trim();
    const platform = document.querySelector('.custom-dropdown[data-name="ai-platform"] input[type="hidden"]').value;
    if (!query) return;
    navigator.clipboard.writeText(query).then(() => {
      let url = '';
      switch (platform) {
        case 'chatgpt':
          url = 'https://chat.openai.com/';
          break;
        case 'gemini':
          url = 'https://gemini.google.com/app';
          break;
        case 'claude':
          url = 'https://claude.ai/';
          break;
        default:
          url = 'https://chat.openai.com/';
      }
      window.open(url, '_blank');
      const notification = document.createElement('div');
      notification.textContent = 'Query copied to clipboard!';
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.background = '#4CAF50';
      notification.style.color = 'white';
      notification.style.padding = '10px 20px';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '10000';
      notification.style.fontSize = '14px';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 2000);
    }).catch(() => {
      let url = '';
      switch (platform) {
        case 'chatgpt':
          url = 'https://chat.openai.com/';
          break;
        case 'gemini':
          url = 'https://gemini.google.com/app';
          break;
        case 'claude':
          url = 'https://claude.ai/';
          break;
        default:
          url = 'https://chat.openai.com/';
      }
      window.open(url, '_blank');
    });
    document.getElementById('ai-input').value = '';
  });
}
