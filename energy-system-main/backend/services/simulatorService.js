const EnergyReading = require('../models/EnergyReading');
const Appliance = require('../models/Appliance');
const Settings = require('../models/Settings');
const { checkAndGenerateAlerts } = require('./alertService');

let simulationInterval = null;
let ioInstance = null;

const setSimulatorIO = (io) => {
  ioInstance = io;
};

// State trackers for continuous simulation
let currentEnergyKwh = 125.40;
let simulationTicks = 0;

const startSimulator = async () => {
  if (simulationInterval) return; // already running

  console.log('[Simulator] Starting real-time IoT energy simulator engine (3s sample cycle)...');
  
  // Find initial energy reading to continue monotonically
  const lastReading = await EnergyReading.findOne().sort({ timestamp: -1 });
  if (lastReading && lastReading.energy) {
    currentEnergyKwh = lastReading.energy;
  }

  simulationInterval = setInterval(async () => {
    try {
      const settings = await Settings.findOne() || { simulationMode: true, electricityTariff: 8.0 };
      if (!settings.simulationMode) {
        return; // paused if user switched off simulation mode
      }

      simulationTicks++;

      // 1. Fetch current status of appliances
      const appliances = await Appliance.find();
      let activeWattage = 0;
      const activeApplianceNames = [];

      appliances.forEach(app => {
        if (app.status === 'ON') {
          // Add rated power with slight jitter
          const jitter = (Math.random() * 0.08 - 0.04) * app.powerRating;
          const power = Math.max(5, Math.round((app.powerRating + jitter) * 10) / 10);
          app.currentPower = power;
          activeWattage += power;
          activeApplianceNames.push(app.name);

          // Update runtime and energy for this appliance (every 3 seconds = 3/3600 hour)
          const deltaHours = 3 / 3600;
          app.runtimeHours = +(app.runtimeHours + deltaHours).toFixed(4);
          const deltaKwh = (power * deltaHours) / 1000;
          app.totalEnergy = +(app.totalEnergy + deltaKwh).toFixed(4);
          app.totalCost = +(app.totalEnergy * (settings.electricityTariff || 8.0)).toFixed(2);
          app.save().catch(e => console.error(e.message));
        } else {
          if (app.currentPower !== 0) {
            app.currentPower = 0;
            app.save().catch(e => console.error(e.message));
          }
        }
      });

      // Background standby load (Wi-Fi router, standby electronics, sensor circuitry)
      const baseStandby = 22.0 + Math.random() * 8.0;
      let totalPower = activeWattage + baseStandby;

      // Time-of-day diurnal effect (slight variation)
      const now = new Date();
      const hour = now.getHours();

      // Occasionally inject an intentional anomaly for testing (~ every 50 ticks)
      let isAnomalyTick = false;
      if (simulationTicks % 50 === 0) {
        isAnomalyTick = true;
        totalPower += 1150.0; // Sudden high surge
        console.log('[Simulator] Injecting simulated power surge anomaly...');
      }

      // Standard grid voltage or 12V DC system depending on setup.
      // Since prompt specifies "ESP32/PZEM-017, 12V DC supply, DC motor, LED light, Bulb",
      // PZEM-017 is a DC voltage/current/power monitor (0-300V DC, 0-100A).
      // Let's generate a stable DC voltage around 12.2V - 12.8V with realistic ripple, or standard 230V if high power.
      // To accommodate both 12V DC & standard wattage readings gracefully:
      const voltage = +(12.4 + (Math.random() * 0.4 - 0.2)).toFixed(2);
      const current = +(totalPower / voltage).toFixed(2);
      totalPower = +(voltage * current).toFixed(1);

      // Energy accumulation
      const energyDelta = (totalPower * (3 / 3600)) / 1000;
      currentEnergyKwh = +(currentEnergyKwh + energyDelta).toFixed(4);

      // Temperature simulation: ambient ~28C + heating from current & environment
      const temperature = +(28.5 + (totalPower / 250) + (Math.random() * 0.6 - 0.3)).toFixed(1);

      const readingData = {
        deviceId: settings.deviceId || 'ESP32-PZEM-01',
        voltage,
        current,
        power: totalPower,
        energy: currentEnergyKwh,
        frequency: 50.0,
        powerFactor: 0.96,
        temperature,
        mode: 'SIMULATION',
        activeAppliances: activeApplianceNames,
        timestamp: now,
      };

      // Save to database
      const reading = await EnergyReading.create(readingData);

      // Check alerts
      await checkAndGenerateAlerts(reading);

      // Emit live telemetry to all connected React clients over Socket.IO
      if (ioInstance) {
        ioInstance.emit('live_energy_data', {
          ...readingData,
          _id: reading._id,
        });
      }
    } catch (err) {
      console.error('[Simulator] Error in simulation tick:', err.message);
    }
  }, 3000);
};

const stopSimulator = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('[Simulator] Simulation engine paused.');
  }
};

module.exports = {
  setSimulatorIO,
  startSimulator,
  stopSimulator,
};
