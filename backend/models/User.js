const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ROLES = ['admin', 'principal', 'teacher', 'parent', 'accountant', 'scanner'];

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ROLES, required: true, index: true },
  fullName: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  active: { type: Boolean, default: true },
  linkedRef: { type: String, default: '' }, // studentId, teacherId, parentId ref
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

UserSchema.methods.toPublic = function () {
  const o = this.toObject();
  delete o.passwordHash;
  o.id = o._id;
  delete o._id;
  return o;
};

module.exports = mongoose.model('User', UserSchema);
module.exports.ROLES = ROLES;
