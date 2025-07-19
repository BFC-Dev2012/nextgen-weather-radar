// Setup map centered on continental US
const map = L.map('map').setView([39.5, -98.35], 4);

// Base map tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Radar layers base URL & keys (OpenWeatherMap tiles require key; this is a free test key)
const API_KEY = '439d4b804bc8187953eb36d2a8c26a02';
const radarTypes = [
  { id: 'precipitation_new', label: 'Precipitation' },
  { id: 'clouds_new', label: 'Clouds' },
  { id: 'temp_new', label: 'Temperature' },
  { id: 'wind_new', label: 'Wind' }
];

// Current radar overlay & animation state
let currentRadarLayer = null;
let radarLoopLayers = [];
let radarLoopTimer = null;
let radarLoopIndex = 0;
let isLoopPlaying = false;

// Initialize radar layer buttons
const layerButtonsContainer = document.getElementById('layerButtons');
radarTypes.forEach((radar, i) => {
  const btn = document.createElement('button');
  btn.textContent = radar.label;
  btn.dataset.layerId = radar.id;
  btn.classList.toggle('active', i === 0);
  btn.addEventListener('click', () => {
    setActiveLayer(radar.id);
    updateActiveButton(btn);
    stopRadarLoop();
  });
  layerButtonsContainer.appendChild(btn);
});

// Set initial radar layer
setActiveLayer(radarTypes[0].id);

// Helper: update button active style
function updateActiveButton(activeBtn) {
  [...layerButtonsContainer.children].forEach(btn => {
    btn.classList.toggle('active', btn === activeBtn);
  });
}

// Create and add radar overlay layer
function setActiveLayer(layerId) {
  if (currentRadarLayer) map.removeLayer(currentRadarLayer);
  currentRadarLayer = L.tileLayer(
    `https://tile.openweathermap.org/map/${layerId}/{z}/{x}/{y}.png?appid=${API_KEY}`,
    { opacity: parseFloat(opacitySlider.value) }
  );
  currentRadarLayer.addTo(map);
}

// Opacity slider setup
const opacitySlider = document.getElementById('opacitySlider');
opacitySlider.addEventListener('input', () => {
  if (currentRadarLayer) currentRadarLayer.setOpacity(parseFloat(opacitySlider.value));
  radarLoopLayers.forEach(layer => layer.setOpacity(parseFloat(opacitySlider.value)));
});

// Radar loop controls
const playPauseBtn = document.getElementById('playPauseBtn');
const timelineSlider = document.getElementById('timeline');

playPauseBtn.addEventListener('click', () => {
  if (isLoopPlaying) {
    stopRadarLoop();
  } else {
    startRadarLoop();
  }
});

// Build radar loop frames (last 4 frames, assumed 3-hour interval)
// OpenWeatherMap doesn’t officially support animation frames on free tier,
// but we simulate frame switching for demo by appending /0 to /3 to tile URL
function startRadarLoop() {
  if (isLoopPlaying) return;
  stopRadarLoop();
  radarLoopLayers = [];
  radarLoopIndex = 0;
  const baseLayerId = [...layerButtonsContainer.children].find(btn => btn.classList.contains('active')).dataset.layerId;
  if (!baseLayerId) return alert('Select a radar layer first.');

  // Add 4 frames overlay with opacity 0 except the first one
  for (let i = 0; i < 4; i++) {
    const frameLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/${baseLayerId}/${i}/{z}/{x}/{y}.png?appid=${API_KEY}`,
      { opacity: i === 0 ? parseFloat(opacitySlider.value) : 0 }
    );
    frameLayer.addTo(map);
    radarLoopLayers.push(frameLayer);
  }
  // Remove static current radar layer (the one without frame number)
  if (currentRadarLayer) map.removeLayer(currentRadarLayer);

  isLoopPlaying = true;
  playPauseBtn.textContent = '⏸ Pause';

  // Animate frames every 1 second
  radarLoopTimer = setInterval(() => {
    radarLoopLayers.forEach((layer, idx) => {
      layer.setOpacity(idx === radarLoopIndex ? parseFloat(opacitySlider.value) : 0);
    });
    timelineSlider.value = radarLoopIndex;
    radarLoopIndex = (radarLoopIndex + 1) % radarLoopLayers.length;
  }, 1000);
}

function stopRadarLoop() {
  if (!isLoopPlaying) return;
  clearInterval(radarLoopTimer);
  radarLoopLayers.forEach(layer => map.removeLayer(layer));
  radarLoopLayers = [];
  isLoopPlaying = false;
  playPauseBtn.textContent = '▶ Play';
  timelineSlider.value = 0;

  // Re-add the static radar layer for current selection
  const baseLayerId = [...layerButtonsContainer.children].find(btn => btn.classList.contains('active')).dataset.layerId;
  setActiveLayer(baseLayerId);
}

// Timeline slider manual frame control
timelineSlider.addEventListener('input', () => {
  if (!isLoopPlaying) return;
  radarLoopLayers.forEach((layer, idx) => {
    layer.setOpacity(idx === parseInt(timelineSlider.value) ? parseFloat(opacitySlider.value) : 0);
  });
  radarLoopIndex = parseInt(timelineSlider.value);
});

// Locate me button and weather info
const locateBtn = document.getElementById('locateBtn');
const weatherInfoDiv = document.getElementById('weatherInfo');

locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      map.setView([lat, lon], 10);
      L.marker([lat, lon]).addTo(map).bindPopup('You are here').openPopup();
      fetchWeather(lat, lon);
    },
    () => alert('Unable to retrieve your location.')
  );
});

// Fetch real weather data using wttr.in (no API key)
function fetchWeather(lat, lon) {
  weatherInfoDiv.textContent = 'Loading weather...';
  fetch(`https://wttr.in/${lat},${lon}?format=3`)
    .then(res => res.text())
    .then(text => {
      weatherInfoDiv.textContent = text;
    })
    .catch(() => {
      weatherInfoDiv.textContent = 'Unable to fetch weather data.';
    });
}

// Auto fetch weather for center of map on load
map.whenReady(() => {
  const center = map.getCenter();
  fetchWeather(center.lat, center.lng);
});
