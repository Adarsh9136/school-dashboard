const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ReportCardSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  classId: { type: String, default: '' },
  term: { type: String, required: true }, // e.g. Term 1 2025-26
  marks: { type: mongoose.Schema.Types.Mixed, default: {} }, // { subject: { marks, grade } }
  overallGrade: { type: String, default: '' },
  overallPercent: { type: Number, default: 0 },
  remark: { type: String, default: '' },
  uploadedBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

module.exports = mongoose.model('ReportCard', ReportCardSchema);
