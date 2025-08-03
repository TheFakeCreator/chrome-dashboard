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
