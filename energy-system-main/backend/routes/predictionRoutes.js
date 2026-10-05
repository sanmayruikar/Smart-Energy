const express = require('express');
const router = express.Router();
const { getPredictionsHandler, triggerPredictionHandler } = require('../controllers/predictionController');

router.get('/', getPredictionsHandler);
router.post('/', triggerPredictionHandler);

module.exports = router;
