const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const AttendanceSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  type: { type: String, enum: ['student', 'teacher'], required: true, index: true },
  refId: { type: String, required: true, index: true }, // studentId or teacherId
  classId: { type: String, default: '', index: true },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  status: { type: String, enum: ['present', 'absent', 'late', 'leave'], required: true },
  remarks: { type: String, default: '' },
  period: { type: Number, default: 0 }, // 0 = full day
  markedBy: { type: String, default: '' },
  markedByRole: { type: String, default: '' },
  markedAt: { type: Date, default: Date.now },
  source: { type: String, default: 'manual' }, // manual, fingerprint
}, { _id: false });

AttendanceSchema.index({ type: 1, refId: 1, date: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
