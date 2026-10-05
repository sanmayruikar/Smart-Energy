const Alert = require('../models/Alert');
const Settings = require('../models/Settings');

let ioInstance = null;

const setAlertIO = (io) => {
  ioInstance = io;
};

const checkAndGenerateAlerts = async (reading) => {
  try {
    const settings = await Settings.findOne() || {
      powerThreshold: 1500,
      temperatureThreshold: 45.0,
      alertNotificationsEnabled: true,
    };

    if (!settings.alertNotificationsEnabled) return;

    const { power, temperature, deviceId } = reading;
    const generatedAlerts = [];

    // 1. Check Power Threshold
    if (power > settings.powerThreshold) {
      const severity = power > settings.powerThreshold * 1.3 ? 'CRITICAL' : 'HIGH';
      const alert = await Alert.create({
        type: 'high_power',
        message: `High Power Surge Alert: Detected ${power.toFixed(1)}W, exceeding safety threshold of ${settings.powerThreshold}W!`,
        severity,
        data: { power, threshold: settings.powerThreshold, deviceId },
      });
      generatedAlerts.push(alert);
    }

    // 2. Check Temperature Threshold
    if (temperature > settings.temperatureThreshold) {
      const severity = temperature > settings.temperatureThreshold + 10 ? 'CRITICAL' : 'HIGH';
      const alert = await Alert.create({
        type: 'high_temperature',
        message: `Thermal Alert: Device temperature reached ${temperature.toFixed(1)}°C (Safety limit: ${settings.temperatureThreshold}°C).`,
        severity,
        data: { temperature, threshold: settings.temperatureThreshold, deviceId },
      });
      generatedAlerts.push(alert);
    }

    // Emit over Socket.IO if alerts occurred
    if (generatedAlerts.length > 0 && ioInstance) {
      generatedAlerts.forEach(al => {
        ioInstance.emit('new_alert', al);
      });
    }

    return generatedAlerts;
  } catch (error) {
    console.error('[AlertService] Error evaluating alerts:', error.message);
    return [];
  }
};

module.exports = {
  setAlertIO,
  checkAndGenerateAlerts,
};
