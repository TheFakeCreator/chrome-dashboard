export function applyCustomBackground() {
  const bg = localStorage.getItem('dashboard-bgImage');
  // Remove any previous overlay
  const oldOverlay = document.getElementById('dashboard-bg-overlay');
  if (oldOverlay) oldOverlay.remove();
  if (bg) {
    document.body.style.background = `url('${bg}') center center/cover no-repeat fixed`;
    // Add a semi-transparent overlay for opacity effect
    const overlay = document.createElement('div');
    overlay.id = 'dashboard-bg-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '-2';
    overlay.style.pointerEvents = 'none';
    overlay.style.background = 'rgba(24,26,32,0.75)'; // dark overlay, adjust alpha for opacity
    document.body.appendChild(overlay);
  } else {
    document.body.style.background = '';
    applyTheme(localStorage.getItem('dashboard-theme') || 'dark');
  }
}
// Settings logic
export function setAIGradientBorder(enabled) {
  const aiForm = document.getElementById('ai-form');
  if (!aiForm) return;
  if (enabled) {
    aiForm.classList.remove('no-ai-gradient');
  } else {
    aiForm.classList.add('no-ai-gradient');
  }
}

export function updateWelcome(name) {
  document.getElementById('welcome').textContent = `Welcome, ${name} 👋`;
}

export function setWelcomeVisibility(show) {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.style.display = show ? '' : 'none';
}

export function applyTheme(theme) {
  if (theme === 'light') {
    document.body.style.background = '#f5f6fa';
    document.body.style.color = '#23262f';
  } else {
    document.body.style.background = '#181a20';
    document.body.style.color = '#eaeaea';
  }
}
