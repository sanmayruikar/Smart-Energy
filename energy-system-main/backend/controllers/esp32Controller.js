const EnergyReading = require('../models/EnergyReading');
const Appliance = require('../models/Appliance');
const { checkAndGenerateAlerts } = require('../services/alertService');

let ioInstance = null;
const setEsp32IO = (io) => {
  ioInstance = io;
};

// @desc    Ingest raw telemetry from ESP32 microcontroller or external simulator
// @route   POST /api/esp32/data
const receiveHardwareData = async (req, res) => {
  try {
    const {
      deviceId = 'ESP32-001',
      voltage,
      current,
      power,
      energy,
      frequency = 50.0,
      powerFactor = 0.95,
      temperature,
      mode = 'HARDWARE',
    } = req.body;

    if (voltage === undefined || current === undefined || power === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: voltage, current, and power are required',
      });
    }

    // Determine currently active appliances in DB
    const activeAppliances = await Appliance.find({ status: 'ON' }).select('name relayPin status');
    const activeNames = activeAppliances.map(a => a.name);

    const reading = await EnergyReading.create({
      deviceId,
      voltage: +voltage,
      current: +current,
      power: +power,
      energy: energy !== undefined ? +energy : 0,
      frequency: +frequency,
      powerFactor: +powerFactor,
      temperature: temperature !== undefined ? +temperature : 28.5,
      mode,
      activeAppliances: activeNames,
      timestamp: new Date(),
    });

    // Check thresholds and emit any alerts
    await checkAndGenerateAlerts(reading);

    // Broadcast live update to React UI
    if (ioInstance) {
      ioInstance.emit('live_energy_data', {
        _id: reading._id,
        deviceId: reading.deviceId,
        voltage: reading.voltage,
        current: reading.current,
        power: reading.power,
        energy: reading.energy,
        temperature: reading.temperature,
        mode: reading.mode,
        activeAppliances: reading.activeAppliances,
        timestamp: reading.timestamp,
      });
    }

    // Send back response with relay commands so ESP32 can actuate its GPIOs
    const relayCommands = activeAppliances.map(a => ({
      pin: a.relayPin,
      state: a.status === 'ON' ? 1 : 0,
    }));

    res.status(200).json({
      success: true,
      message: 'Telemetry ingested successfully',
      serverTime: new Date(),
      mode,
      relayCommands,
    });
  } catch (error) {
    console.error('[ESP32Controller] Error ingesting data:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  setEsp32IO,
  receiveHardwareData,
};
