const express = require('express');
const router = express.Router();
const { getAlerts, markAlertAsRead, markAllAlertsAsRead } = require('../controllers/alertController');

router.get('/', getAlerts);
router.put('/:id/read', markAlertAsRead);
router.put('/read-all', markAllAlertsAsRead);

module.exports = router;
