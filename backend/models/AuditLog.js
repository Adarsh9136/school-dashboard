const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const AuditLogSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  action: { type: String, required: true, index: true },
  entity: { type: String, required: true, index: true },
  entityId: { type: String, default: '', index: true },
  before: { type: mongoose.Schema.Types.Mixed, default: null },
  after: { type: mongoose.Schema.Types.Mixed, default: null },
  userId: { type: String, default: '' },
  userName: { type: String, default: '' },
  userRole: { type: String, default: '' },
  ip: { type: String, default: '' },
  reason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, index: true },
}, { _id: false });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
