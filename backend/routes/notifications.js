const express = require('express');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const items = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(200);
  res.json(items);
});

router.get('/unread-count', auth, async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user._id, read: false });
  res.json({ count });
});

router.post('/:id/read', auth, async (req, res) => {
  const n = await Notification.findById(req.params.id);
  if (!n || n.userId !== req.user._id) return res.status(404).json({ error: 'Not found' });
  n.read = true;
  await n.save();
  res.json(n);
});

router.post('/read-all', auth, async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
});

module.exports = router;
