const express = require('express');
const Teacher = require('../models/Teacher');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  const filter = search ? { fullName: new RegExp(search, 'i') } : {};
  const teachers = await Teacher.find(filter).sort({ fullName: 1 }).limit(500);
  res.json(teachers);
});

router.get('/:id', auth, async (req, res) => {
  const t = await Teacher.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});

router.post('/', auth, requireRole('principal', 'admin'), async (req, res) => {
  const b = req.body || {};
  if (!b.employeeId || !b.fullName) return res.status(400).json({ error: 'employeeId, fullName required' });
  const t = await Teacher.create(b);
  await writeAudit({ action: 'create', entity: 'teacher', entityId: t._id, after: t.toObject(), user: req.user, ip: req.ip });
  res.status(201).json(t);
});

router.patch('/:id', auth, requireRole('principal', 'admin'), async (req, res) => {
  const t = await Teacher.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  const before = t.toObject();
  Object.assign(t, req.body || {});
  await t.save();
  await writeAudit({ action: 'update', entity: 'teacher', entityId: t._id, before, after: t.toObject(), user: req.user, ip: req.ip });
  res.json(t);
});

router.delete('/:id', auth, requireRole('principal', 'admin'), async (req, res) => {
  const t = await Teacher.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  t.active = false;
  await t.save();
  await writeAudit({ action: 'deactivate', entity: 'teacher', entityId: t._id, user: req.user, ip: req.ip });
  res.json({ ok: true });
});

module.exports = router;
