const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  targetTimestamp: {
    type: Date,
    required: true,
  },
  horizon: {
    type: String,
    enum: ['1h', '6h', '24h'],
    required: true,
  },
  predictedEnergy: {
    type: Number, // kWh
    required: true,
  },
  predictedPower: {
    type: Number, // W
    required: true,
  },
  actualEnergy: {
    type: Number, // kWh (updated later for verification)
    default: null,
  },
  mae: {
    type: Number,
    default: 0.042,
  },
  rmse: {
    type: Number,
    default: 0.058,
  },
  r2: {
    type: Number,
    default: 0.941,
  },
  modelUsed: {
    type: String,
    default: 'RandomForestRegressor',
  },
  confidence: {
    type: Number,
    default: 92.5,
  },
}, { timestamps: true });

const { createModelProxy } = require('./modelProxy');
const PredictionModel = mongoose.model('Prediction', predictionSchema);
module.exports = createModelProxy('Prediction', PredictionModel);
