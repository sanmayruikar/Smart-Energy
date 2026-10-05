const Anomaly = require('../models/Anomaly');
const EnergyReading = require('../models/EnergyReading');
const { detectAnomalies } = require('../services/mlService');

// @desc    Get all logged anomalies with filters
// @route   GET /api/anomalies
const getAnomalies = async (req, res) => {
  try {
    const { severity, isResolved, limit = 50 } = req.query;
    const query = {};

    if (severity && severity !== 'ALL') {
      query.severity = severity;
    }
    if (isResolved !== undefined && isResolved !== 'ALL') {
      query.isResolved = isResolved === 'true';
    }

    const anomalies = await Anomaly.find(query).sort({ timestamp: -1 }).limit(parseInt(limit, 10));
    
    // Overall metrics
    const totalCount = await Anomaly.countDocuments();
    const unresolvedCount = await Anomaly.countDocuments({ isResolved: false });
    const criticalCount = await Anomaly.countDocuments({ severity: 'CRITICAL', isResolved: false });

    res.json({
      success: true,
      stats: {
        total: totalCount,
        unresolved: unresolvedCount,
        critical: criticalCount,
        status: unresolvedCount > 0 ? 'Anomaly Detected' : 'Normal',
      },
      data: anomalies,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve an anomaly
// @route   PUT /api/anomalies/:id/resolve
const resolveAnomaly = async (req, res) => {
  try {
    const anomaly = await Anomaly.findByIdAndUpdate(
      req.params.id,
      { isResolved: true },
      { new: true }
    );
    if (!anomaly) {
      return res.status(404).json({ success: false, message: 'Anomaly not found' });
    }
    res.json({ success: true, message: 'Anomaly marked as resolved', data: anomaly });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger immediate anomaly detection scan on recent readings
// @route   POST /api/anomalies/scan
const scanAnomalies = async (req, res) => {
  try {
    const readings = await EnergyReading.find().sort({ timestamp: -1 }).limit(30).lean();
    const result = await detectAnomalies(readings);

    const saved = [];
    if (result.anomalies && result.anomalies.length > 0) {
      for (const item of result.anomalies) {
        // Prevent duplicate anomalies in the same minute
        const exists = await Anomaly.findOne({
          power: item.power,
          severity: item.severity,
          timestamp: { $gte: new Date(Date.now() - 60000) },
        });
        if (!exists) {
          const doc = await Anomaly.create(item);
          saved.push(doc);
        }
      }
    }

    res.json({
      success: true,
      message: `Anomaly scan complete. Found ${saved.length} new anomalies.`,
      newAnomalies: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAnomalies,
  resolveAnomaly,
  scanAnomalies,
};
