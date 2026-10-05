const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['high_power', 'energy_anomaly', 'high_temperature', 'sensor_disconnected', 'long_runtime', 'system'],
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

const { createModelProxy } = require('./modelProxy');
const AlertModel = mongoose.model('Alert', alertSchema);
module.exports = createModelProxy('Alert', AlertModel);
