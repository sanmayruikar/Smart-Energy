const Alert = require('../models/Alert');

// @desc    Get all alerts with pagination and filter
// @route   GET /api/alerts
const getAlerts = async (req, res) => {
  try {
    const { isRead, severity, limit = 50 } = req.query;
    const query = {};

    if (isRead !== undefined && isRead !== 'ALL') {
      query.isRead = isRead === 'true';
    }
    if (severity && severity !== 'ALL') {
      query.severity = severity;
    }

    const alerts = await Alert.find(query).sort({ timestamp: -1 }).limit(parseInt(limit, 10));
    const unreadCount = await Alert.countDocuments({ isRead: false });

    res.json({
      success: true,
      unreadCount,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark single alert as read
// @route   PUT /api/alerts/:id/read
const markAlertAsRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all alerts as read
// @route   PUT /api/alerts/read-all
const markAllAlertsAsRead = async (req, res) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
};
