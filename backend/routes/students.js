const express = require('express');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

// Helper: given a teacher's userId, return the set of "className|section" keys they teach.
async function getTeacherClassKeys(user) {
  const teacherId = user.linkedRef || user._id;
  const slots = await Timetable.find({ teacherId });
  const set = new Set();
  slots.forEach(s => set.add(`${s.className}|${s.section}`));
  return set;
}

// Helper: auto-create or link parent user via phone number.
// Returns the parent User (or null if no phone was supplied).
async function ensureParentUser({ parentPhone, parentName, initialPassword }, actor) {
  if (!parentPhone) return null;
  const uname = parentPhone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
  if (!uname) return null;
  const existing = await User.findOne({ username: uname });
  if (existing) return existing;
  const pw = initialPassword && initialPassword.length >= 6 ? initialPassword : 'Parent@123';
  const passwordHash = await bcrypt.hash(pw, 10);
  const user = await User.create({
    username: uname,
    passwordHash,
    role: 'parent',
    fullName: parentName || `Parent (${parentPhone})`,
    phone: parentPhone,
  });
  await writeAudit({ action: 'create', entity: 'user', entityId: user._id, after: user.toPublic(), user: actor, reason: 'auto-created parent from student add' });
  return user;
}

// GET list — Principal/Admin see all; Teacher sees only students in classes they teach; Parent only children
router.get('/', auth, async (req, res) => {
  const { classId, className, section, search } = req.query;
  let filter = {};
  if (req.user.role === 'parent') {
    filter.parentUserId = req.user._id;
  } else if (req.user.role === 'teacher') {
    const keys = await getTeacherClassKeys(req.user);
    if (keys.size === 0) return res.json([]);
    filter.$or = Array.from(keys).map(k => {
      const [cn, sec] = k.split('|');
      return { className: cn, section: sec };
    });
  }
  if (classId) filter.classId = classId;
  if (className) filter.className = className;
  if (section) filter.section = section;
  if (search) {
    const rx = new RegExp(search, 'i');
    // combine search into the existing filter using $and to preserve teacher/parent scoping
    const searchClause = { $or: [{ fullName: rx }, { prn: rx }] };
    if (filter.$or) {
      filter = { $and: [{ $or: filter.$or }, searchClause] };
    } else {
      Object.assign(filter, searchClause);
    }
  }
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
  // auto-create/link parent user via phone
  const parentUser = await ensureParentUser({
    parentPhone: body.parentPhone,
    parentName: body.parentName,
    initialPassword: body.parentPassword,
  }, req.user);
  const classId = `${body.prn}_${body.className}_${body.section}`;
  const s = await Student.create({
    ...body,
    classId,
    parentUserId: parentUser ? parentUser._id : '',
  });
  await writeAudit({ action: 'create', entity: 'student', entityId: s._id, after: s.toObject(), user: req.user, ip: req.ip });
  res.status(201).json({
    student: s,
    parentUser: parentUser ? { id: parentUser._id, username: parentUser.username, phone: parentUser.phone } : null,
  });
});

router.patch('/:id', auth, requireRole('principal', 'admin'), async (req, res) => {
  const s = await Student.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  const before = s.toObject();
  const body = req.body || {};
  // re-link parent if phone changed
  if (body.parentPhone && body.parentPhone !== s.parentPhone) {
    const parentUser = await ensureParentUser({
      parentPhone: body.parentPhone,
      parentName: body.parentName || s.parentName,
    }, req.user);
    if (parentUser) body.parentUserId = parentUser._id;
  }
  Object.assign(s, body);
  if (body.className || body.section) {
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
