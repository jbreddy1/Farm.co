const express = require('express');
const router = express.Router();
const { translateText, translateToEnglish } = require('../utils/translate');
const ChatHistory = require('../models/ChatHistory');
const axios = require('axios');

const LOCAL_LLM_API_URL = 'http://localhost:5000/chat';

router.post('/', async (req, res) => {
  const { userId, message, language } = req.body;

  try {
    // Translate user message to English for the local LLM
    const translatedToEnglish = await translateToEnglish(message, language);

    // Send to local Llama3 model
    const response = await axios.post(LOCAL_LLM_API_URL, {
      message: translatedToEnglish
    });

    const englishReply = response.data.response;

    // Translate response back to user's language
    const translatedBack = await translateText(englishReply, language || 'en');

    // Save chat to DB
    await ChatHistory.create({
      userId,
      question: message,
      answer: translatedBack
    });

    res.json({ translated_response: translatedBack, original_question: message });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chatbot failed. Please ensure the local Llama model server is running and try again.' });
  }
});

module.exports = router;