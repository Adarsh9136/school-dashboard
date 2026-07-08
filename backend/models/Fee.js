const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const FeeSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  classId: { type: String, default: '' },
  month: { type: String, required: true }, // e.g. 2026-02
  status: { type: String, enum: ['paid', 'pending'], default: 'pending', index: true },
  dueDate: { type: String, required: true }, // YYYY-MM-DD
  paidOn: { type: String, default: '' },
  paymentMode: { type: String, default: '' }, // offline/online
  receivedBy: { type: String, default: '' },
  note: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

FeeSchema.index({ studentId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Fee', FeeSchema);
