const mongoose = require('mongoose');

const applianceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['light', 'fan', 'motor', 'bulb', 'ac', 'heater', 'other'],
    default: 'other',
  },
  relayPin: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['ON', 'OFF'],
    default: 'OFF',
  },
  powerRating: {
    type: Number, // Rated wattage (W)
    required: true,
    default: 100,
  },
  currentPower: {
    type: Number, // Active measured wattage (W)
    default: 0,
  },
  totalEnergy: {
    type: Number, // Cumulative kWh
    default: 0,
  },
  runtimeHours: {
    type: Number, // Hours elapsed while ON
    default: 0,
  },
  totalCost: {
    type: Number, // Total calculated cost in INR
    default: 0,
  },
  isSimulated: {
    type: Boolean,
    default: true,
  },
  lastSwitchedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const { createModelProxy } = require('./modelProxy');
const ApplianceModel = mongoose.model('Appliance', applianceSchema);
module.exports = createModelProxy('Appliance', ApplianceModel);
