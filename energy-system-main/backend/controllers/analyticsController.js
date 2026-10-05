const EnergyReading = require('../models/EnergyReading');
const Appliance = require('../models/Appliance');
const Settings = require('../models/Settings');

// @desc    Get detailed energy analytics
// @route   GET /api/analytics
const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, timeframe = 'daily' } = req.query;
    const settings = await Settings.findOne() || { electricityTariff: 8.0 };
    const tariff = settings.electricityTariff || 8.0;

    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    } else {
      // Default to last 7 days
      const d = new Date();
      d.setDate(d.getDate() - 7);
      filter.timestamp = { $gte: d };
    }

    const readings = await EnergyReading.find(filter).sort({ timestamp: 1 }).lean();

    // 1. Overall Aggregation Statistics
    let minPower = Infinity;
    let maxPower = -Infinity;
    let totalPowerSum = 0;
    let peakTimestamp = null;

    readings.forEach(r => {
      totalPowerSum += r.power;
      if (r.power < minPower) minPower = r.power;
      if (r.power > maxPower) {
        maxPower = r.power;
        peakTimestamp = r.timestamp;
      }
    });

    if (minPower === Infinity) minPower = 0;
    if (maxPower === -Infinity) maxPower = 0;

    const count = readings.length;
    const avgPower = count > 0 ? +(totalPowerSum / count).toFixed(1) : 0;
    const totalEnergy = readings.length > 1
      ? +(readings[readings.length - 1].energy - readings[0].energy).toFixed(3)
      : +(avgPower * (count * 3 / 3600) / 1000).toFixed(3);
    const estimatedCost = +(totalEnergy * tariff).toFixed(2);

    // 2. Hourly Breakdown (Last 24 Hours)
    const last24h = new Date(Date.now() - 24 * 3600 * 1000);
    const hourlyReadings = readings.filter(r => new Date(r.timestamp) >= last24h);
    const hourlyMap = {};
    for (let h = 0; h < 24; h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      hourlyMap[label] = { hour: label, power: 0, count: 0, energy: 0 };
    }

    hourlyReadings.forEach(r => {
      const h = new Date(r.timestamp).getHours();
      const label = `${h.toString().padStart(2, '0')}:00`;
      if (hourlyMap[label]) {
        hourlyMap[label].power += r.power;
        hourlyMap[label].count++;
      }
    });

    const hourlyData = Object.values(hourlyMap).map(item => {
      const p = item.count > 0 ? Math.round(item.power / item.count) : 0;
      return {
        hour: item.hour,
        power: p,
        energy: +(p / 1000).toFixed(3),
      };
    });

    // 3. Daily Breakdown
    const dayMap = {};
    readings.forEach(r => {
      const dayKey = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dayMap[dayKey]) {
        dayMap[dayKey] = { date: dayKey, totalPower: 0, count: 0, energy: 0 };
      }
      dayMap[dayKey].totalPower += r.power;
      dayMap[dayKey].count++;
    });

    const dailyData = Object.values(dayMap).map(d => {
      const avg = d.totalPower / d.count;
      const energy = +(avg * 24 / 1000).toFixed(2);
      return {
        date: d.date,
        avgPower: Math.round(avg),
        energy,
        cost: +(energy * tariff).toFixed(2),
      };
    });

    // 4. Appliance-Wise Consumption
    const appliances = await Appliance.find();
    const applianceBreakdown = appliances.map(app => ({
      name: app.name,
      type: app.type,
      energy: +app.totalEnergy.toFixed(2),
      cost: +app.totalCost.toFixed(2),
      runtimeHours: +app.runtimeHours.toFixed(1),
      powerRating: app.powerRating,
      percentage: totalEnergy > 0 ? +((app.totalEnergy / totalEnergy) * 100).toFixed(1) : 25,
    }));

    res.json({
      success: true,
      data: {
        summary: {
          minConsumption: minPower,
          maxConsumption: maxPower,
          averageConsumption: avgPower,
          totalConsumption: totalEnergy,
          estimatedCost,
          peakConsumptionTime: peakTimestamp
            ? new Date(peakTimestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
            : 'N/A',
        },
        tariff,
        hourly: hourlyData,
        daily: dailyData,
        applianceBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAnalytics };
