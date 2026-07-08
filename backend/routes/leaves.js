const express = require('express');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const filter = {};
  if (req.user.role === 'teacher') filter.teacherId = req.user.linkedRef || req.user._id;
  if (req.query.status) filter.status = req.query.status;
  const leaves = await Leave.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json(leaves);
});

router.post('/', auth, requireRole('teacher'), async (req, res) => {
  const { fromDate, toDate, reason, leaveType } = req.body || {};
  if (!fromDate || !toDate || !reason) return res.status(400).json({ error: 'fromDate, toDate, reason required' });
  const leave = await Leave.create({
    teacherId: req.user.linkedRef || req.user._id,
    teacherName: req.user.fullName,
    fromDate,
    toDate,
    reason,
    leaveType: leaveType || 'casual',
  });
  // Notify principal(s)
  const principals = await User.find({ role: { $in: ['principal', 'admin'] }, active: true });
  await Promise.all(principals.map(p => Notification.create({
    userId: p._id,
    title: 'New Leave Request',
    message: `${req.user.fullName} requested leave from ${fromDate} to ${toDate}`,
    type: 'leave',
    link: '/dashboard/leaves',
  })));
  await writeAudit({ action: 'create', entity: 'leave', entityId: leave._id, after: leave.toObject(), user: req.user, ip: req.ip });
  res.status(201).json(leave);
});

router.post('/:id/review', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { status, reviewNote } = req.body || {};
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status must be approved/rejected' });
  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ error: 'Not found' });
  const before = leave.toObject();
  leave.status = status;
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  leave.reviewNote = reviewNote || '';
  await leave.save();

  // Notify teacher (find user with linkedRef = teacherId)
  const teacherUser = await User.findOne({ role: 'teacher', linkedRef: leave.teacherId });
  if (teacherUser) {
    await Notification.create({
      userId: teacherUser._id,
      title: `Leave ${status}`,
      message: `Your leave (${leave.fromDate} → ${leave.toDate}) was ${status} by ${req.user.fullName}`,
      type: status === 'approved' ? 'success' : 'warning',
      link: '/dashboard/leaves',
    });
  }
  await writeAudit({ action: 'review', entity: 'leave', entityId: leave._id, before, after: leave.toObject(), user: req.user, ip: req.ip });
  res.json(leave);
});

module.exports = router;
