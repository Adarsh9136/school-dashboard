const express = require('express');
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  const filter = search ? { fullName: new RegExp(search, 'i') } : {};
  const teachers = await Teacher.find(filter).sort({ fullName: 1 }).limit(500);
  res.json(teachers);
});

// Get logged-in teacher's own record + assigned classes (derived from Timetable)
router.get('/me/classes', auth, requireRole('teacher'), async (req, res) => {
  const teacherId = req.user.linkedRef || req.user._id;
  const slots = await Timetable.find({ teacherId });
  const set = new Set();
  slots.forEach(s => set.add(`${s.className}|${s.section}`));
  const classes = Array.from(set).map(k => {
    const [className, section] = k.split('|');
    return { className, section };
  });
  res.json({ teacherId, classes });
});

router.get('/:id', auth, async (req, res) => {
  const t = await Teacher.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});

// Legacy create — teacher record only
router.post('/', auth, requireRole('principal', 'admin'), async (req, res) => {
  const b = req.body || {};
  if (!b.employeeId || !b.fullName) return res.status(400).json({ error: 'employeeId, fullName required' });
  const t = await Teacher.create(b);
  await writeAudit({ action: 'create', entity: 'teacher', entityId: t._id, after: t.toObject(), user: req.user, ip: req.ip });
  res.status(201).json(t);
});

// Combined create — teacher record + linked user account in ONE call
router.post('/with-user', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { employeeId, fullName, email, phone, subjects, classes, qualification, joiningDate, username, password } = req.body || {};
  if (!employeeId || !fullName || !username || !password) {
    return res.status(400).json({ error: 'employeeId, fullName, username, password required' });
  }
  if (password.length < 6) return res.status(400).json({ error: 'password must be 6+ chars' });
  const uname = username.toLowerCase().trim();
  const existsU = await User.findOne({ username: uname });
  if (existsU) return res.status(409).json({ error: 'Username already exists' });
  const existsT = await Teacher.findOne({ employeeId });
  if (existsT) return res.status(409).json({ error: 'Employee ID already exists' });

  const teacher = await Teacher.create({
    employeeId, fullName,
    email: email || '',
    phone: phone || '',
    subjects: subjects || [],
    classes: classes || [],
    qualification: qualification || '',
    joiningDate: joiningDate || '',
  });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username: uname,
    passwordHash,
    role: 'teacher',
    fullName,
    email: email || '',
    phone: phone || '',
    linkedRef: teacher._id,
  });
  teacher.userId = user._id;
  await teacher.save();

  await writeAudit({ action: 'create', entity: 'teacher', entityId: teacher._id, after: teacher.toObject(), user: req.user, ip: req.ip });
  await writeAudit({ action: 'create', entity: 'user', entityId: user._id, after: user.toPublic(), user: req.user, ip: req.ip });
  res.status(201).json({ teacher, user: user.toPublic() });
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
