const EnergyReading = require('../models/EnergyReading');
const { checkAndGenerateAlerts } = require('../services/alertService');

// @desc    Get latest real-time energy reading
// @route   GET /api/energy
const getLiveEnergy = async (req, res) => {
  try {
    const reading = await EnergyReading.findOne().sort({ timestamp: -1 });
    res.json({ success: true, data: reading });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create / Ingest a new energy reading
// @route   POST /api/energy
const postEnergyReading = async (req, res) => {
  try {
    const { deviceId, voltage, current, power, energy, frequency, powerFactor, temperature, mode, activeAppliances } = req.body;

    if (voltage === undefined || current === undefined || power === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required electrical metrics (voltage, current, power)' });
    }

    const newReading = await EnergyReading.create({
      deviceId: deviceId || 'ESP32-PZEM-01',
      voltage: +voltage,
      current: +current,
      power: +power,
      energy: energy !== undefined ? +energy : 0,
      frequency: frequency ? +frequency : 50.0,
      powerFactor: powerFactor ? +powerFactor : 0.95,
      temperature: temperature !== undefined ? +temperature : 28.0,
      mode: mode || 'HARDWARE',
      activeAppliances: activeAppliances || [],
      timestamp: new Date(),
    });

    // Check alerts
    await checkAndGenerateAlerts(newReading);

    res.status(201).json({ success: true, data: newReading });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get historical readings with search, pagination, date filters, sorting & CSV export
// @route   GET /api/energy/history
const getEnergyHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      mode,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      exportFormat,
    } = req.query;

    const query = {};

    if (mode && mode !== 'ALL') {
      query.mode = mode;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { deviceId: { $regex: search, $options: 'i' } },
        { activeAppliances: { $regex: search, $options: 'i' } },
      ];
    }

    // If CSV export requested
    if (exportFormat === 'csv') {
      const readings = await EnergyReading.find(query).sort({ timestamp: -1 }).limit(1000).lean();
      
      let csv = 'Timestamp,Device,Mode,Voltage(V),Current(A),Power(W),Energy(kWh),Temperature(C),ActiveAppliances\n';
      readings.forEach(r => {
        const ts = new Date(r.timestamp).toISOString();
        const apps = (r.activeAppliances || []).join('; ');
        csv += `"${ts}","${r.deviceId}","${r.mode}",${r.voltage},${r.current},${r.power},${r.energy},${r.temperature},"${apps}"\n`;
      });

      res.header('Content-Type', 'text/csv');
      res.attachment(`energy-history-${Date.now()}.csv`);
      return res.send(csv);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [total, readings] = await Promise.all([
      EnergyReading.countDocuments(query),
      EnergyReading.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
    ]);

    res.json({
      success: true,
      data: readings,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLiveEnergy,
  postEnergyReading,
  getEnergyHistory,
};
