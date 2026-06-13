// ===== AIoT Agri-Health Guardian — Data Simulation Engine =====
// Generates realistic sensor data, batch records, farm metadata, and AI grading results

'use strict';

// ===== FARM NODES =====
const FARM_NODES = [
  {
    id: 'FN-001',
    name: 'Green Valley Organic Farm',
    fpo: 'Sahyadri FPO',
    location: { lat: 17.3850, lng: 73.9500 },
    crop: 'Tomato',
    areaHa: 2.5,
    soil: { ph: 6.4, moisture: 42, tds: 280 },
    coastDistance: 18.5,
    elevation: 45,
    riskLevel: 'low',
    status: 'online',
    deviceId: 'ESP32-A1F3'
  },
  {
    id: 'FN-002',
    name: 'Sunrise Spice Plantation',
    fpo: 'Sahyadri FPO',
    location: { lat: 17.4200, lng: 73.8800 },
    crop: 'Chilli',
    areaHa: 1.8,
    soil: { ph: 5.9, moisture: 38, tds: 310 },
    coastDistance: 25.2,
    elevation: 120,
    riskLevel: 'medium',
    status: 'online',
    deviceId: 'ESP32-B2G4'
  },
  {
    id: 'FN-003',
    name: 'Golden Harvest Paddy Field',
    fpo: 'Konkan Krishi FPO',
    location: { lat: 17.3500, lng: 74.0200 },
    crop: 'Rice',
    areaHa: 5.2,
    soil: { ph: 6.8, moisture: 65, tds: 220 },
    coastDistance: 8.3,
    elevation: 12,
    riskLevel: 'high',
    status: 'online',
    deviceId: 'ESP32-C3H5'
  },
  {
    id: 'FN-004',
    name: 'Misty Hills Tea Estate',
    fpo: 'Konkan Krishi FPO',
    location: { lat: 17.4800, lng: 73.7500 },
    crop: 'Tea',
    areaHa: 8.0,
    soil: { ph: 5.2, moisture: 55, tds: 180 },
    coastDistance: 42.0,
    elevation: 580,
    riskLevel: 'low',
    status: 'online',
    deviceId: 'ESP32-D4J6'
  },
  {
    id: 'FN-005',
    name: 'Coconut Grove Coastal Farm',
    fpo: 'Coastal Agri FPO',
    location: { lat: 17.3100, lng: 73.9900 },
    crop: 'Coconut',
    areaHa: 3.0,
    soil: { ph: 7.1, moisture: 48, tds: 420 },
    coastDistance: 3.2,
    elevation: 5,
    riskLevel: 'high',
    status: 'warning',
    deviceId: 'ESP32-E5K7'
  },
  {
    id: 'FN-006',
    name: 'Mango Valley Orchard',
    fpo: 'Coastal Agri FPO',
    location: { lat: 17.2700, lng: 74.0800 },
    crop: 'Mango',
    areaHa: 4.5,
    soil: { ph: 6.6, moisture: 35, tds: 260 },
    coastDistance: 15.8,
    elevation: 75,
    riskLevel: 'medium',
    status: 'online',
    deviceId: 'ESP32-F6L8'
  },
  {
    id: 'FN-007',
    name: 'Bamboo Creek Nursery',
    fpo: 'Green Earth FPO',
    location: { lat: 17.5200, lng: 73.8200 },
    crop: 'Bamboo',
    areaHa: 1.2,
    soil: { ph: 5.8, moisture: 58, tds: 190 },
    coastDistance: 35.0,
    elevation: 340,
    riskLevel: 'low',
    status: 'offline',
    deviceId: 'ESP32-G7M9'
  },
  {
    id: 'FN-008',
    name: 'Cashew Coast Plantation',
    fpo: 'Coastal Agri FPO',
    location: { lat: 17.2400, lng: 73.9600 },
    crop: 'Cashew',
    areaHa: 6.0,
    soil: { ph: 6.2, moisture: 40, tds: 350 },
    coastDistance: 5.5,
    elevation: 18,
    riskLevel: 'high',
    status: 'online',
    deviceId: 'ESP32-H8N0'
  }
];

// ===== SENSOR SIMULATION =====
class SensorSimulator {
  constructor() {
    this.tempSetpoint = 24;
    this.rhSetpoint = 65;
    this.co2Setpoint = 420;
    
    this.tempHistory = [];
    this.rhHistory = [];
    this.co2History = [];
    this.gradeHistory = [];
    
    this.fsmState = 'STABLE';
    this.fsmHistory = [];
    
    // PID state
    this.pidIntegral = 0;
    this.pidPrevError = 0;
    
    // Actuator states
    this.actuators = {
      humidifier: { on: true, power: 45 },
      cooler: { on: true, power: 30 },
      flaps: { on: false, angle: 0 },
      servoBins: { on: true, position: 'A' }
    };
    
    // Initialize with some history
    for (let i = 0; i < 60; i++) {
      this._generateReading();
    }
  }

  _noise(amplitude = 1) {
    return (Math.random() - 0.5) * 2 * amplitude;
  }

  _generateReading() {
    const now = Date.now();
    
    // Temperature with realistic drift
    const tempDrift = Math.sin(now / 120000) * 1.5;
    const temp = +(this.tempSetpoint + tempDrift + this._noise(0.8)).toFixed(1);
    
    // Humidity with correlation to temp
    const rhDrift = Math.cos(now / 90000) * 3;
    const rh = +(this.rhSetpoint + rhDrift + this._noise(1.2) - (temp - this.tempSetpoint) * 0.5).toFixed(1);
    
    // CO2 with slow variation
    const co2Drift = Math.sin(now / 180000) * 30;
    const co2 = Math.round(this.co2Setpoint + co2Drift + this._noise(10));
    
    // Update FSM state based on conditions
    this._updateFSM(temp, rh);
    
    // Generate grade
    const grade = this._simulateGrade();
    
    this.tempHistory.push({ t: now, v: temp });
    this.rhHistory.push({ t: now, v: rh });
    this.co2History.push({ t: now, v: co2 });
    this.gradeHistory.push({ t: now, v: grade });
    
    // Keep only last 120 readings
    if (this.tempHistory.length > 120) {
      this.tempHistory.shift();
      this.rhHistory.shift();
      this.co2History.shift();
      this.gradeHistory.shift();
    }
    
    return { temp, rh, co2, grade, state: this.fsmState };
  }

  _updateFSM(temp, rh) {
    if (rh < 40 && temp < 18) {
      this.fsmState = 'COLD-DRY';
    } else if (rh < 45) {
      this.fsmState = 'DRY';
    } else if (temp > 35 || rh > 90 || rh < 30) {
      this.fsmState = 'CRITICAL';
    } else {
      this.fsmState = 'STABLE';
    }
  }

  _simulateGrade() {
    const r = Math.random();
    if (r < 0.45) return 'A';
    if (r < 0.75) return 'B';
    if (r < 0.92) return 'C';
    return 'REJECT';
  }

  getCurrentReading() {
    return this._generateReading();
  }

  getLatest() {
    return {
      temp: this.tempHistory[this.tempHistory.length - 1]?.v || 0,
      rh: this.rhHistory[this.rhHistory.length - 1]?.v || 0,
      co2: this.co2History[this.co2History.length - 1]?.v || 0,
      grade: this.gradeHistory[this.gradeHistory.length - 1]?.v || 'A',
      state: this.fsmState
    };
  }

  getHistory(type, count = 60) {
    const data = {
      temp: this.tempHistory,
      rh: this.rhHistory,
      co2: this.co2History
    }[type] || [];
    return data.slice(-count);
  }

  getGradeDistribution() {
    const counts = { A: 0, B: 0, C: 0, REJECT: 0 };
    this.gradeHistory.forEach(g => { counts[g.v] = (counts[g.v] || 0) + 1; });
    return counts;
  }

