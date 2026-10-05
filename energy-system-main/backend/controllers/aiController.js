const { generateEnergyResponse } = require('../services/aiService');

// @desc    Process user chat prompt with context-aware energy AI assistant
// @route   POST /api/ai/chat
const chatWithAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a message prompt' });
    }

    const response = await generateEnergyResponse(message);

    res.json({
      success: true,
      data: {
        prompt: message,
        response: response.message,
        metadata: response.data || {},
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('[AIController] Error processing chat:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { chatWithAssistant };
