require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const Reminder = require('./models/Reminder');
const User = require('./models/User');
const { sendReminderSMS } = require('./utils/fast2sms');
const path = require('path');

// Import routes
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const chatRoutes = require('./routes/chatRoutes');
const multilingualChatRoutes = require('./routes/multilingualChat');
const weatherRoutes = require('./routes/weatherRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const speechToTextRoutes = require('./routes/speechToText');
const soilAnalysisRoutes = require('./routes/soilAnalysisRoutes');
const diseaseDetectionRoutes = require('./routes/diseaseDetectionRoutes');
const farmerProductRoutes = require('./routes/farmerProductRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/multilingual-chat', multilingualChatRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/speech-to-text', speechToTextRoutes);
app.use('/api/soil-analysis', soilAnalysisRoutes);
app.use('/api/disease-detection', diseaseDetectionRoutes);
app.use('/api/farmer-products', farmerProductRoutes);

// Add missing routes
app.use('/api/tractor', require('./routes/tractorRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));

// Serve uploaded files statically
app.use('/uploads', express.static(__dirname + '/uploads'));

app.use('/audio', express.static(__dirname + '/public/audio'));

app.use('/uploads/products', express.static(path.join(__dirname, 'uploads/products')));

app.get('/', (req, res) => {
  res.send('Farmer Assistant Backend Running');
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({
    status: 'OK',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Cron job: runs every minute
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const dueReminders = await Reminder.find({ date: { $lte: now }, isSent: { $ne: true } });
  console.log(`[CRON] Checking for due reminders at ${now.toISOString()}. Found: ${dueReminders.length}`);
  
  for (const reminder of dueReminders) {
    const user = await User.findById(reminder.userId);
    if (user && user.phone) {
      console.log(`[CRON] Sending SMS to ${user.phone} for reminder: ${reminder.message}`);
      try {
        await sendReminderSMS(user.phone, user.name, reminder.message, reminder.date);
        
        // Mark as sent
        reminder.isSent = true;
        await reminder.save();
        console.log(`[CRON] SMS sent and reminder marked as sent for reminder ID: ${reminder._id}`);
      } catch (err) {
        console.error(`[CRON] Failed to send SMS for reminder ID: ${reminder._id}`, err);
      }
    } else {
      console.log(`[CRON] User not found or missing phone number for reminder: ${reminder._id}`);
    }
  }
});

// MongoDB connection - Update with your MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dnaveed2005:%3CL0VzYwvUmMepr9nT%3E@clusterdemo.gdvsjxl.mongodb.net/project demo';

console.log('🔗 Attempting to connect to MongoDB Atlas...');
console.log('📡 Connection string:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Successfully connected to MongoDB Atlas!');
  console.log('🗄️  Database:', mongoose.connection.name);
  console.log('🌐 Host:', mongoose.connection.host);
  console.log('🔌 Port:', mongoose.connection.port);
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 API base URL: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('💡 Troubleshooting tips:');
  console.log('   - Check your MONGODB_URI in .env file');
  console.log('   - Verify username and password');
  console.log('   - Ensure network access is configured in MongoDB Atlas');
  console.log('   - Check if your cluster is running');
});