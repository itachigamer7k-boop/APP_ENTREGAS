let map;
let markers = [];

function iniciarMapa(lat, lon) {
  map = L.map('map').setView([lat, lon], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  L.marker([lat, lon]).addTo(map).bindPopup("📍 Você");
}

function limparMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

function addMarker(lat, lon, texto) {
  const m = L.marker([lat, lon]).addTo(map).bindPopup(texto);
  markers.push(m);
}
