const express = require('express');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

// GET attendance — filter by type, date range, class, refId
router.get('/', auth, async (req, res) => {
  const { type = 'student', date, from, to, classId, refId } = req.query;
  const filter = { type };
  if (date) filter.date = date;
  if (from || to) filter.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  if (classId) filter.classId = classId;
  if (refId) filter.refId = refId;

  // parents restricted to their children
  if (req.user.role === 'parent') {
    const kids = await Student.find({ parentUserId: req.user._id }).select('_id');
    const kidIds = kids.map(k => k._id);
    filter.type = 'student';
    filter.refId = { $in: kidIds };
  }
  const records = await Attendance.find(filter).sort({ date: -1, markedAt: -1 }).limit(2000);
  res.json(records);
});

// Bulk mark attendance
router.post('/mark', auth, async (req, res) => {
  const { type, date, entries, classId, period = 0, source = 'manual' } = req.body || {};
  if (!type || !date || !Array.isArray(entries)) return res.status(400).json({ error: 'type, date, entries required' });

  // permissions
  if (type === 'student' && !['principal', 'admin', 'teacher', 'scanner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (type === 'teacher' && !['principal', 'admin', 'scanner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Teachers cannot mark their own attendance' });
  }

  const results = [];
  for (const e of entries) {
    if (!e.refId || !e.status) continue;
    const existing = await Attendance.findOne({ type, refId: e.refId, date, period });
    if (existing) {
      const before = existing.toObject();
      existing.status = e.status;
      existing.remarks = e.remarks || existing.remarks;
      existing.markedBy = req.user._id;
      existing.markedByRole = req.user.role;
      existing.markedAt = new Date();
      existing.source = source;
      await existing.save();
      await writeAudit({ action: 'update', entity: 'attendance', entityId: existing._id, before, after: existing.toObject(), user: req.user, ip: req.ip, reason: e.reason || '' });
      results.push(existing);
    } else {
      const rec = await Attendance.create({
        type,
        refId: e.refId,
        classId: classId || e.classId || '',
        date,
        status: e.status,
        remarks: e.remarks || '',
        period,
        markedBy: req.user._id,
        markedByRole: req.user.role,
        source,
      });
      await writeAudit({ action: 'create', entity: 'attendance', entityId: rec._id, after: rec.toObject(), user: req.user, ip: req.ip });
      results.push(rec);
    }
  }
  res.json({ count: results.length, records: results });
});

// Summary stats
router.get('/summary', auth, async (req, res) => {
  const { date, type = 'student' } = req.query;
  const d = date || new Date().toISOString().slice(0, 10);
  const rows = await Attendance.find({ type, date: d });
  const total = rows.length;
  const present = rows.filter(r => r.status === 'present').length;
  const absent = rows.filter(r => r.status === 'absent').length;
  const late = rows.filter(r => r.status === 'late').length;
  const leave = rows.filter(r => r.status === 'leave').length;
  const totalStrength = type === 'student' ? await Student.countDocuments({ active: true }) : await Teacher.countDocuments({ active: true });
  res.json({ date: d, type, total, present, absent, late, leave, totalStrength, percentage: totalStrength ? Math.round((present / totalStrength) * 100) : 0 });
});

module.exports = router;
