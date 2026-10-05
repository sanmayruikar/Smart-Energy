const express = require('express');
const router = express.Router();
const { chatWithAssistant } = require('../controllers/aiController');

router.post('/chat', chatWithAssistant);

module.exports = router;
