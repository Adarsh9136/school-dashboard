const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const EnquirySchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  childName: { type: String, required: true },
  parentName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  classAppliedFor: { type: String, required: true },
  currentSchool: { type: String, default: '' },
  message: { type: String, default: '' },
  status: { type: String, enum: ['new', 'contacted', 'shortlisted', 'admitted', 'rejected'], default: 'new', index: true },
  createdAt: { type: Date, default: Date.now, index: true },
}, { _id: false });

module.exports = mongoose.model('Enquiry', EnquirySchema);
