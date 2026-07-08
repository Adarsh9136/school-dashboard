const express = require('express');
const Holiday = require('../models/Holiday');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { year } = req.query;
  const filter = {};
  if (year) filter.date = new RegExp(`^${year}-`);
  const items = await Holiday.find(filter).sort({ date: 1 }).limit(1000);
  res.json(items);
});

router.post('/', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { date, name, type } = req.body || {};
  if (!date || !name) return res.status(400).json({ error: 'date, name required' });
  const existing = await Holiday.findOne({ date });
  if (existing) return res.status(409).json({ error: 'Holiday already exists on this date' });
  const h = await Holiday.create({ date, name, type: type || 'school', createdBy: req.user._id });
  await writeAudit({ action: 'create', entity: 'holiday', entityId: h._id, after: h.toObject(), user: req.user, ip: req.ip });
  res.status(201).json(h);
});

router.delete('/:id', auth, requireRole('principal', 'admin'), async (req, res) => {
  const h = await Holiday.findById(req.params.id);
  if (!h) return res.status(404).json({ error: 'Not found' });
  const before = h.toObject();
  await Holiday.deleteOne({ _id: h._id });
  await writeAudit({ action: 'delete', entity: 'holiday', entityId: h._id, before, user: req.user, ip: req.ip });
  res.json({ ok: true });
});

module.exports = router;
