const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const NotificationSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' }, // info, success, warning, alert, fee, leave, announcement, timetable
  read: { type: Boolean, default: false, index: true },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, index: true },
}, { _id: false });

module.exports = mongoose.model('Notification', NotificationSchema);
