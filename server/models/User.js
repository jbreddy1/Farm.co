const mongoose = require('mongoose');

// User schema matches frontend registration fields: phone, name, pin, role, language
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  pin: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'customer'], required: true },
  language: { type: String, default: 'en' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);