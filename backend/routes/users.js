const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

// List users (Principal/Admin)
router.get('/', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json(users.map(u => u.toPublic()));
});

// Create user (Principal generates credentials for teachers/parents/students/accountants)
router.post('/', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { username, password, role, fullName, email, phone, linkedRef, avatarUrl } = req.body || {};
  if (!username || !password || !role || !fullName) {
    return res.status(400).json({ error: 'username, password, role, fullName required' });
  }
  const exists = await User.findOne({ username: username.toLowerCase().trim() });
  if (exists) return res.status(409).json({ error: 'Username already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username: username.toLowerCase().trim(),
    passwordHash,
    role,
    fullName,
    email: email || '',
    phone: phone || '',
    linkedRef: linkedRef || '',
    avatarUrl: avatarUrl || '',
  });
  await writeAudit({ action: 'create', entity: 'user', entityId: user._id, after: user.toPublic(), user: req.user, ip: req.ip });
  res.status(201).json(user.toPublic());
});

router.patch('/:id', auth, requireRole('principal', 'admin'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const before = user.toPublic();
  const { fullName, email, phone, active, avatarUrl } = req.body || {};
  if (fullName !== undefined) user.fullName = fullName;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (active !== undefined) user.active = active;
  user.updatedAt = new Date();
  await user.save();
  await writeAudit({ action: 'update', entity: 'user', entityId: user._id, before, after: user.toPublic(), user: req.user, ip: req.ip });
  res.json(user.toPublic());
});

router.post('/:id/reset-password', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: '6+ chars required' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.updatedAt = new Date();
  await user.save();
  await writeAudit({ action: 'reset_password', entity: 'user', entityId: user._id, user: req.user, ip: req.ip });
  res.json({ ok: true });
});

module.exports = router;
