const User = require('../models/User');
const Appliance = require('../models/Appliance');
const Settings = require('../models/Settings');
const EnergyReading = require('../models/EnergyReading');
const Prediction = require('../models/Prediction');
const Anomaly = require('../models/Anomaly');
const Alert = require('../models/Alert');

const seedInitialData = async () => {
  try {
    // 1. Seed Settings if none exist
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        electricityTariff: 8.0,
        powerThreshold: 1500,
        temperatureThreshold: 45.0,
        anomalySensitivity: 'MEDIUM',
        simulationMode: true,
        deviceId: 'ESP32-PZEM-01',
        samplingIntervalSeconds: 3,
        notifyEmail: 'admin@smartenergy.local',
        alertNotificationsEnabled: true,
      });
      console.log('[Seed] Default settings created.');
    }

    // 2. Seed Default User if none exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create({
        name: 'Project Administrator',
        email: 'admin@smartenergy.com',
        password: 'adminpassword123',
        role: 'admin',
      });
      console.log('[Seed] Default admin user created (admin@smartenergy.com / adminpassword123).');
    }

    // 3. Seed Default Appliances if none exist
    const applianceCount = await Appliance.countDocuments();
    if (applianceCount === 0) {
      await Appliance.insertMany([
        {
          name: 'LED Light',
          type: 'light',
          relayPin: 12,
          status: 'ON',
          powerRating: 40,
          currentPower: 38.5,
          totalEnergy: 4.82,
          runtimeHours: 120.5,
          totalCost: 38.56,
          isSimulated: true,
        },
        {
          name: 'Ceiling Fan',
          type: 'fan',
          relayPin: 14,
          status: 'ON',
          powerRating: 75,
          currentPower: 72.0,
          totalEnergy: 9.64,
          runtimeHours: 128.0,
          totalCost: 77.12,
          isSimulated: true,
        },
        {
          name: 'DC Water Motor',
          type: 'motor',
          relayPin: 27,
          status: 'OFF',
          powerRating: 750,
          currentPower: 0,
          totalEnergy: 22.50,
          runtimeHours: 30.0,
          totalCost: 180.00,
          isSimulated: true,
        },
        {
          name: 'Filament Bulb',
          type: 'bulb',
          relayPin: 26,
          status: 'OFF',
          powerRating: 100,
          currentPower: 0,
          totalEnergy: 6.20,
          runtimeHours: 62.0,
          totalCost: 49.60,
          isSimulated: true,
        },
      ]);
      console.log('[Seed] Default appliances created (LED Light, Fan, Motor, Bulb).');
    }

    // 4. Seed Historical Energy Readings for past 7 days if empty
    const readingCount = await EnergyReading.countDocuments();
    if (readingCount < 50) {
      console.log('[Seed] Generating realistic 7-day historical telemetry data for analytics and ML...');
      const now = new Date();
      const readings = [];
      let cumulativeEnergy = 120.0;

      // 7 days * 24 hours = 168 hourly aggregated points
      for (let i = 168; i >= 0; i--) {
        const pointTime = new Date(now.getTime() - i * 3600 * 1000);
        const hour = pointTime.getHours();

        // Diurnal curve pattern:
        // Night (0-5): low (~80W - 150W)
        // Morning (6-10): moderate to high (~350W - 700W)
        // Afternoon (11-17): moderate (~250W - 450W)
        // Evening peak (18-22): high (~600W - 1100W)
        // Late night (23): drops down
        let basePower;
        if (hour >= 0 && hour < 6) {
          basePower = 100 + Math.random() * 50;
        } else if (hour >= 6 && hour < 11) {
          basePower = 450 + Math.random() * 200;
        } else if (hour >= 11 && hour < 18) {
          basePower = 320 + Math.random() * 120;
        } else if (hour >= 18 && hour < 23) {
          basePower = 750 + Math.random() * 280;
        } else {
          basePower = 200 + Math.random() * 80;
        }

        // Random occasional spike to seed realistic anomalies
        if (i === 15 || i === 42 || i === 88) {
          basePower += 900; // Anomaly spike
        }

        const voltage = 228.0 + (Math.random() * 6 - 3); // 225-231V
        const current = +(basePower / voltage).toFixed(2);
        const power = +basePower.toFixed(1);
        const energyIncrement = +(power / 1000).toFixed(4);
        cumulativeEnergy += energyIncrement;
        const temperature = +(28.0 + (hour >= 12 && hour <= 16 ? 6.5 : 2.0) + Math.random() * 2).toFixed(1);

        readings.push({
          deviceId: 'ESP32-PZEM-01',
          voltage: +voltage.toFixed(1),
          current,
          power,
          energy: +cumulativeEnergy.toFixed(3),
          frequency: 50.0,
          powerFactor: 0.94,
          temperature,
          mode: 'SIMULATION',
          activeAppliances: power > 500 ? ['Ceiling Fan', 'DC Water Motor'] : ['LED Light', 'Ceiling Fan'],
          timestamp: pointTime,
        });
      }

      await EnergyReading.insertMany(readings);
      console.log(`[Seed] Seeded ${readings.length} historical readings.`);
    }

    // 5. Seed Initial Anomalies if empty
    const anomalyCount = await Anomaly.countDocuments();
    if (anomalyCount === 0) {
      await Anomaly.insertMany([
        {
          timestamp: new Date(Date.now() - 15 * 3600 * 1000),
          deviceId: 'ESP32-PZEM-01',
          appliance: 'DC Water Motor',
          power: 1680.5,
          expectedRange: { min: 700, max: 850 },
          actualValue: 1680.5,
          severity: 'CRITICAL',
          metric: 'power',
          explanation: 'Sudden high power surge detected: 1680W exceeds safe operating envelope by 97.7%. Motor bearing or impeller obstruction suspected.',
          isResolved: false,
        },
        {
          timestamp: new Date(Date.now() - 42 * 3600 * 1000),
          deviceId: 'ESP32-PZEM-01',
          appliance: 'Overall System',
          power: 1420.0,
          expectedRange: { min: 200, max: 450 },
          actualValue: 1420.0,
          severity: 'HIGH',
          metric: 'power',
          explanation: 'Unusual energy spike during off-peak night period (02:00 AM). Unexpected concurrent high load.',
          isResolved: true,
        },
        {
          timestamp: new Date(Date.now() - 88 * 3600 * 1000),
          deviceId: 'ESP32-PZEM-01',
          appliance: 'Control Panel',
          power: 890.0,
          expectedRange: { min: 25, max: 45 },
          actualValue: 52.4,
          severity: 'MEDIUM',
          metric: 'temperature',
          explanation: 'Enclosure temperature exceeded 52°C threshold during prolonged fan & motor operation.',
          isResolved: true,
        },
      ]);
      console.log('[Seed] Default anomalies created.');
    }

    // 6. Seed Initial Alerts if empty
    const alertCount = await Alert.countDocuments();
    if (alertCount === 0) {
      await Alert.insertMany([
        {
          type: 'high_power',
          message: 'Critical Power Warning: System power spiked to 1680W, exceeding safety threshold (1500W).',
          severity: 'CRITICAL',
          timestamp: new Date(Date.now() - 15 * 3600 * 1000),
          isRead: false,
          data: { power: 1680.5, threshold: 1500 },
        },
        {
          type: 'high_temperature',
          message: 'High Enclosure Temperature: Sensor measured 52.4°C (Threshold: 45°C).',
          severity: 'HIGH',
          timestamp: new Date(Date.now() - 88 * 3600 * 1000),
          isRead: true,
          data: { temperature: 52.4, threshold: 45 },
        },
        {
          type: 'system',
          message: 'Smart Energy Management System initialized successfully in Simulation Mode.',
          severity: 'LOW',
          timestamp: new Date(Date.now() - 168 * 3600 * 1000),
          isRead: true,
          data: {},
        },
      ]);
      console.log('[Seed] Default alerts created.');
    }

    // 7. Seed Initial Predictions if empty
    const predCount = await Prediction.countDocuments();
    if (predCount === 0) {
      const now = new Date();
      await Prediction.insertMany([
        {
          timestamp: now,
          targetTimestamp: new Date(now.getTime() + 1 * 3600 * 1000),
          horizon: '1h',
          predictedEnergy: 0.48,
          predictedPower: 480.0,
          mae: 0.038,
          rmse: 0.052,
          r2: 0.948,
          modelUsed: 'RandomForestRegressor',
          confidence: 94.2,
        },
        {
          timestamp: now,
          targetTimestamp: new Date(now.getTime() + 6 * 3600 * 1000),
          horizon: '6h',
          predictedEnergy: 3.25,
          predictedPower: 541.6,
          mae: 0.045,
          rmse: 0.061,
          r2: 0.932,
          modelUsed: 'GradientBoostingRegressor',
          confidence: 91.8,
        },
        {
          timestamp: now,
          targetTimestamp: new Date(now.getTime() + 24 * 3600 * 1000),
          horizon: '24h',
          predictedEnergy: 14.80,
          predictedPower: 616.7,
          mae: 0.056,
          rmse: 0.074,
          r2: 0.915,
          modelUsed: 'RandomForestRegressor',
          confidence: 89.6,
        },
      ]);
      console.log('[Seed] Default predictions initialized.');
    }

    console.log('[Seed] All database seed operations completed.');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error.message);
  }
};

module.exports = { seedInitialData };
