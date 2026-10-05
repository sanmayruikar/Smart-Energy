const Appliance = require('../models/Appliance');
const Settings = require('../models/Settings');

let ioInstance = null;
const setApplianceIO = (io) => {
  ioInstance = io;
};

// @desc    Get all appliances
// @route   GET /api/appliances
const getAppliances = async (req, res) => {
  try {
    const appliances = await Appliance.find().sort({ createdAt: 1 });
    res.json({ success: true, data: appliances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new appliance
// @route   POST /api/appliances
const addAppliance = async (req, res) => {
  try {
    const { name, type, relayPin, powerRating } = req.body;
    if (!name || !powerRating) {
      return res.status(400).json({ success: false, message: 'Please provide appliance name and power rating' });
    }

    const appliance = await Appliance.create({
      name,
      type: type || 'other',
      relayPin: relayPin || 0,
      powerRating: +powerRating,
      status: 'OFF',
      currentPower: 0,
      totalEnergy: 0,
      runtimeHours: 0,
      totalCost: 0,
    });

    if (ioInstance) {
      ioInstance.emit('appliance_added', appliance);
    }

    res.status(201).json({ success: true, data: appliance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appliance metadata
// @route   PUT /api/appliances/:id
const updateAppliance = async (req, res) => {
  try {
    const appliance = await Appliance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!appliance) {
      return res.status(404).json({ success: false, message: 'Appliance not found' });
    }

    if (ioInstance) {
      ioInstance.emit('appliance_updated', appliance);
    }

    res.json({ success: true, data: appliance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an appliance
// @route   DELETE /api/appliances/:id
const deleteAppliance = async (req, res) => {
  try {
    const appliance = await Appliance.findByIdAndDelete(req.params.id);
    if (!appliance) {
      return res.status(404).json({ success: false, message: 'Appliance not found' });
    }

    if (ioInstance) {
      ioInstance.emit('appliance_deleted', req.params.id);
    }

    res.json({ success: true, message: 'Appliance removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Control appliance (Toggle ON/OFF)
// @route   POST /api/appliances/:id/control
const controlAppliance = async (req, res) => {
  try {
    const { status } = req.body;
    const appliance = await Appliance.findById(req.params.id);

    if (!appliance) {
      return res.status(404).json({ success: false, message: 'Appliance not found' });
    }

    const newStatus = status ? status.toUpperCase() : (appliance.status === 'ON' ? 'OFF' : 'ON');
    appliance.status = newStatus;
    appliance.lastSwitchedAt = new Date();

    if (newStatus === 'ON') {
      appliance.currentPower = appliance.powerRating;
    } else {
      appliance.currentPower = 0;
    }

    await appliance.save();

    // Broadcast relay control command to hardware / dashboard
    if (ioInstance) {
      ioInstance.emit('appliance_status_change', {
        id: appliance._id,
        name: appliance.name,
        relayPin: appliance.relayPin,
        status: appliance.status,
        currentPower: appliance.currentPower,
      });
    }

    res.json({
      success: true,
      message: `${appliance.name} switched ${appliance.status}`,
      data: appliance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  setApplianceIO,
  getAppliances,
  addAppliance,
  updateAppliance,
  deleteAppliance,
  controlAppliance,
};
