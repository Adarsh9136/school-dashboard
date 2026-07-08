const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, signToken } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user);
  await writeAudit({ action: 'login', entity: 'user', entityId: user._id, user, ip: req.ip });
  res.json({ token, user: user.toPublic() });
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

router.post('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'New password must be 6+ chars' });
  const ok = await bcrypt.compare(oldPassword || '', req.user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Old password incorrect' });
  req.user.passwordHash = await bcrypt.hash(newPassword, 10);
  req.user.updatedAt = new Date();
  await req.user.save();
  res.json({ ok: true });
});

module.exports = router;
