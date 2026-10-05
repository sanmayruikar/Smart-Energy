const express = require('express');
const router = express.Router();
const { receiveHardwareData } = require('../controllers/esp32Controller');

router.post('/data', receiveHardwareData);

module.exports = router;
