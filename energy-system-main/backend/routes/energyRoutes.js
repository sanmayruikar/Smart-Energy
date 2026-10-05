const express = require('express');
const router = express.Router();
const { getLiveEnergy, postEnergyReading, getEnergyHistory } = require('../controllers/energyController');

router.get('/', getLiveEnergy);
router.post('/', postEnergyReading);
router.get('/history', getEnergyHistory);

module.exports = router;
