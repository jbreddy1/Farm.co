const express = require('express');
const router = express.Router();
const User = require('../models/User');
const axios = require('axios');

router.post('/register', async (req, res) => {
  try {
    const { phone, name, language, role, pin } = req.body;
    let user = await User.findOne({ phone });

    if (user) {
      // Check pin
      if (user.pin !== pin) {
        return res.status(401).json({ error: 'Invalid PIN' });
      }
      // Only update fields if provided (for profile update, not login)
      if (name) user.name = name;
      if (language) user.language = language;
      if (role && !user.role) user.role = role; // Only set role if not set
      await user.save();
      const userObj = user.toObject();
      delete userObj.pin;
      return res.json(userObj);
    }

    // If user does not exist, require role and pin
    if (!role || !pin) {
      return res.status(400).json({ error: 'Role and PIN are required for first time registration' });
    }
    user = new User({ phone, name, language, role, pin });
    await user.save();
    const userObj = user.toObject();
    delete userObj.pin;
    res.status(201).json(userObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

// Check if user exists by phone
router.get('/check', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.json({ exists: false });
  const user = await User.findOne({ phone });
  res.json({ exists: !!user });
});

module.exports = router;