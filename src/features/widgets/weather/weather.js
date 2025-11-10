// Weather logic
import { userLocation, setUserLocation } from '../clock/clock.js';

export function getWeatherIcon(code) {
  if ([0].includes(code)) return '☀️';
  if ([1,2,3].includes(code)) return '⛅';
  if ([45,48].includes(code)) return '🌫️';
  if ([51,53,55,61,63,65,80,81,82].includes(code)) return '🌧️';
  if ([71,73,75,85,86].includes(code)) return '❄️';
  if ([95,96,99].includes(code)) return '⛈️';
  return '🌡️';
}

export function updateWeather() {
  const weatherEl = document.getElementById('weather');
  if (!weatherEl) return;
  const manualLocation = localStorage.getItem('dashboard-manualLocation') || '';
  if (manualLocation) {
    setUserLocation(manualLocation);
    // Weather still uses geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
          .then(r => r.json())
          .then(data => {
            if (data.current_weather) {
              const temp = Math.round(data.current_weather.temperature);
              const code = data.current_weather.weathercode;
              const icon = getWeatherIcon(code);
              weatherEl.innerHTML = `${icon} ${temp}&deg;C`;
            } else {
              weatherEl.textContent = 'Weather unavailable';
            }
          })
          .catch(() => { weatherEl.textContent = 'Weather unavailable'; });
      }, () => { weatherEl.textContent = 'Weather unavailable'; });
    } else {
      weatherEl.textContent = 'Weather unavailable';
    }
    return;
  }
}
