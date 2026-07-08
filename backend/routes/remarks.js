const express = require('express');
const Remark = require('../models/Remark');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { studentId, classId, date } = req.query;
  const filter = {};
  if (studentId) filter.$or = [{ studentId }, { studentIds: studentId }];
  if (classId) filter.classId = classId;
  if (date) filter.date = date;
  const items = await Remark.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json(items);
});

router.post('/', auth, requireRole('teacher', 'principal', 'admin'), async (req, res) => {
  const { studentId, studentIds, classId, scope, period, date, remark } = req.body || {};
  if (!date || !remark) return res.status(400).json({ error: 'date, remark required' });
  const r = await Remark.create({
    studentId: studentId || '',
    studentIds: studentIds || [],
    classId: classId || '',
    scope: scope || 'individual',
    period: period || 0,
    date,
    remark,
    teacherId: req.user.linkedRef || req.user._id,
    teacherName: req.user.fullName,
  });
  res.status(201).json(r);
});

module.exports = router;
