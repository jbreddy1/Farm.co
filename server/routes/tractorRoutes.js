const express = require('express');
const router = express.Router();
const TractorLog = require('../models/TractorLog');

// Add tractor log
router.post('/add', async (req, res) => {
  const { userId, usageHours, fuelUsed, maintenanceNote } = req.body;
  try {
    const tractorLog = await TractorLog.create({ 
      userId, 
      usageHours, 
      fuelUsed, 
      maintenanceNote 
    });
    res.json(tractorLog);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get tractor logs for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const logs = await TractorLog.find({ userId: req.params.userId })
      .sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router; 