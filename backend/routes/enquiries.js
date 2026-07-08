const express = require('express');
const Enquiry = require('../models/Enquiry');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

// public submission from website
router.post('/public', async (req, res) => {
  const { childName, parentName, email, phone, classAppliedFor, currentSchool, message } = req.body || {};
  if (!childName || !parentName || !email || !phone || !classAppliedFor) {
    return res.status(400).json({ error: 'childName, parentName, email, phone, classAppliedFor required' });
  }
  const e = await Enquiry.create({ childName, parentName, email, phone, classAppliedFor, currentSchool: currentSchool || '', message: message || '' });
  res.status(201).json({ ok: true, id: e._id });
});

router.get('/', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.$or = [
    { childName: new RegExp(search, 'i') },
    { parentName: new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') },
    { phone: new RegExp(search, 'i') },
  ];
  const items = await Enquiry.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json(items);
});

router.patch('/:id', auth, requireRole('principal', 'admin'), async (req, res) => {
  const e = await Enquiry.findById(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  const before = e.toObject();
  Object.assign(e, req.body || {});
  await e.save();
  await writeAudit({ action: 'update', entity: 'enquiry', entityId: e._id, before, after: e.toObject(), user: req.user, ip: req.ip });
  res.json(e);
});

module.exports = router;
