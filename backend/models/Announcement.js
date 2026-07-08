const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const AnnouncementSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  title: { type: String, required: true },
  body: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  audience: { type: String, default: 'all' }, // all, teachers, parents, students
  postedBy: { type: String, required: true },
  postedByName: { type: String, default: '' },
  isNews: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
}, { _id: false });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
