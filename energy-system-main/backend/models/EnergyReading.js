const mongoose = require('mongoose');

const energyReadingSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
    default: 'ESP32-PZEM-01',
  },
  voltage: {
    type: Number, // Volts (V)
    required: true,
  },
  current: {
    type: Number, // Amperes (A)
    required: true,
  },
  power: {
    type: Number, // Watts (W)
    required: true,
    index: true,
  },
  energy: {
    type: Number, // Cumulative kWh
    required: true,
  },
  frequency: {
    type: Number, // Hertz (Hz)
    default: 50.0,
  },
  powerFactor: {
    type: Number, // PF (0 - 1.0)
    default: 0.95,
  },
  temperature: {
    type: Number, // Celsius (°C)
    required: true,
  },
  mode: {
    type: String,
    enum: ['HARDWARE', 'SIMULATION'],
    default: 'SIMULATION',
    index: true,
  },
  activeAppliances: [{
    type: String,
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, { timestamps: true });

// Compound index for time-series range queries and analytics
energyReadingSchema.index({ timestamp: -1, mode: 1 });

const { createModelProxy } = require('./modelProxy');
const EnergyReadingModel = mongoose.model('EnergyReading', energyReadingSchema);
module.exports = createModelProxy('EnergyReading', EnergyReadingModel);
