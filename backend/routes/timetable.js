const express = require('express');
const Timetable = require('../models/Timetable');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

// Compute classes affected by a teacher's absence within a date range
router.get('/affected', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { teacherId, fromDate, toDate } = req.query;
  if (!teacherId || !fromDate || !toDate) return res.status(400).json({ error: 'teacherId, fromDate, toDate required' });
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (isNaN(start) || isNaN(end)) return res.status(400).json({ error: 'invalid dates' });
  const dayName = (d) => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
  const out = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = dayName(cursor);
    if (day !== 'Sunday') {
      const slots = await Timetable.find({ teacherId, day }).sort({ period: 1 });
      out.push({ date: cursor.toISOString().slice(0, 10), day, slots });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  res.json(out);
});

// GET timetable for a class/section OR for a teacher
router.get('/', auth, async (req, res) => {
  const { className, section, teacherId } = req.query;
  const filter = {};
  if (className) filter.className = className;
  if (section) filter.section = section;
  if (teacherId) filter.teacherId = teacherId;
  if (req.user.role === 'teacher' && !className && !teacherId) {
    filter.teacherId = req.user.linkedRef || req.user._id;
  }
  const slots = await Timetable.find(filter).sort({ day: 1, period: 1 }).limit(2000);
  res.json(slots);
});

// Upsert a slot (Principal/Admin)
router.post('/', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { className, section, day, period, subject, teacherId, teacherName } = req.body || {};
  if (!className || !section || !day || !period || !subject) {
    return res.status(400).json({ error: 'className, section, day, period, subject required' });
  }
  const existing = await Timetable.findOne({ className, section, day, period });
  let slot;
  const before = existing ? existing.toObject() : null;
  if (existing) {
    existing.subject = subject;
    existing.teacherId = teacherId || '';
    existing.teacherName = teacherName || '';
    existing.updatedAt = new Date();
    await existing.save();
    slot = existing;
  } else {
    slot = await Timetable.create({ className, section, day, period, subject, teacherId: teacherId || '', teacherName: teacherName || '' });
  }
  // Notify affected teacher
  if (teacherId) {
    const tuser = await User.findOne({ role: 'teacher', linkedRef: teacherId });
    if (tuser) {
      await Notification.create({
        userId: tuser._id,
        title: 'Timetable Updated',
        message: `${day} Period ${period} — ${subject} for ${className}-${section}`,
        type: 'timetable',
        link: '/dashboard/timetable',
      });
    }
  }
  await writeAudit({ action: existing ? 'update' : 'create', entity: 'timetable', entityId: slot._id, before, after: slot.toObject(), user: req.user, ip: req.ip });
  res.json(slot);
});

// Substitute — swap teacher for one slot
router.post('/:id/substitute', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { teacherId, teacherName } = req.body || {};
  const slot = await Timetable.findById(req.params.id);
  if (!slot) return res.status(404).json({ error: 'Not found' });
  const before = slot.toObject();
  if (!slot.originalTeacherId) slot.originalTeacherId = slot.teacherId;
  slot.teacherId = teacherId;
  slot.teacherName = teacherName || '';
  slot.isSubstitute = true;
  slot.updatedAt = new Date();
  await slot.save();
  // notify substitute
  const tuser = await User.findOne({ role: 'teacher', linkedRef: teacherId });
  if (tuser) {
    await Notification.create({
      userId: tuser._id,
      title: 'Substitute Assignment',
      message: `You are assigned as substitute for ${slot.className}-${slot.section} on ${slot.day} Period ${slot.period}`,
      type: 'timetable',
    });
  }
  await writeAudit({ action: 'substitute', entity: 'timetable', entityId: slot._id, before, after: slot.toObject(), user: req.user, ip: req.ip });
  res.json(slot);
});

module.exports = router;
