// ===== AIoT Agri-Health Guardian — Main Application =====
'use strict';

(function() {

// ===== ROUTING & STATE =====
let currentView = 'dashboard';
let charts = {};
let mapInstance = null;
let updateInterval = null;

const viewTitles = {
  dashboard: 'Live Dashboard',
  map: 'GIS Map View',
  'edge-ai': 'Edge AI Monitor',
  traceability: 'Batch Traceability',
  alerts: 'Alerts & Control',
  architecture: 'System Architecture'
};

// ===== PARTICLE BACKGROUND =====
function initParticles() {
  const canvas = document.createElement('canvas');
  const bg = document.getElementById('particle-bg');
  if (!bg) return;
  bg.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.3 + 0.05
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(68, 138, 255, ${p.a})`;
      ctx.fill();
    });

    // Draw connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(68, 138, 255, ${0.05 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(drawParticles);
  }
  drawParticles();
}

// ===== NAVIGATION =====
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      if (view) navigateTo(view);
    });
  });

  // Mobile menu
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

function navigateTo(view) {
  currentView = view;

  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  // Update title
  document.getElementById('page-title').textContent = viewTitles[view] || 'Dashboard';

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');

  // Destroy old charts
  Object.values(charts).forEach(c => { if (c && c.destroy) c.destroy(); });
  charts = {};

  // Destroy map
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }

  // Clear interval
  if (updateInterval) { clearInterval(updateInterval); updateInterval = null; }

  // Render view
  renderView(view);
}

function renderView(view) {
  const container = document.getElementById('view-container');
  switch(view) {
    case 'dashboard': renderDashboard(container); break;
    case 'map': renderMap(container); break;
    case 'edge-ai': renderEdgeAI(container); break;
    case 'traceability': renderTraceability(container); break;
    case 'alerts': renderAlerts(container); break;
    case 'architecture': renderArchitecture(container); break;
    default: renderDashboard(container);
  }
}

// ===== UTILITY: SVG Gauge =====
function svgGauge(value, max, color, label, unit) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);
  const colorClass = color || 'info';
  return `
    <div class="gauge-container animate-in">
      <div class="gauge">
        <svg viewBox="0 0 140 140">
          <circle class="gauge-bg" cx="70" cy="70" r="${r}" />
          <circle class="gauge-fill ${colorClass}" cx="70" cy="70" r="${r}"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}" />
        </svg>
        <div class="gauge-center">
          <div class="gauge-value">${value}</div>
          <div class="gauge-label">${unit || ''}</div>
        </div>
      </div>
      <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.25rem;">${label}</div>
    </div>
  `;
}

// ===== UTILITY: Sparkline =====
function createSparkline(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth * 2;
  const h = canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  const dw = canvas.offsetWidth;
  const dh = canvas.offsetHeight;

  const values = data.map(d => d.v);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const range = max - min || 1;

  ctx.clearRect(0, 0, dw, dh);

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, dh);
  gradient.addColorStop(0, color + '30');
  gradient.addColorStop(1, color + '00');

  ctx.beginPath();
  ctx.moveTo(0, dh);
  values.forEach((v, i) => {
    const x = (i / (values.length - 1)) * dw;
    const y = dh - ((v - min) / range) * dh;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(dw, dh);
  ctx.lineTo(0, dh);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = (i / (values.length - 1)) * dw;
    const y = dh - ((v - min) / range) * dh;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ===== 1. DASHBOARD VIEW =====
function renderDashboard(container) {
  const reading = sensorSim.getCurrentReading();
  const pid = sensorSim.getPIDOutput();
  const dist = sensorSim.getGradeDistribution();
  const fsmClass = reading.state.toLowerCase().replace(' ', '-');

  container.innerHTML = `
    <!-- FSM State & Quick Stats -->
    <div class="section-gap">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <div class="section-title">🌿 System Status</div>
          <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
            <div class="fsm-state ${fsmClass}" id="fsm-badge">${reading.state}</div>
            <span style="font-size:0.78rem; color:var(--text-muted);">PID Output: <strong style="color:var(--accent-secondary);">${pid.output}%</strong></span>
            <span style="font-size:0.78rem; color:var(--text-muted);">Setpoint RH: <strong>${pid.setpoint}%</strong></span>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          ${PERFORMANCE_TARGETS.slice(0, 3).map(t => `
            <div class="badge ${t.status === 'met' ? 'healthy' : 'warning'}">
              ${t.status === 'met' ? '✓' : '!'} ${t.metric.split('(')[0].trim()}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Sensor Gauges -->
    <div class="grid-4 section-gap" id="gauges-row">
      <div class="card metric-card animate-in">
        <div class="metric-header">
          <div class="metric-label">Temperature</div>
          <div class="metric-icon temp">🌡️</div>
        </div>
        <div class="metric-value ${reading.temp > 30 ? 'warning' : reading.temp > 35 ? 'critical' : 'healthy'}" id="metric-temp">${reading.temp}<span class="metric-unit">°C</span></div>
        <div class="metric-sparkline"><canvas id="spark-temp" style="width:100%;height:40px;"></canvas></div>
      </div>
      <div class="card metric-card animate-in">
        <div class="metric-header">
          <div class="metric-label">Humidity (RH)</div>
          <div class="metric-icon humidity">💧</div>
        </div>
        <div class="metric-value info" id="metric-rh">${reading.rh}<span class="metric-unit">%</span></div>
        <div class="metric-sparkline"><canvas id="spark-rh" style="width:100%;height:40px;"></canvas></div>
      </div>
      <div class="card metric-card animate-in">
        <div class="metric-header">
          <div class="metric-label">CO₂ Level</div>
          <div class="metric-icon co2">🫁</div>
        </div>
        <div class="metric-value ${reading.co2 > 800 ? 'critical' : reading.co2 > 600 ? 'warning' : 'info'}" id="metric-co2">${reading.co2}<span class="metric-unit">ppm</span></div>
        <div class="metric-sparkline"><canvas id="spark-co2" style="width:100%;height:40px;"></canvas></div>
      </div>
      <div class="card metric-card animate-in">
        <div class="metric-header">
          <div class="metric-label">AI Grade</div>
          <div class="metric-icon grade">🏷️</div>
        </div>
        <div class="metric-value healthy" id="metric-grade">${reading.grade}</div>
        <div style="margin-top:0.5rem; display:flex; gap:0.35rem;">
          <span class="badge healthy">A: ${dist.A}</span>
          <span class="badge info">B: ${dist.B}</span>
          <span class="badge warning">C: ${dist.C}</span>
          <span class="badge critical">R: ${dist.REJECT}</span>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid-2 section-gap">
      <div class="card animate-in">
        <div class="card-header">
          <div class="card-title"><span class="icon">📈</span> Sensor Time Series</div>
          <div class="card-badge live">● LIVE</div>
        </div>
        <div class="card-body">
          <div class="chart-container" id="timeseries-chart-container">
            <canvas id="timeseries-chart"></canvas>
          </div>
        </div>
      </div>
      <div class="card animate-in">
        <div class="card-header">
          <div class="card-title"><span class="icon">🎯</span> PID Controller Output</div>
          <div class="card-badge live">● LIVE</div>
        </div>
        <div class="card-body">
          <div style="display:flex; justify-content:space-around; margin-bottom:1rem;">
            ${svgGauge(Math.round(pid.output), 100, pid.output > 80 ? 'warning' : 'healthy', 'PID Output', '%')}
            ${svgGauge(Math.round(reading.rh), 100, 'info', 'Current RH', '%')}
          </div>
          <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem;">
            <div style="text-align:center; padding:0.5rem; background:rgba(255,255,255,0.02); border-radius:var(--radius-sm);">
              <div style="font-size:0.65rem; color:var(--text-muted);">P-Term</div>
              <div style="font-family:'JetBrains Mono'; font-weight:700; color:var(--accent-primary);">${pid.p}</div>
            </div>
            <div style="text-align:center; padding:0.5rem; background:rgba(255,255,255,0.02); border-radius:var(--radius-sm);">
              <div style="font-size:0.65rem; color:var(--text-muted);">I-Term</div>
              <div style="font-family:'JetBrains Mono'; font-weight:700; color:var(--status-warning);">${pid.i}</div>
            </div>
            <div style="text-align:center; padding:0.5rem; background:rgba(255,255,255,0.02); border-radius:var(--radius-sm);">
              <div style="font-size:0.65rem; color:var(--text-muted);">D-Term</div>
              <div style="font-family:'JetBrains Mono'; font-weight:700; color:var(--accent-secondary);">${pid.d}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actuator States & Farm Nodes -->
    <div class="grid-2 section-gap">
      <div class="card animate-in">
        <div class="card-header">
          <div class="card-title"><span class="icon">⚙️</span> Actuator States</div>
        </div>
        <div class="card-body" style="display:flex; flex-direction:column; gap:0.5rem;">
          ${Object.entries(sensorSim.actuators).map(([key, val]) => `
            <div class="actuator-toggle">
              <div class="actuator-info">
                <span class="actuator-icon">${key === 'humidifier' ? '💨' : key === 'cooler' ? '❄️' : key === 'flaps' ? '🚪' : '📦'}</span>
                <div>
                  <div class="actuator-name">${key.charAt(0).toUpperCase() + key.slice(1)}</div>
                  <div class="actuator-status">${val.on ? (val.power ? val.power + '% power' : 'Active') : 'Inactive'}</div>
                </div>
              </div>
              <div class="toggle-switch ${val.on ? 'active' : ''}" data-actuator="${key}"></div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card animate-in">
        <div class="card-header">
          <div class="card-title"><span class="icon">🌾</span> Farm Nodes</div>
          <div class="card-badge live">● ${FARM_NODES.filter(f => f.status === 'online').length} ONLINE</div>
        </div>
        <div class="card-body" style="max-height:280px; overflow-y:auto;">
          ${FARM_NODES.slice(0, 6).map(farm => `
            <div class="device-card" style="margin-bottom:0.5rem;">
              <div class="device-avatar ${farm.status === 'online' ? 'gateway' : farm.status === 'warning' ? 'camera' : 'edge'}">
                ${farm.status === 'online' ? '🟢' : farm.status === 'warning' ? '🟡' : '🔴'}
              </div>
              <div class="device-meta">
                <div class="device-name">${farm.name}</div>
                <div class="device-type">${farm.id} • ${farm.crop} • ${farm.deviceId}</div>
              </div>
              <div class="badge ${farm.riskLevel === 'low' ? 'healthy' : farm.riskLevel === 'medium' ? 'warning' : 'critical'}">${farm.riskLevel}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Init sparklines
  setTimeout(() => {
    createSparkline('spark-temp', sensorSim.getHistory('temp', 30), '#ff9100');
    createSparkline('spark-rh', sensorSim.getHistory('rh', 30), '#448aff');
    createSparkline('spark-co2', sensorSim.getHistory('co2', 30), '#ff1744');
    initTimeSeriesChart();
  }, 100);

  // Actuator toggles
  document.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const key = toggle.dataset.actuator;
      sensorSim.actuators[key].on = !sensorSim.actuators[key].on;
      toggle.classList.toggle('active');
      const statusEl = toggle.closest('.actuator-toggle').querySelector('.actuator-status');
      if (statusEl) statusEl.textContent = sensorSim.actuators[key].on ? 'Active' : 'Inactive';
    });
  });

  // Live update loop
  updateInterval = setInterval(() => {
    if (currentView !== 'dashboard') return;
    const r = sensorSim.getCurrentReading();
    const p = sensorSim.getPIDOutput();

    const tempEl = document.getElementById('metric-temp');
    const rhEl = document.getElementById('metric-rh');
    const co2El = document.getElementById('metric-co2');
    const gradeEl = document.getElementById('metric-grade');
    const fsmEl = document.getElementById('fsm-badge');

    if (tempEl) tempEl.innerHTML = `${r.temp}<span class="metric-unit">°C</span>`;
    if (rhEl) rhEl.innerHTML = `${r.rh}<span class="metric-unit">%</span>`;
    if (co2El) co2El.innerHTML = `${r.co2}<span class="metric-unit">ppm</span>`;
    if (gradeEl) gradeEl.textContent = r.grade;
    if (fsmEl) {
      fsmEl.textContent = r.state;
      fsmEl.className = 'fsm-state ' + r.state.toLowerCase().replace(' ', '-');
    }

    createSparkline('spark-temp', sensorSim.getHistory('temp', 30), '#ff9100');
    createSparkline('spark-rh', sensorSim.getHistory('rh', 30), '#448aff');
    createSparkline('spark-co2', sensorSim.getHistory('co2', 30), '#ff1744');

    updateTimeSeriesChart();
  }, 2000);
}

function initTimeSeriesChart() {
  const ctx = document.getElementById('timeseries-chart');
  if (!ctx) return;

  const tempData = sensorSim.getHistory('temp', 60);
  const rhData = sensorSim.getHistory('rh', 60);

  charts.timeseries = new Chart(ctx, {
    type: 'line',
    data: {
      labels: tempData.map((_, i) => i),
      datasets: [
        {
          label: 'Temperature (°C)',
          data: tempData.map(d => d.v),
          borderColor: '#ff9100',
          backgroundColor: 'rgba(255, 145, 0, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4
        },
        {
          label: 'Humidity (%)',
          data: rhData.map(d => d.v),
          borderColor: '#448aff',
          backgroundColor: 'rgba(68, 138, 255, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: '#8892a8', font: { size: 11, family: 'Inter' }, boxWidth: 12, padding: 16 }
        }
      },
      scales: {
        x: { display: false },
        y: {
          grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
          ticks: { color: '#505a72', font: { size: 10, family: 'JetBrains Mono' } }
        }
      },
      animation: { duration: 500 }
    }
  });
}

function updateTimeSeriesChart() {
  if (!charts.timeseries) return;
  const tempData = sensorSim.getHistory('temp', 60);
  const rhData = sensorSim.getHistory('rh', 60);
  charts.timeseries.data.labels = tempData.map((_, i) => i);
  charts.timeseries.data.datasets[0].data = tempData.map(d => d.v);
  charts.timeseries.data.datasets[1].data = rhData.map(d => d.v);
  charts.timeseries.update('none');
}


// ===== 2. MAP VIEW =====
function renderMap(container) {
  container.innerHTML = `
    <div class="section-gap">
      <div class="section-title">🗺️ Farm Node Geospatial View</div>
      <p class="section-subtitle">Interactive map showing all farm nodes, risk zones, and ocean proximity. Click markers for sensor details.</p>
    </div>

    <div class="grid-3 section-gap" style="grid-template-columns: 1fr 1fr 1fr;">
      ${[
        { label: 'Active Nodes', value: FARM_NODES.filter(f => f.status === 'online').length, total: FARM_NODES.length, color: 'healthy' },
        { label: 'High Risk Zones', value: FARM_NODES.filter(f => f.riskLevel === 'high').length, color: 'critical' },
        { label: 'Avg Coast Distance', value: (FARM_NODES.reduce((s, f) => s + f.coastDistance, 0) / FARM_NODES.length).toFixed(1) + ' km', color: 'info' }
      ].map(s => `
        <div class="card metric-card animate-in">
          <div class="metric-label">${s.label}</div>
          <div class="metric-value ${s.color}">${s.value}${s.total ? `<span class="metric-unit">/${s.total}</span>` : ''}</div>
        </div>
      `).join('')}
    </div>

    <div class="card animate-in">
      <div class="card-header">
        <div class="card-title"><span class="icon">🛰️</span> Farm Network Map</div>
        <div style="display:flex; gap:0.5rem;">
          <span class="badge healthy">● Low Risk</span>
          <span class="badge warning">● Medium</span>
          <span class="badge critical">● High Risk</span>
        </div>
      </div>
      <div class="map-container" id="leaflet-map"></div>
    </div>

    <div class="grid-auto section-gap" style="margin-top:1rem;">
      ${FARM_NODES.map(farm => `
        <div class="card device-card animate-in" style="padding:1rem;">
          <div class="device-avatar ${farm.riskLevel === 'low' ? 'gateway' : farm.riskLevel === 'medium' ? 'camera' : 'edge'}">
            ${farm.crop === 'Tomato' ? '🍅' : farm.crop === 'Chilli' ? '🌶️' : farm.crop === 'Rice' ? '🌾' :
              farm.crop === 'Tea' ? '🍵' : farm.crop === 'Coconut' ? '🥥' : farm.crop === 'Mango' ? '🥭' :
              farm.crop === 'Bamboo' ? '🎋' : '🌰'}
          </div>
          <div class="device-meta">
            <div class="device-name">${farm.name}</div>
            <div class="device-type">${farm.crop} • ${farm.areaHa}ha • pH ${farm.soil.ph} • ${farm.coastDistance}km to coast</div>
          </div>
          <div class="badge ${farm.status === 'online' ? 'healthy' : farm.status === 'warning' ? 'warning' : 'critical'}">${farm.status}</div>
        </div>
      `).join('')}
    </div>
  `;

  // Initialize Leaflet map
  setTimeout(() => {
    const mapEl = document.getElementById('leaflet-map');
    if (!mapEl || typeof L === 'undefined') return;

    mapInstance = L.map('leaflet-map', {
      center: [17.38, 73.92],
      zoom: 11,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19
    }).addTo(mapInstance);

    // Add markers
    FARM_NODES.forEach(farm => {
      const color = farm.riskLevel === 'low' ? '#00e676' : farm.riskLevel === 'medium' ? '#ff9100' : '#ff1744';
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.3);box-shadow:0 0 12px ${color}60;display:flex;align-items:center;justify-content:center;font-size:10px;">●</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([farm.location.lat, farm.location.lng], { icon }).addTo(mapInstance);
      
      marker.bindPopup(`
        <div style="min-width:220px;font-family:Inter,sans-serif;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${farm.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:8px;">${farm.id} • ${farm.fpo}</div>
          <table style="font-size:11px;width:100%;border-collapse:collapse;">
            <tr><td style="padding:2px 8px 2px 0;color:#888;">Crop</td><td style="font-weight:600;">${farm.crop}</td></tr>
            <tr><td style="padding:2px 8px 2px 0;color:#888;">Area</td><td>${farm.areaHa} ha</td></tr>
            <tr><td style="padding:2px 8px 2px 0;color:#888;">Soil pH</td><td>${farm.soil.ph}</td></tr>
            <tr><td style="padding:2px 8px 2px 0;color:#888;">Moisture</td><td>${farm.soil.moisture}%</td></tr>
            <tr><td style="padding:2px 8px 2px 0;color:#888;">Coast</td><td>${farm.coastDistance} km</td></tr>
            <tr><td style="padding:2px 8px 2px 0;color:#888;">Elevation</td><td>${farm.elevation}m</td></tr>
            <tr><td style="padding:2px 8px 2px 0;color:#888;">Device</td><td style="font-family:monospace;">${farm.deviceId}</td></tr>
            <tr><td style="padding:2px 8px 2px 0;color:#888;">Risk</td><td style="color:${color};font-weight:700;text-transform:uppercase;">${farm.riskLevel}</td></tr>
          </table>
        </div>
      `, { maxWidth: 300 });
    });

    // Draw risk zone circles for high-risk nodes
    FARM_NODES.filter(f => f.riskLevel === 'high').forEach(farm => {
      L.circle([farm.location.lat, farm.location.lng], {
        radius: 2000,
        color: '#ff174444',
        fillColor: '#ff1744',
        fillOpacity: 0.08,
        weight: 1
      }).addTo(mapInstance);
    });

    // Draw connections between nodes in same FPO
    const fpoGroups = {};
    FARM_NODES.forEach(f => {
      if (!fpoGroups[f.fpo]) fpoGroups[f.fpo] = [];
      fpoGroups[f.fpo].push(f);
    });

    Object.values(fpoGroups).forEach(group => {
      if (group.length > 1) {
        const latlngs = group.map(f => [f.location.lat, f.location.lng]);
        L.polyline(latlngs, {
          color: '#448aff',
          weight: 1,
          opacity: 0.3,
          dashArray: '5, 10'
        }).addTo(mapInstance);
      }
    });

  }, 200);
}


// ===== 3. EDGE AI VIEW =====
function renderEdgeAI(container) {
  const ai = EDGE_AI_DATA;
  const dist = sensorSim.getGradeDistribution();
  const total = Object.values(dist).reduce((s, v) => s + v, 0) || 1;

  container.innerHTML = `
    <div class="section-gap">
      <div class="section-title">🧠 Edge Intelligence Monitor</div>
      <p class="section-subtitle">Real-time AI model performance, device health, and grade distribution from on-device inference.</p>
    </div>

    <!-- Model Performance -->
    <div class="grid-4 section-gap">
      ${[
        { label: 'Avg Latency', value: ai.model.avgLatency, unit: 'ms', color: 'info', icon: '⚡' },
        { label: 'Accuracy', value: ai.model.accuracy, unit: '%', color: 'healthy', icon: '🎯' },
        { label: 'F1 Score', value: ai.model.f1Score, unit: '', color: 'healthy', icon: '📊' },
        { label: 'Inferences Today', value: ai.model.inferencesToday.toLocaleString(), unit: '', color: 'info', icon: '🔢' }
      ].map(m => `
        <div class="card metric-card animate-in">
          <div class="metric-header">
            <div class="metric-label">${m.label}</div>
            <div>${m.icon}</div>
          </div>
          <div class="metric-value ${m.color}">${m.value}<span class="metric-unit">${m.unit}</span></div>
        </div>
      `).join('')}
    </div>

    <div class="grid-2 section-gap">
      <!-- Grade Distribution Chart -->
      <div class="card animate-in">
        <div class="card-header">
          <div class="card-title"><span class="icon">📊</span> Grade Distribution</div>
          <div class="card-badge live">● LIVE</div>
        </div>
        <div class="card-body">
          <div class="chart-container" id="grade-chart-container">
            <canvas id="grade-chart"></canvas>
          </div>
          <div style="display:flex; justify-content:space-around; margin-top:1rem;">
            ${['A', 'B', 'C', 'REJECT'].map(g => {
              const c = g === 'A' ? 'healthy' : g === 'B' ? 'info' : g === 'C' ? 'warning' : 'critical';
              const count = dist[g] || 0;
              return `<div style="text-align:center;">
                <div style="font-size:1.2rem; font-weight:800; color:var(--status-${g === 'B' ? 'info' : g === 'REJECT' ? 'critical' : c});">${count}</div>
                <div style="font-size:0.68rem; color:var(--text-muted);">Grade ${g}</div>
                <div style="font-size:0.65rem; color:var(--text-muted);">${((count / total) * 100).toFixed(1)}%</div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Model Info -->
      <div class="card animate-in">
        <div class="card-header">
          <div class="card-title"><span class="icon">🤖</span> Model Specifications</div>
        </div>
        <div class="card-body">
          <table class="data-table">
            <tbody>
              ${[
                ['Model', ai.model.name],
                ['Version', ai.model.version],
                ['Framework', ai.model.framework],
                ['Input Size', ai.model.inputSize],
                ['Quantization', ai.model.quantization],
                ['Model Size', (ai.model.sizeKB / 1024).toFixed(1) + ' MB'],
                ['P95 Latency', ai.model.p95Latency + ' ms'],
                ['Max Latency', ai.model.maxLatency + ' ms'],
                ['Total Inferences', ai.model.inferencesTotal.toLocaleString()]
              ].map(([k, v]) => `
                <tr><td style="color:var(--text-muted);">${k}</td><td class="mono" style="color:var(--text-primary);font-weight:600;">${v}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Device Health -->
    <div class="card animate-in section-gap">
      <div class="card-header">
        <div class="card-title"><span class="icon">🖥️</span> Edge Device Health</div>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr>
              <th>Device ID</th>
              <th>Type</th>
              <th>Farm</th>
              <th>CPU Temp</th>
              <th>Memory</th>
              <th>Uptime</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${ai.devices.map(d => `
              <tr>
                <td class="mono">${d.id}</td>
                <td>${d.type}</td>
                <td>${d.farm}</td>
                <td><span style="color:${d.cpuTemp > 60 ? 'var(--status-warning)' : d.cpuTemp > 0 ? 'var(--status-healthy)' : 'var(--text-muted)'};">${d.cpuTemp}°C</span></td>
                <td>
                  <div style="display:flex;align-items:center;gap:0.5rem;">
                    <div class="progress-bar" style="flex:1;"><div class="progress-fill ${d.memUsage > 75 ? 'warning' : 'info'}" style="width:${d.memUsage}%;"></div></div>
                    <span class="mono" style="font-size:0.72rem;">${d.memUsage}%</span>
                  </div>
                </td>
                <td class="mono">${d.uptime}</td>
                <td><span class="badge ${d.status === 'online' ? 'healthy' : d.status === 'warning' ? 'warning' : 'critical'}">${d.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Performance Targets -->
    <div class="card animate-in">
      <div class="card-header">
        <div class="card-title"><span class="icon">🎯</span> Architecture Performance Targets</div>
      </div>
      <div class="card-body">
        ${PERFORMANCE_TARGETS.map(t => `
          <div style="display:flex; align-items:center; gap:1rem; padding:0.65rem 0; border-bottom:1px solid var(--border-subtle);">
            <div style="flex:1;">
              <div style="font-size:0.82rem; font-weight:600; color:var(--text-primary);">${t.metric}</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">Target: ${t.target}</div>
            </div>
            <div style="font-family:'JetBrains Mono'; font-size:0.82rem; font-weight:700; color:var(--status-healthy);">${t.current}</div>
            <span class="badge healthy">✓ MET</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Grade distribution chart
  setTimeout(() => {
    const ctx = document.getElementById('grade-chart');
    if (!ctx) return;
    charts.grade = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Grade A', 'Grade B', 'Grade C', 'Reject'],
        datasets: [{
          data: [dist.A, dist.B, dist.C, dist.REJECT],
          backgroundColor: ['#00e676', '#448aff', '#ff9100', '#ff1744'],
          borderColor: '#0a0f1a',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false }
        },
        animation: { animateRotate: true, duration: 1000 }
      }
    });
  }, 100);
}


// ===== 4. TRACEABILITY VIEW =====
function renderTraceability(container) {
  container.innerHTML = `
    <div class="section-gap">
      <div class="section-title">🔗 Blockchain Batch Traceability</div>
      <p class="section-subtitle">Tamper-proof provenance chain powered by Hyperledger Fabric. Search batches or scan QR codes for full traceability.</p>
    </div>

    <!-- Search -->
    <div class="section-gap">
      <div class="search-box" style="max-width:500px;">
        <span class="search-icon">🔍</span>
        <input type="text" id="batch-search" placeholder="Search batch ID… e.g. BATCH-2024001" autocomplete="off" />
      </div>
    </div>

    <!-- Batch Detail Panel (hidden initially) -->
    <div id="batch-detail" style="display:none;" class="section-gap"></div>

    <!-- Batch Records Table -->
    <div class="card animate-in">
      <div class="card-header">
        <div class="card-title"><span class="icon">📦</span> Recent Batches</div>
        <div class="card-badge healthy">🔗 ANCHORED</div>
      </div>
      <div class="card-body" style="overflow-x:auto;">
        <table class="data-table" id="batch-table">
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Farm</th>
              <th>Crop</th>
              <th>Grade</th>
              <th>Qty</th>
              <th>Harvest Date</th>
              <th>Status</th>
              <th>Blockchain Hash</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${BATCH_RECORDS.map(b => `
              <tr>
                <td class="mono" style="color:var(--accent-primary); font-weight:600;">${b.batchId}</td>
                <td>${b.farmName.substring(0, 20)}…</td>
                <td>${b.crop}</td>
                <td><span class="badge ${b.grade === 'A' ? 'healthy' : b.grade === 'B' ? 'info' : 'warning'}">${b.grade} (${b.gradeConfidence}%)</span></td>
                <td>${b.quantity} ${b.unit}</td>
                <td class="mono">${b.harvestDate}</td>
                <td><span class="badge ${b.status === 'Delivered' ? 'healthy' : b.status === 'In Transit' ? 'warning' : 'info'}">${b.status}</span></td>
                <td><div class="hash" style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${b.blockchainHash}</div></td>
                <td><button class="btn btn-outline" style="padding:0.3rem 0.6rem; font-size:0.72rem;" onclick="window._viewBatch('${b.batchId}')">View</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Search handler
  const searchInput = document.getElementById('batch-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toUpperCase();
      const rows = document.querySelectorAll('#batch-table tbody tr');
      rows.forEach(row => {
        const id = row.querySelector('td').textContent;
        row.style.display = !q || id.includes(q) ? '' : 'none';
      });
    });
  }

  // View batch detail
  window._viewBatch = function(batchId) {
    const batch = BATCH_RECORDS.find(b => b.batchId === batchId);
    if (!batch) return;

    const detailEl = document.getElementById('batch-detail');
    detailEl.style.display = 'block';
    detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    detailEl.innerHTML = `
      <div class="grid-2" style="gap:1rem;">
        <!-- Batch Info -->
        <div class="card animate-in">
          <div class="card-header">
            <div class="card-title"><span class="icon">📋</span> ${batch.batchId}</div>
            <span class="badge ${batch.grade === 'A' ? 'healthy' : 'info'}">Grade ${batch.grade}</span>
          </div>
          <div class="card-body">
            <table class="data-table">
              <tbody>
                ${[
                  ['Farm', batch.farmName],
                  ['Farm ID', batch.farmId],
                  ['Crop', batch.crop],
                  ['Quantity', batch.quantity + ' ' + batch.unit],
                  ['Harvest Date', batch.harvestDate],
                  ['Grade Confidence', batch.gradeConfidence + '%'],
                  ['Avg Temperature', batch.avgTemp + '°C'],
                  ['Avg Humidity', batch.avgRH + '%'],
                  ['Soil pH', batch.soilPH],
                  ['GPS', batch.gps.lat.toFixed(4) + ', ' + batch.gps.lng.toFixed(4)],
                  ['Status', batch.status]
                ].map(([k, v]) => `<tr><td style="color:var(--text-muted);">${k}</td><td style="font-weight:600;">${v}</td></tr>`).join('')}
              </tbody>
            </table>
            <div style="margin-top:1rem;">
              <div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:0.35rem;">BLOCKCHAIN HASH</div>
              <div class="hash">${batch.blockchainHash}</div>
            </div>
            <div style="margin-top:0.5rem;">
              <div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:0.35rem;">PREVIOUS BLOCK</div>
              <div class="hash">${batch.prevHash}</div>
            </div>
          </div>
        </div>

        <!-- QR + Timeline -->
        <div>
          <!-- QR Code -->
          <div class="card animate-in" style="margin-bottom:1rem;">
            <div class="card-header">
              <div class="card-title"><span class="icon">📱</span> Batch QR Code</div>
            </div>
            <div class="card-body">
              <div class="qr-display" id="qr-display">
                <canvas id="qr-canvas"></canvas>
              </div>
              <div style="text-align:center; font-size:0.72rem; color:var(--text-muted); margin-top:0.5rem;">
                Scan to verify on blockchain
              </div>
            </div>
          </div>

          <!-- Provenance Timeline -->
          <div class="card animate-in">
            <div class="card-header">
              <div class="card-title"><span class="icon">🔄</span> Provenance Chain</div>
            </div>
            <div class="card-body">
              <div class="timeline">
                ${batch.timeline.map((step, i) => {
                  const dotClass = i === 0 ? 'farm' : i === 1 ? 'grade' : i === 2 ? 'store' : 'market';
                  const time = new Date(step.timestamp);
                  return `
                    <div class="timeline-item">
                      <div class="timeline-dot ${dotClass}">${step.icon}</div>
                      <div class="timeline-content">
                        <div class="timeline-stage" style="color:var(--accent-${i === 0 ? 'secondary' : i === 1 ? 'primary' : i === 2 ? 'secondary' : 'primary'});">
                          ${step.stage}
                        </div>
                        <div class="timeline-detail">${step.details}</div>
                        <div class="timeline-detail">${step.location} — ${step.actor}</div>
                        <div class="timeline-detail" style="font-family:'JetBrains Mono'; font-size:0.68rem;">
                          ${time.toLocaleDateString()} ${time.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Generate QR code
    setTimeout(() => {
      if (typeof QRCode !== 'undefined') {
        const canvas = document.getElementById('qr-canvas');
        if (canvas) {
          QRCode.toCanvas(canvas, JSON.stringify({
            batchId: batch.batchId,
            hash: batch.blockchainHash,
            farm: batch.farmId,
            grade: batch.grade,
            crop: batch.crop
          }), {
            width: 180,
            color: { dark: '#e4e8f0', light: '#0a0f1a' }
          });
        }
      }
    }, 200);
  };
}


// ===== 5. ALERTS VIEW =====
function renderAlerts(container) {
  const criticalCount = ALERTS.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const warningCount = ALERTS.filter(a => a.severity === 'warning' && !a.acknowledged).length;

  container.innerHTML = `
    <div class="section-gap">
      <div class="section-title">🔔 Alerts & Actuator Control</div>
      <p class="section-subtitle">Real-time alert feed with severity management, actuator controls, and compliance status.</p>
    </div>

    <!-- Alert Stats -->
    <div class="grid-3 section-gap">
      <div class="card metric-card animate-in">
        <div class="metric-label">Critical Alerts</div>
        <div class="metric-value critical">${criticalCount}</div>
        <div class="metric-change down">⚠ Requires immediate attention</div>
      </div>
      <div class="card metric-card animate-in">
        <div class="metric-label">Warnings</div>
        <div class="metric-value warning">${warningCount}</div>
        <div class="metric-change" style="color:var(--text-muted);">Monitoring</div>
      </div>
      <div class="card metric-card animate-in">
        <div class="metric-label">Total Alerts (24h)</div>
        <div class="metric-value info">${ALERTS.length}</div>
        <div class="metric-change up">${ALERTS.filter(a => a.acknowledged).length} acknowledged</div>
      </div>
    </div>

    <div class="grid-2 section-gap">
      <!-- Alert Feed -->
      <div class="card animate-in">
        <div class="card-header">
          <div class="card-title"><span class="icon">📋</span> Alert Feed</div>
          <div class="card-badge ${criticalCount > 0 ? 'critical' : 'healthy'}">${criticalCount > 0 ? '⚠ ACTIVE' : '✓ CLEAR'}</div>
        </div>
        <div class="card-body" style="max-height:500px; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem;">
          ${ALERTS.map(alert => {
            const time = new Date(alert.timestamp);
            const timeAgo = getTimeAgo(time);
            return `
              <div class="alert-item" style="${alert.acknowledged ? 'opacity:0.5;' : ''}">
                <div class="alert-severity ${alert.severity}"></div>
                <div class="alert-content">
                  <div class="alert-title">${alert.icon} ${alert.title}</div>
                  <div class="alert-description">${alert.desc}</div>
                </div>
                <div class="alert-time">${timeAgo}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Actuator Controls + Compliance -->
      <div>
        <!-- Actuator Controls -->
        <div class="card animate-in" style="margin-bottom:1rem;">
          <div class="card-header">
            <div class="card-title"><span class="icon">⚙️</span> Actuator Control Panel</div>
          </div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:0.5rem;">
            ${[
              { key: 'humidifier', icon: '💨', name: 'Humidifier Unit', desc: 'Maintains RH setpoint via PID' },
              { key: 'cooler', icon: '❄️', name: 'Cooling System', desc: 'Arrhenius-compensated cooling' },
              { key: 'flaps', icon: '🚪', name: 'Ventilation Flaps', desc: 'CO₂ exhaust and airflow control' },
              { key: 'servoBins', icon: '📦', name: 'Servo Sorting Bins', desc: 'AI-driven grade sorting (A/B/C/R)' }
            ].map(a => `
              <div class="actuator-toggle">
                <div class="actuator-info">
                  <span class="actuator-icon">${a.icon}</span>
                  <div>
                    <div class="actuator-name">${a.name}</div>
                    <div class="actuator-status">${a.desc}</div>
                  </div>
                </div>
                <div class="toggle-switch ${sensorSim.actuators[a.key].on ? 'active' : ''}" data-actuator="${a.key}"></div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Compliance -->
        <div class="card animate-in">
          <div class="card-header">
            <div class="card-title"><span class="icon">🛡️</span> Compliance Status</div>
          </div>
          <div class="card-body" style="display:flex; flex-direction:column; gap:0.75rem;">
            ${COMPLIANCE_ITEMS.map(c => `
              <div class="compliance-card">
                <div class="compliance-icon">${c.icon}</div>
                <div class="compliance-info">
                  <div class="compliance-name">${c.name}</div>
                  <div class="compliance-status">${c.status === 'In Progress' ? '🔄 ' : '✓ '}${c.status}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Actuator toggles
  document.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const key = toggle.dataset.actuator;
      if (key && sensorSim.actuators[key] !== undefined) {
        sensorSim.actuators[key].on = !sensorSim.actuators[key].on;
        toggle.classList.toggle('active');
      }
    });
  });
}


// ===== 6. ARCHITECTURE VIEW =====
function renderArchitecture(container) {
  container.innerHTML = `
    <div class="section-gap">
      <div class="hero-section" style="padding:2rem 0;">
        <h1>
          <span class="green-text">AIoT Agri-Health</span><br/>
          <span class="gradient-text">Guardian Architecture</span>
        </h1>
        <p>Precision Food Safety & Smart Produce Traceability with Geo-Aware Edge Intelligence</p>
        <div class="stats-row">
          <div class="stat-block animate-in">
            <div class="stat-number" style="background:var(--accent-green-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">6</div>
            <div class="stat-label">Architecture Layers</div>
          </div>
          <div class="stat-block animate-in">
            <div class="stat-number" style="background:var(--accent-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">8</div>
            <div class="stat-label">Farm Nodes</div>
          </div>
          <div class="stat-block animate-in">
            <div class="stat-number" style="background:var(--accent-warm-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">24+</div>
            <div class="stat-label">Integrated Technologies</div>
          </div>
          <div class="stat-block animate-in">
            <div class="stat-number" style="background:var(--accent-danger-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">99.7%</div>
            <div class="stat-label">System Uptime</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Architecture Layers -->
    <div class="section-title">🏗️ System Architecture Layers</div>
    <div class="section-subtitle">From perception to cloud — each layer operates independently with standardized interfaces.</div>

    ${ARCHITECTURE_LAYERS.map((layer, i) => `
      ${i > 0 ? '<div class="arch-connector"><div class="arrow">↓</div></div>' : ''}
      <div class="arch-layer ${layer.id} animate-in">
        <div class="arch-layer-title">
          <span>${layer.icon}</span>
          <span style="color:${layer.color};">Layer ${i + 1}: ${layer.title}</span>
          <span style="font-size:0.72rem; color:var(--text-muted); font-weight:400;">— ${layer.subtitle}</span>
        </div>
        <div class="arch-layer-desc">${layer.description}</div>
        <div class="arch-tags">
          ${layer.tags.map(t => `<span class="arch-tag">${t}</span>`).join('')}
        </div>
      </div>
    `).join('')}

    <!-- Tools & Standards -->
    <div style="margin-top:2rem;">
      <div class="section-title">🧰 Tools, APIs & Standards</div>
      <div class="grid-3 section-gap">
        ${[
          { domain: 'AI & ML', stack: 'TensorFlow Lite, Scikit-Learn, PyTorch', icon: '🤖' },
          { domain: 'IoT Messaging', stack: 'Mosquitto MQTT, CoAP, HTTP/2', icon: '📡' },
          { domain: 'Firmware', stack: 'ESP-IDF, FreeRTOS, PlatformIO', icon: '🔧' },
          { domain: 'Spatial Data', stack: 'GDAL, Geopandas, Bhunaksha API', icon: '🌍' },
          { domain: 'DevOps', stack: 'GitHub Actions, Docker, SHA-512 OTA', icon: '🚀' },
          { domain: 'Mobile UI', stack: 'Flutter + SQLite, BLoC, Firebase', icon: '📱' }
        ].map(t => `
          <div class="card animate-in" style="padding:1rem;">
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
              <span style="font-size:1.3rem;">${t.icon}</span>
              <div style="font-size:0.85rem; font-weight:700; color:var(--text-bright);">${t.domain}</div>
            </div>
            <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.6;">${t.stack}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Deployment Blueprint -->
    <div class="card animate-in" style="margin-top:1rem;">
      <div class="card-header">
        <div class="card-title"><span class="icon">📦</span> Deployment Blueprint</div>
      </div>
      <div class="card-body">
        <div class="grid-2" style="gap:1rem;">
          ${[
            { icon: '🎯', title: 'Edge Node', desc: 'Each farm runs as a self-contained edge node with local AI inference and PID control' },
            { icon: '🛰️', title: 'Data Sync', desc: 'GPS-tagged batch + sensor + AI metadata synced via MQTT over TLS to cloud gateway' },
            { icon: '☁️', title: 'Cloud Analytics', desc: 'Regional pattern fusion, LSTM forecasting, and federated model updates pushed to edge' },
            { icon: '🔗', title: 'Blockchain Anchor', desc: 'Tamper-proof quality and safety records with complete audit trail for 5+ years' }
          ].map(d => `
            <div style="display:flex; gap:0.75rem; padding:1rem; border-radius:var(--radius-md); background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle);">
              <span style="font-size:1.5rem;">${d.icon}</span>
              <div>
                <div style="font-size:0.85rem; font-weight:700; color:var(--text-bright); margin-bottom:0.25rem;">${d.title}</div>
                <div style="font-size:0.78rem; color:var(--text-secondary);">${d.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}


// ===== HELPERS =====
function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return seconds + 's ago';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}


// ===== INIT =====
function init() {
  initParticles();
  initNavigation();
  navigateTo('dashboard');

  // Update header stats
  setInterval(() => {
    const onlineCount = FARM_NODES.filter(f => f.status !== 'offline').length;
    const onlineEl = document.getElementById('nodes-online');
    if (onlineEl) onlineEl.textContent = `${onlineCount}/${FARM_NODES.length}`;

    const latencyEl = document.getElementById('avg-latency');
    if (latencyEl) latencyEl.textContent = `${180 + Math.floor(Math.random() * 15)}ms`;

    // Alert count
    const alertBadge = document.getElementById('alert-count');
    const critCount = ALERTS.filter(a => a.severity === 'critical' && !a.acknowledged).length;
    if (alertBadge) alertBadge.textContent = critCount;
  }, 5000);
}

// Wait for all scripts to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
