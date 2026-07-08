const express = require('express');
const Student = require('../models/Student');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

// GET list — Principal/Admin/Teacher see all; Parent only children
router.get('/', auth, async (req, res) => {
  const { classId, className, section, search } = req.query;
  let filter = {};
  if (req.user.role === 'parent') {
    filter.parentUserId = req.user._id;
  }
  if (classId) filter.classId = classId;
  if (className) filter.className = className;
  if (section) filter.section = section;
  if (search) filter.$or = [
    { fullName: new RegExp(search, 'i') },
    { prn: new RegExp(search, 'i') },
  ];
  const students = await Student.find(filter).sort({ className: 1, section: 1, fullName: 1 }).limit(1000);
  res.json(students);
});

router.get('/:id', auth, async (req, res) => {
  const s = await Student.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'parent' && s.parentUserId !== req.user._id) return res.status(403).json({ error: 'Forbidden' });
  res.json(s);
});

router.post('/', auth, requireRole('principal', 'admin'), async (req, res) => {
  const body = req.body || {};
  if (!body.prn || !body.fullName || !body.className || !body.section) {
    return res.status(400).json({ error: 'prn, fullName, className, section required' });
  }
  const classId = `${body.prn}_${body.className}_${body.section}`;
  const s = await Student.create({ ...body, classId });
  await writeAudit({ action: 'create', entity: 'student', entityId: s._id, after: s.toObject(), user: req.user, ip: req.ip });
  res.status(201).json(s);
});

router.patch('/:id', auth, requireRole('principal', 'admin'), async (req, res) => {
  const s = await Student.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  const before = s.toObject();
  Object.assign(s, req.body || {});
  if (req.body.className || req.body.section) {
    s.classId = `${s.prn}_${s.className}_${s.section}`;
  }
  s.updatedAt = new Date();
  await s.save();
  await writeAudit({ action: 'update', entity: 'student', entityId: s._id, before, after: s.toObject(), user: req.user, ip: req.ip });
  res.json(s);
});

router.post('/:id/promote', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { newClass, newSection } = req.body || {};
  if (!newClass || !newSection) return res.status(400).json({ error: 'newClass, newSection required' });
  const s = await Student.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  const before = s.toObject();
  s.className = newClass;
  s.section = newSection;
  s.classId = `${s.prn}_${newClass}_${newSection}`;
  s.updatedAt = new Date();
  await s.save();
  await writeAudit({ action: 'promote', entity: 'student', entityId: s._id, before, after: s.toObject(), user: req.user, ip: req.ip, reason: 'Promotion' });
  res.json(s);
});

router.delete('/:id', auth, requireRole('principal', 'admin'), async (req, res) => {
  const s = await Student.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  s.active = false;
  await s.save();
  await writeAudit({ action: 'deactivate', entity: 'student', entityId: s._id, user: req.user, ip: req.ip });
  res.json({ ok: true });
});

module.exports = router;
