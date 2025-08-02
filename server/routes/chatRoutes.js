const express = require('express');
const router = express.Router();
const ChatHistory = require('../models/ChatHistory');

router.post('/chat', async (req, res) => {
  const { userId, question, answer } = req.body;
  try {
    const chat = await ChatHistory.create({ userId, question, answer });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;