  getPIDOutput() {
    const rh = this.rhHistory[this.rhHistory.length - 1]?.v || 65;
    const error = this.rhSetpoint - rh;
    this.pidIntegral += error;
    const derivative = error - this.pidPrevError;
    this.pidPrevError = error;
    
    const Kp = 2.0, Ki = 0.1, Kd = 0.5;
    const output = Math.max(0, Math.min(100, Kp * error + Ki * this.pidIntegral + Kd * derivative));
    
    return {
      setpoint: this.rhSetpoint,
      current: rh,
      error: +error.toFixed(2),
      output: +output.toFixed(1),
      p: +(Kp * error).toFixed(2),
      i: +(Ki * this.pidIntegral).toFixed(2),
      d: +(Kd * derivative).toFixed(2)
    };
  }
}

// ===== BATCH RECORDS =====
function generateBatchHash(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function createBatchRecords() {
  const batches = [];
  const crops = ['Tomato', 'Chilli', 'Rice', 'Mango', 'Cashew', 'Tea', 'Coconut'];
  const grades = ['A', 'A', 'B', 'A', 'B', 'C', 'A'];
  
  for (let i = 0; i < 12; i++) {
    const farm = FARM_NODES[i % FARM_NODES.length];
    const batchDate = new Date(Date.now() - (i * 86400000));
    const crop = crops[i % crops.length];
    const grade = grades[i % grades.length];
    
    const batchData = {
      batchId: `BATCH-${String(2024001 + i).padStart(7, '0')}`,
      farmId: farm.id,
      farmName: farm.name,
      crop: crop,
      grade: grade,
      gradeConfidence: +(85 + Math.random() * 14).toFixed(1),
      quantity: +(10 + Math.random() * 90).toFixed(1),
      unit: 'kg',
      harvestDate: batchDate.toISOString().split('T')[0],
      gps: farm.location,
      avgTemp: +(22 + Math.random() * 6).toFixed(1),
      avgRH: +(55 + Math.random() * 20).toFixed(1),
      soilPH: farm.soil.ph,
      status: i < 2 ? 'In Transit' : i < 5 ? 'At Market' : 'Delivered',
    };
    
    batchData.blockchainHash = '0x' + generateBatchHash(batchData) + 
      generateBatchHash(batchData + i) + 
      generateBatchHash(batchData + i + 'salt') +
      generateBatchHash(batchData + 'chain');
    
    batchData.prevHash = i > 0 ? batches[i - 1]?.blockchainHash || '0x0000000000000000' : '0x0000000000000000';
    
    batchData.timeline = [
      {
        stage: 'Harvest',
        timestamp: batchDate.toISOString(),
        location: farm.name,
        actor: 'Farmer',
        details: `${batchData.quantity}${batchData.unit} of ${crop} harvested`,
        icon: '🌾'
      },
      {
        stage: 'AI Grading',
        timestamp: new Date(batchDate.getTime() + 3600000).toISOString(),
        location: 'Edge Node ' + farm.deviceId,
        actor: 'AI System',
        details: `Grade ${grade} (${batchData.gradeConfidence}% confidence) — MobileNetV2`,
        icon: '🤖'
      },
      {
        stage: 'Cold Storage',
        timestamp: new Date(batchDate.getTime() + 14400000).toISOString(),
        location: 'FPO Cold Storage Unit',
        actor: farm.fpo,
        details: `Stored at ${batchData.avgTemp}°C, ${batchData.avgRH}% RH`,
        icon: '❄️'
      },
      {
        stage: batchData.status === 'Delivered' ? 'Delivered' : batchData.status,
        timestamp: new Date(batchDate.getTime() + 86400000).toISOString(),
        location: 'Regional Market',
        actor: 'Distributor',
        details: 'Blockchain record verified and sealed',
        icon: batchData.status === 'Delivered' ? '✅' : '🚚'
      }
    ];
    
    batches.push(batchData);
  }
  
  return batches;
}

// ===== ALERT DATA =====
function generateAlerts() {
  const types = [
    { severity: 'critical', title: 'Temperature Spike Detected', desc: 'Node FN-003: Temp exceeded 35°C threshold', icon: '🌡️' },
    { severity: 'warning', title: 'Low Humidity Warning', desc: 'Node FN-005: RH dropped below 40% setpoint', icon: '💧' },
    { severity: 'info', title: 'Batch Grading Complete', desc: 'BATCH-2024003: 245 items graded, 92% Grade A', icon: '✅' },
    { severity: 'critical', title: 'Device Offline', desc: 'Node FN-007 (ESP32-G7M9) lost connection', icon: '📡' },
    { severity: 'warning', title: 'CO₂ Level Elevated', desc: 'Node FN-002: CO₂ at 850ppm, above 800ppm limit', icon: '🫁' },
    { severity: 'info', title: 'Blockchain Sync Complete', desc: '8 batches anchored to Hyperledger Fabric', icon: '🔗' },
    { severity: 'warning', title: 'Soil Moisture Critical', desc: 'Node FN-006: Soil moisture at 22%, irrigation recommended', icon: '🌱' },
    { severity: 'info', title: 'OTA Update Available', desc: 'Firmware v2.4.1 ready for 5 edge nodes', icon: '📦' },
    { severity: 'critical', title: 'PID Controller Divergence', desc: 'Node FN-001: Actuator oscillation detected', icon: '⚠️' },
    { severity: 'info', title: 'Federated Model Updated', desc: 'New MobileNetV2 weights pushed from cloud', icon: '🧠' },
    { severity: 'warning', title: 'Battery Low', desc: 'Node FN-004: Solar backup at 15%', icon: '🔋' },
    { severity: 'info', title: 'FSSAI Audit Scheduled', desc: 'Inspector visit planned for Farm FN-001', icon: '📋' }
  ];
  
  return types.map((alert, i) => ({
    ...alert,
    id: `ALR-${String(1000 + i).padStart(4, '0')}`,
    timestamp: new Date(Date.now() - i * 1800000).toISOString(),
    acknowledged: i > 4
  }));
}

// ===== EDGE AI DATA =====
const EDGE_AI_DATA = {
  model: {
    name: 'MobileNetV2-Q8',
    version: '2.4.0',
    framework: 'TensorFlow Lite',
    inputSize: '224×224',
    quantization: 'INT8',
    sizeKB: 3200,
    accuracy: 94.2,
    f1Score: 0.93,
    avgLatency: 187,
    p95Latency: 215,
    maxLatency: 248,
    inferencesTotal: 48293,
    inferencesToday: 1247
  },
  devices: [
    { id: 'ESP32-A1F3', type: 'ESP32-S3', cpuTemp: 52, memUsage: 67, uptime: '12d 4h', status: 'online', farm: 'FN-001' },
    { id: 'ESP32-B2G4', type: 'ESP32-S3', cpuTemp: 48, memUsage: 58, uptime: '8d 16h', status: 'online', farm: 'FN-002' },
    { id: 'JN-001', type: 'Jetson Nano', cpuTemp: 61, memUsage: 72, uptime: '5d 2h', status: 'online', farm: 'FN-003' },
    { id: 'ESP32-D4J6', type: 'ESP32-S3', cpuTemp: 45, memUsage: 52, uptime: '15d 9h', status: 'online', farm: 'FN-004' },
    { id: 'ESP32-E5K7', type: 'ESP32-S3', cpuTemp: 55, memUsage: 75, uptime: '3d 11h', status: 'warning', farm: 'FN-005' },
    { id: 'ESP32-G7M9', type: 'ESP32-S3', cpuTemp: 0, memUsage: 0, uptime: '-', status: 'offline', farm: 'FN-007' }
  ]
};

// ===== ARCHITECTURE DATA =====
const ARCHITECTURE_LAYERS = [
  {
    id: 'perception',
    title: 'Perception Layer',
    icon: '📡',
    subtitle: 'Sensor + Image Acquisition',
    description: 'Raw data capture from ESP32-S3 with OV2640 camera, SHT31/DHT22 sensors, MH-Z19B CO₂, and Neo-6M GNSS. Sensor fusion with Kalman filtering at the source, JPEG preprocessing on edge.',
    tags: ['ESP32-S3', 'OV2640', 'SHT31', 'DHT22', 'MH-Z19B', 'Neo-6M GPS', 'Kalman Filter'],
    color: '#00e5ff'
  },
  {
    id: 'edge',
    title: 'Edge Intelligence',
    icon: '🧠',
    subtitle: 'On-Device AI + PID Control',
    description: 'Quantized MobileNetV2/YOLOv8 for grade classification, HSV pre-filtering, and ML fusion. MRVC PID controller with Arrhenius compensation drives actuators through a multistate FSM.',
    tags: ['TFLite Micro', 'MobileNetV2', 'YOLOv8', 'PID Controller', 'FSM', 'Jetson Nano'],
    color: '#448aff'
  },
  {
    id: 'network',
    title: 'Network Layer',
    icon: '🌐',
    subtitle: 'Connectivity + Protocols',
    description: 'MQTT over TLS 1.3 as primary protocol with CoAP fallback. Offline-first with SQLite local buffer, batch sync on reconnect. Optional LoRa/NB-IoT for peer-to-peer sync.',
    tags: ['MQTT/TLS 1.3', 'CoAP', 'SQLite Buffer', 'LoRa', 'NB-IoT', 'Edge-Gateway'],
    color: '#ff9100'
  },
  {
    id: 'cloud',
    title: 'Cloud Processing',
    icon: '☁️',
    subtitle: 'Backend + Blockchain',
    description: 'FastAPI + PostgreSQL backend, InfluxDB for time series, Redis for queues. Hyperledger Fabric/Polygon Edge for tamper-proof traceability. LSTM forecasting with SHAP explainability.',
    tags: ['FastAPI', 'PostgreSQL 14', 'InfluxDB', 'Redis', 'Hyperledger', 'LSTM', 'SHAP'],
    color: '#7c4dff'
  },
  {
    id: 'application',
    title: 'Application Layer',
    icon: '📱',
    subtitle: 'Mobile + Dashboard',
    description: 'Flutter multi-role app with QR→Blockchain lookup, real-time charts, and Leaflet GIS. Push via Firebase/WhatsApp with severity-based SMS fallback.',
    tags: ['Flutter 3.x', 'Leaflet/Mapbox', 'QR Scanner', 'Firebase', 'WhatsApp API', 'BLoC'],
    color: '#00e676'
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    icon: '🔒',
    subtitle: 'Data Protection + RBAC',
    description: 'AES-256-GCM edge encryption, E2E TLS with X.509 certificates. RBAC across Farmer/Inspector/Admin. Aligned with DPDPA 2023 & FSSAI. 5-year audit trail.',
    tags: ['AES-256-GCM', 'X.509', 'RBAC', 'DPDPA 2023', 'FSSAI', 'SHA-512 OTA'],
    color: '#ff1744'
  }
];

// ===== PERFORMANCE METRICS =====
const PERFORMANCE_TARGETS = [
  { metric: 'Image→Grade Latency (Edge)', target: '≤ 220 ms', current: '187 ms', status: 'met', progress: 85 },
  { metric: 'RH Setpoint Stabilization', target: '±1.5% / 5 min', current: '±1.2% / 4.3 min', status: 'met', progress: 92 },
  { metric: 'Blockchain Trace Delay', target: '≤ 1 sec', current: '0.73 sec', status: 'met', progress: 73 },
  { metric: 'System Uptime (offline-safe)', target: '≥ 99.5%', current: '99.72%', status: 'met', progress: 99.7 },
  { metric: 'Cost Per Node', target: '≤ ₹8,500', current: '₹7,840', status: 'met', progress: 92.2 }
];

// ===== COMPLIANCE DATA =====
const COMPLIANCE_ITEMS = [
  { name: 'DPDPA 2023', status: 'Compliant', icon: '🛡️', desc: 'Data Protection & Privacy Act' },
  { name: 'FSSAI Standards', status: 'Certified', icon: '🏛️', desc: 'Food Safety & Standards Authority' },
  { name: 'ISO 22000:2018', status: 'In Progress', icon: '📜', desc: 'Food Safety Management Systems' },
  { name: 'APEDA Traceability', status: 'Compliant', icon: '🌿', desc: 'Agricultural Produce Export Standards' }
];

// ===== GLOBAL SINGLETON =====
const sensorSim = new SensorSimulator();
const BATCH_RECORDS = createBatchRecords();
const ALERTS = generateAlerts();
