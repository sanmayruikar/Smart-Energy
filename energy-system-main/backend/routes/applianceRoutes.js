const express = require('express');
const router = express.Router();
const {
  getAppliances,
  addAppliance,
  updateAppliance,
  deleteAppliance,
  controlAppliance,
} = require('../controllers/applianceController');

router.get('/', getAppliances);
router.post('/', addAppliance);
router.put('/:id', updateAppliance);
router.delete('/:id', deleteAppliance);
router.post('/:id/control', controlAppliance);

module.exports = router;
