const express = require('express');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { isNews } = req.query;
  const filter = {};
  if (isNews !== undefined) filter.isNews = isNews === 'true';
  const items = await Announcement.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(items);
});

// public news feed for landing page
router.get('/public/news', async (req, res) => {
  const items = await Announcement.find({ isNews: true }).sort({ createdAt: -1 }).limit(20);
  res.json(items);
});

router.post('/', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { title, body, imageUrl, audience, isNews } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'title, body required' });
  const a = await Announcement.create({
    title,
    body,
    imageUrl: imageUrl || '',
    audience: audience || 'all',
    isNews: !!isNews,
    postedBy: req.user._id,
    postedByName: req.user.fullName,
  });
  // Fan-out notifications
  const audMap = { all: {}, teachers: { role: 'teacher' }, parents: { role: 'parent' }, students: { role: 'student' } };
  const q = audMap[a.audience] || {};
  const users = await User.find({ ...q, active: true, _id: { $ne: req.user._id } }).select('_id');
  await Promise.all(users.map(u => Notification.create({
    userId: u._id,
    title: a.isNews ? 'School News' : 'Announcement',
    message: title,
    type: 'announcement',
    link: '/dashboard/announcements',
  })));
  await writeAudit({ action: 'create', entity: 'announcement', entityId: a._id, after: a.toObject(), user: req.user, ip: req.ip });
  res.status(201).json(a);
});

router.delete('/:id', auth, requireRole('principal', 'admin'), async (req, res) => {
  const a = await Announcement.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  await Announcement.deleteOne({ _id: a._id });
  await writeAudit({ action: 'delete', entity: 'announcement', entityId: a._id, before: a.toObject(), user: req.user, ip: req.ip });
  res.json({ ok: true });
});

module.exports = router;
