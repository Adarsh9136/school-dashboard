const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TeacherSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  employeeId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, default: '', index: true },
  fullName: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  subjects: { type: [String], default: [] },
  classes: { type: [String], default: [] }, // classNames or classIds
  avatarUrl: { type: String, default: '' },
  qualification: { type: String, default: '' },
  joiningDate: { type: String, default: '' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

module.exports = mongoose.model('Teacher', TeacherSchema);
