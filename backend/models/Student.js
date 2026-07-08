const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const StudentSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  prn: { type: String, required: true, unique: true, index: true },
  classId: { type: String, required: true, index: true }, // e.g. 76546787_VII_A
  className: { type: String, required: true }, // e.g. VII
  section: { type: String, required: true }, // e.g. A
  fullName: { type: String, required: true },
  dob: { type: String, default: '' },
  gender: { type: String, default: '' },
  parentUserId: { type: String, default: '', index: true },
  parentName: { type: String, default: '' },
  parentPhone: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  bloodGroup: { type: String, default: '' },
  address: { type: String, default: '' },
  admissionYear: { type: String, default: '' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

module.exports = mongoose.model('Student', StudentSchema);
