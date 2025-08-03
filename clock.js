// Clock and date logic
let userLocation = '';
export function setUserLocation(loc) {
  userLocation = loc;
}
export { userLocation };

export function getTimeString(now) {
  const timeFormat = localStorage.getItem('dashboard-timeFormat') || '24';
  let timeStr;
  if (timeFormat === '12') {
    // Remove AM/PM by splitting and taking only the time part
    timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    // Remove am/pm (last part after space)
    timeStr = timeStr.replace(/\s*[APap][Mm]$/, '');
    return timeStr;
  } else {
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

export function getDateString(now) {
  const dateFormat = localStorage.getItem('dashboard-dateFormat') || 'long';
  if (dateFormat === 'short') {
    // Short weekday (Mon, Tue, etc.) and short month (Jan, Feb, etc.), no year, no leading zero
    return now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  } else if (dateFormat === 'iso') {
    // MM-DD only, remove leading zero from day
    const mmdd = now.toISOString().slice(5, 10);
    const [mm, dd] = mmdd.split('-');
    return `${mm}-${parseInt(dd, 10)}`;
  } else {
    // Short weekday (Mon, Tue, etc.) and short month (Jan, Feb, etc.), no year, no leading zero
    return now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
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
