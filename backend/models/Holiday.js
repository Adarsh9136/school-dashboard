const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const HolidaySchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD
  name: { type: String, required: true },
  type: { type: String, default: 'school' }, // school, public, weekend
  createdBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

module.exports = mongoose.model('Holiday', HolidaySchema);
