let map = L.map('map').setView([39.5, -98.35], 4);

// Base Tile
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
}).addTo(map);

// Radar Layer Example
let radarLayer = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02');
radarLayer.addTo(map);

// Layer Dropdown
const layerSelect = document.getElementById('layerSelect');
layerSelect.innerHTML = `
  <option value="precipitation_new">Precipitation</option>
  <option value="clouds_new">Clouds</option>
  <option value="temp_new">Temperature</option>
`;

layerSelect.addEventListener('change', () => {
  const val = layerSelect.value;
  map.removeLayer(radarLayer);
  radarLayer = L.tileLayer(`https://tile.openweathermap.org/map/${val}/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02`);
  radarLayer.setOpacity(opacitySlider.value);
  radarLayer.addTo(map);
});

// Opacity Slider
const opacitySlider = document.getElementById('opacitySlider');
opacitySlider.addEventListener('input', () => {
  radarLayer.setOpacity(opacitySlider.value);
});

// Unit Toggle
const unitToggle = document.getElementById('unitToggle');
unitToggle.addEventListener('change', () => {
  fetchWeather();
});

// Theme Toggle
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// Fullscreen Toggle
document.getElementById('fullscreenToggle').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Loop Toggle Placeholder
document.getElementById('loopToggle').addEventListener('click', () => {
  alert('Radar loop toggle is a placeholder. Add custom animated tiles or frame swapping logic.');
});

// Geolocation & Weather
function fetchWeather() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const unit = unitToggle.value === 'C' ? 'm' : 'u';

    fetch(`https://wttr.in/${lat},${lon}?format=%l:+%t+%c+%w&m&${unit}`)
      .then(res => res.text())
      .then(data => {
        document.getElementById('weatherInfo').innerText = data;
        L.marker([lat, lon]).addTo(map).bindPopup('You are here').openPopup();
      });
  });
}

fetchWeather();
