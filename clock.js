// Clock and date logic
let userLocation = '';
export function setUserLocation(loc) {
  userLocation = loc;
}
export { userLocation };

export function getTimeString(now) {
  const timeFormat = localStorage.getItem('dashboard-timeFormat') || '24';
  if (timeFormat === '12') {
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } else {
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

export function getDateString(now) {
  const dateFormat = localStorage.getItem('dashboard-dateFormat') || 'long';
  if (dateFormat === 'short') {
    return now.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
  } else if (dateFormat === 'iso') {
    return now.toISOString().slice(0, 10);
  } else {
    return now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}

export function updateClock() {
  const clock = document.getElementById('clock');
  const now = new Date();
  clock.textContent = getTimeString(now);
  // Date
  const dateEl = document.getElementById('date');
  if (dateEl) {
    dateEl.textContent = getDateString(now);
  }
  // Location
  const locEl = document.getElementById('location');
  if (locEl) {
    const manualLocation = localStorage.getItem('dashboard-manualLocation') || '';
    if (manualLocation) {
      locEl.textContent = manualLocation;
    } else {
      locEl.textContent = userLocation ? userLocation : 'Locating...';
    }
  }
}
