/**
 * Standalone IoT Telemetry Simulator for Smart Energy Monitoring System
 * Generates realistic electrical parameters and posts to the exact same /api/esp32/data endpoint as the hardware ESP32.
 */

const http = require('http');

const SERVER_HOST = process.env.SERVER_HOST || 'localhost';
const SERVER_PORT = process.env.SERVER_PORT || 5001;
const DEVICE_ID = process.env.DEVICE_ID || 'ESP32-SIMULATOR-01';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '3000', 10);

console.log('===============================================================');
console.log('⚡ Smart Energy Telemetry Simulator');
console.log(`🎯 Target Endpoint: http://${SERVER_HOST}:${SERVER_PORT}/api/esp32/data`);
console.log(`⏱️ Transmission Interval: ${INTERVAL_MS / 1000}s`);
console.log('===============================================================\n');

let cumulativeEnergy = 135.20;
let cycleCounter = 0;

// Default simulated appliance states
const applianceState = {
  ledLight: true,
  fan: true,
  waterMotor: false,
  filamentBulb: false,
};

function getDiurnalBaseWatts(hour) {
  // Morning: moderate consumption (6 AM - 11 AM)
  if (hour >= 6 && hour < 11) {
    return 450 + Math.random() * 120;
  }
  // Afternoon: lower/moderate consumption (11 AM - 5 PM)
  if (hour >= 11 && hour < 17) {
    return 320 + Math.random() * 80;
  }
  // Evening: higher peak consumption (5 PM - 10 PM)
  if (hour >= 17 && hour < 22) {
    return 820 + Math.random() * 250;
  }
  // Night: low consumption (10 PM - 6 AM)
  return 110 + Math.random() * 40;
}

function sendTelemetry() {
  cycleCounter++;
  const now = new Date();
  const hour = now.getHours();

  // Dynamic appliance cycling
  if (cycleCounter % 15 === 0) {
    applianceState.waterMotor = !applianceState.waterMotor;
    console.log(`[Simulator] Toggled Water Motor: ${applianceState.waterMotor ? 'ON (High Load)' : 'OFF'}`);
  }

  // Base power based on hour + appliances
  let baseWatts = getDiurnalBaseWatts(hour);

  if (applianceState.waterMotor) {
    baseWatts += 750 + Math.random() * 40;
  }

  // Occasional anomaly injection (~ every 25 transmissions)
  let isAnomaly = false;
  if (cycleCounter % 25 === 0) {
    isAnomaly = true;
    baseWatts += 1200; // Sudden high inductive spike
    console.log('\n⚠️ [Simulator] INJECTING ARTIFICIAL SURGE ANOMALY for ML detector test! ⚠️');
  }

  // Electrical parameter calculations (PZEM-017 DC 12V system or 230V AC equivalent)
  // PZEM-017 is a 0-300V DC sensor, commonly paired with 12V/24V/48V solar or battery systems.
  // We model a robust 12.4V system with active DC motor and LED loads:
  const voltage = +(12.45 + (Math.random() * 0.4 - 0.2)).toFixed(2);
  const current = +(baseWatts / voltage).toFixed(2);
  const power = +(voltage * current).toFixed(1);

  // Cumulative energy calculation: (Power in Watts * time in hours) / 1000 = kWh
  const deltaHours = (INTERVAL_MS / 1000) / 3600;
  const deltaKwh = (power * deltaHours) / 1000;
  cumulativeEnergy = +(cumulativeEnergy + deltaKwh).toFixed(4);

  // Temperature simulation (°C): ambient ~28°C + thermal load
  const temperature = +(28.0 + (power / 280) + (Math.random() * 0.4 - 0.2)).toFixed(1);

  const payload = JSON.stringify({
    deviceId: DEVICE_ID,
    voltage,
    current,
    power,
    energy: cumulativeEnergy,
    temperature,
    frequency: 50.0,
    powerFactor: 0.95,
    mode: 'SIMULATION',
  });

  const options = {
    hostname: SERVER_HOST,
    port: SERVER_PORT,
    path: '/api/esp32/data',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      const timeStr = now.toLocaleTimeString();
      console.log(`[${timeStr}] [SENT] V: ${voltage}V | I: ${current}A | P: ${power}W | E: ${cumulativeEnergy}kWh | T: ${temperature}°C | Status: HTTP ${res.statusCode}`);
      if (isAnomaly) {
        console.log('✅ Anomaly packet successfully delivered to backend.\n');
      }
    });
  });

  req.on('error', (err) => {
    console.error(`[Simulator Error] Could not connect to backend server: ${err.message}`);
  });

  req.write(payload);
  req.end();
}

// Start simulation ticker
console.log('[Simulator] Engine running. Press Ctrl+C to terminate.\n');
sendTelemetry();
setInterval(sendTelemetry, INTERVAL_MS);
