// Initialisation de la carte Leaflet
var map = L.map('map').setView([48.8566, 2.3522], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var elevationChart;
var routeLayer;
var marker;

function loadGPX(filePath) {
  fetch(filePath)
    .then(response => {
      if (!response.ok) throw new Error('Fichier GPX introuvable');
      return response.text();
    })
    .then(parseGPX)
    .catch(error => console.error('Erreur:', error));
}

function parseGPX(gpxText) {
  var parser = new DOMParser();
  var gpx = parser.parseFromString(gpxText, "text/xml");
  var points = gpx.getElementsByTagName("trkpt");

  var elevationData = [];
  var distanceData = [];
  var coordinates = [];

  var totalDistance = 0;
  var lastPoint = null;

  for (let i = 0; i < points.length; i++) {
    let lat = parseFloat(points[i].getAttribute("lat"));
    let lon = parseFloat(points[i].getAttribute("lon"));
    let ele = parseFloat(points[i].getElementsByTagName("ele")[0].textContent);

    if (lastPoint) {
      let d = haversineDistance(lastPoint, { lat, lon });
      totalDistance += d;
    }

    elevationData.push(ele);
    distanceData.push(parseFloat(totalDistance.toFixed(2))); // Arrondi à 2 décimales
    coordinates.push([lat, lon]);

    lastPoint = { lat, lon };
  }

  // Ajout du tracé GPX sur la carte
  if (routeLayer) map.removeLayer(routeLayer);
  routeLayer = L.polyline(coordinates, { color: 'blue' }).addTo(map);
  map.fitBounds(routeLayer.getBounds());

  // Création du graphique d'altitude
  createElevationChart(distanceData, elevationData, coordinates);
}

function createElevationChart(distanceData, elevationData, coordinates) {
  var ctx = document.getElementById('elevationChart').getContext('2d');
  if (elevationChart) elevationChart.destroy();

  elevationChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: distanceData,
      datasets: [{
        label: 'Dénivelé (m)',
        data: elevationData,
        borderColor: 'blue',
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Distance (km)" } },
        y: { title: { display: true, text: "Altitude (m)" } }
      },
      plugins: {
        tooltip: {
          intersect: false,
          mode: 'index'
        }
      },
      hover: {
        mode: 'nearest',
        intersect: false
      },
      onHover: (event, elements) => {
        if (elements.length > 0) {
          let index = elements[0].index;
          updateMapMarker(coordinates[index]);
        }
      }
    }
  });
}

function updateMapMarker(coord) {
  if (marker) map.removeLayer(marker);
  marker = L.marker(coord).addTo(map);
  map.panTo(coord);
}

function haversineDistance(coord1, coord2) {
  function toRad(x) { return x * Math.PI / 180; }
  let R = 6371;
  let dLat = toRad(coord2.lat - coord1.lat);
  let dLon = toRad(coord2.lon - coord1.lon);
  let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
