const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const cropDatabase = require('../utils/cropDatabase');
const { sendReminderSMS, sendCropScheduleSMS, sendSMS } = require('../utils/fast2sms');

// Test SMS endpoint for debugging
router.post('/test-sms', async (req, res) => {
  const { mobileNumber, message } = req.body;
  
  if (!mobileNumber || !message) {
    return res.status(400).json({ error: 'Mobile number and message are required' });
  }

  try {
    const result = await sendSMS(mobileNumber, message);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Test SMS failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all available crops
router.get('/crops', (req, res) => {
  const crops = Object.keys(cropDatabase).map(key => ({
    id: key,
    name: cropDatabase[key].name
  }));
  res.json(crops);
});

// Get crop information
router.get('/crop/:cropType', (req, res) => {
  const cropType = req.params.cropType;
  const crop = cropDatabase[cropType];
  if (!crop) {
    return res.status(404).json({ error: 'Crop not found' });
  }
  res.json(crop);
});

// Create automatic reminders for a crop
router.post('/crop-schedule', async (req, res) => {
  const { userId, cropType, plantingDate } = req.body;
  
  try {
    const crop = cropDatabase[cropType];
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    const plantingDateObj = new Date(plantingDate);
    const reminders = [];

    // Create planting reminder (as a plain object, not saved yet)
    const plantingReminder = {
      userId,
      message: `Plant ${crop.name} today`,
      date: plantingDateObj,
      cropType,
      reminderType: 'planting',
      frequency: 'once'
    };
    reminders.push(plantingReminder);

    // Create fertilizer reminders
    crop.fertilizerSchedule.forEach((schedule, index) => {
      const daysToAdd = parseInt(schedule.timing.match(/\d+/)[0]);
      const reminderDate = new Date(plantingDateObj);
      reminderDate.setDate(reminderDate.getDate() + daysToAdd);
      
      const reminder = {
        userId,
        message: `${crop.name} - ${schedule.stage}: Apply ${schedule.type} (${schedule.amount})`,
        date: reminderDate,
        cropType,
        reminderType: 'fertilizer',
        frequency: 'once'
      };
      reminders.push(reminder);
    });

    // Create watering reminders (weekly for the first month)
    for (let week = 1; week <= 4; week++) {
      const wateringDate = new Date(plantingDateObj);
      wateringDate.setDate(wateringDate.getDate() + (week * 7));
      
      const reminder = {
        userId,
        message: `${crop.name} - Weekly watering schedule check`,
        date: wateringDate,
        cropType,
        reminderType: 'watering',
        frequency: 'weekly'
      };
      reminders.push(reminder);
    }

    // Save all reminders at once
    const savedReminders = await Reminder.insertMany(reminders);

    // Send SMS notification about crop schedule creation
    try {
      const user = await User.findById(userId);
      if (user && user.phone) {
        await sendCropScheduleSMS(user.phone, user.name, crop.name, savedReminders.length);
        console.log(`SMS notification sent for crop schedule creation to ${user.phone}`);
      }
    } catch (smsError) {
      console.error('Failed to send SMS notification for crop schedule:', smsError.message);
      // Don't fail the entire request if SMS fails
    }

    res.json({
      message: `Created ${savedReminders.length} reminders for ${crop.name}`,
      reminders: savedReminders
    });

  } catch (error) {
    console.error('Error creating crop schedule:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Add reminder
router.post('/add', async (req, res) => {
  const { userId, message, date } = req.body;
  try {
    const reminder = await Reminder.create({ 
      userId, 
      message, 
      date: new Date(date) 
    });
    
    // Fetch user
    const user = await User.findById(userId);
    if (user && user.phone) {
      try {
        // Send SMS reminder
        await sendReminderSMS(user.phone, user.name, reminder.message, reminder.date);
        
        // Mark as sent
        reminder.isSent = true;
        await reminder.save();
        
        console.log(`SMS reminder sent to ${user.phone} for reminder: ${reminder.message}`);
      } catch (smsError) {
        console.error('Failed to send SMS reminder:', smsError.message);
        // Don't fail the entire request if SMS fails
      }
    }
    
    res.json(reminder);
  } catch (error) {
    console.error('Error adding reminder:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get reminders for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.params.userId })
      .sort({ date: 1 });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Mark reminder as sent
router.put('/:id/sent', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      { isSent: true },
      { new: true }
    );
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router; 