const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  deviceId: {
    type: String,
    default: 'ESP32-PZEM-01',
  },
  appliance: {
    type: String,
    default: 'Overall System',
  },
  power: {
    type: Number,
    required: true,
  },
  expectedRange: {
    min: { type: Number, default: 50 },
    max: { type: Number, default: 800 },
  },
  actualValue: {
    type: Number,
    required: true,
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true,
  },
  metric: {
    type: String,
    enum: ['power', 'temperature', 'voltage', 'runtime', 'current'],
    default: 'power',
  },
  explanation: {
    type: String,
    required: true,
  },
  isResolved: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const { createModelProxy } = require('./modelProxy');
const AnomalyModel = mongoose.model('Anomaly', anomalySchema);
module.exports = createModelProxy('Anomaly', AnomalyModel);
