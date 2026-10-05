const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  electricityTariff: {
    type: Number, // In INR per kWh (default 8)
    default: 8.0,
  },
  powerThreshold: {
    type: Number, // In Watts (default 1500W)
    default: 1500,
  },
  temperatureThreshold: {
    type: Number, // In Celsius (default 45°C)
    default: 45.0,
  },
  anomalySensitivity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
  },
  simulationMode: {
    type: Boolean,
    default: true,
  },
  deviceId: {
    type: String,
    default: 'ESP32-PZEM-01',
  },
  samplingIntervalSeconds: {
    type: Number,
    default: 3,
  },
  notifyEmail: {
    type: String,
    default: 'admin@smartenergy.local',
  },
  alertNotificationsEnabled: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const { createModelProxy } = require('./modelProxy');
const SettingsModel = mongoose.model('Settings', settingsSchema);
module.exports = createModelProxy('Settings', SettingsModel);
