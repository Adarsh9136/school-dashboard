const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const LeaveSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  teacherId: { type: String, required: true, index: true },
  teacherName: { type: String, required: true },
  fromDate: { type: String, required: true }, // YYYY-MM-DD
  toDate: { type: String, required: true },
  reason: { type: String, required: true },
  leaveType: { type: String, default: 'casual' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

module.exports = mongoose.model('Leave', LeaveSchema);
