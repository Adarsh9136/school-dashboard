const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// A timetable slot for a class/section
const TimetableSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  className: { type: String, required: true, index: true }, // VII
  section: { type: String, required: true, index: true }, // A
  day: { type: String, required: true, index: true }, // Monday..Saturday
  period: { type: Number, required: true }, // 1..7
  subject: { type: String, required: true },
  teacherId: { type: String, default: '' },
  teacherName: { type: String, default: '' },
  isSubstitute: { type: Boolean, default: false },
  originalTeacherId: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

TimetableSchema.index({ className: 1, section: 1, day: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', TimetableSchema);
