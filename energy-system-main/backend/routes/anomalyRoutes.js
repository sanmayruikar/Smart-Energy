const express = require('express');
const router = express.Router();
const { getAnomalies, resolveAnomaly, scanAnomalies } = require('../controllers/anomalyController');

router.get('/', getAnomalies);
router.put('/:id/resolve', resolveAnomaly);
router.post('/scan', scanAnomalies);

module.exports = router;
