const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const RemarkSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  studentId: { type: String, default: '', index: true },
  classId: { type: String, default: '', index: true },
  scope: { type: String, enum: ['individual', 'multiple', 'class'], default: 'individual' },
  studentIds: { type: [String], default: [] },
  period: { type: Number, default: 0 },
  date: { type: String, required: true }, // YYYY-MM-DD
  remark: { type: String, required: true },
  teacherId: { type: String, required: true },
  teacherName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

module.exports = mongoose.model('Remark', RemarkSchema);
