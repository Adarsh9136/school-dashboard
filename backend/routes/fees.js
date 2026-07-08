const express = require('express');
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

// GET fees — parents see only their child's status (no amounts anywhere)
router.get('/', auth, async (req, res) => {
  const { studentId, month, status } = req.query;
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (month) filter.month = month;
  if (status) filter.status = status;

  if (req.user.role === 'parent') {
    const kids = await Student.find({ parentUserId: req.user._id }).select('_id');
    filter.studentId = { $in: kids.map(k => k._id) };
  }
  const fees = await Fee.find(filter).sort({ dueDate: -1 }).limit(1000);
  // For parents, ensure no amount fields (there are none by design)
  res.json(fees);
});

router.post('/', auth, requireRole('principal', 'admin', 'accountant'), async (req, res) => {
  const { studentId, month, dueDate } = req.body || {};
  if (!studentId || !month || !dueDate) return res.status(400).json({ error: 'studentId, month, dueDate required' });
  const s = await Student.findById(studentId);
  if (!s) return res.status(404).json({ error: 'Student not found' });
  const existing = await Fee.findOne({ studentId, month });
  if (existing) return res.status(409).json({ error: 'Fee record for this month already exists' });
  const fee = await Fee.create({
    studentId,
    studentName: s.fullName,
    classId: s.classId,
    month,
    dueDate,
    status: 'pending',
  });
  await writeAudit({ action: 'create', entity: 'fee', entityId: fee._id, after: fee.toObject(), user: req.user, ip: req.ip });
  res.status(201).json(fee);
});

router.post('/:id/mark-paid', auth, requireRole('accountant', 'principal', 'admin'), async (req, res) => {
  const { paidOn, paymentMode, note } = req.body || {};
  const fee = await Fee.findById(req.params.id);
  if (!fee) return res.status(404).json({ error: 'Not found' });
  const before = fee.toObject();
  fee.status = 'paid';
  fee.paidOn = paidOn || new Date().toISOString().slice(0, 10);
  fee.paymentMode = paymentMode || 'offline';
  fee.receivedBy = req.user._id;
  fee.note = note || '';
  fee.updatedAt = new Date();
  await fee.save();
  // notify parent
  const s = await Student.findById(fee.studentId);
  if (s && s.parentUserId) {
    await Notification.create({
      userId: s.parentUserId,
      title: 'Fee Received',
      message: `Fee for ${s.fullName} (${fee.month}) has been marked as Paid.`,
      type: 'success',
      link: '/dashboard/fees',
    });
  }
  await writeAudit({ action: 'mark_paid', entity: 'fee', entityId: fee._id, before, after: fee.toObject(), user: req.user, ip: req.ip });
  res.json(fee);
});

// Automatic reminder trigger endpoint (call daily via cron/manual)
router.post('/send-reminders', auth, requireRole('principal', 'admin', 'accountant'), async (req, res) => {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  const pending = await Fee.find({ status: 'pending' });
  let sent = 0;
  for (const f of pending) {
    const due = new Date(f.dueDate);
    const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));
    if (diff <= 2) {
      const s = await Student.findById(f.studentId);
      if (s && s.parentUserId) {
        const label = diff > 0 ? `${diff} day(s)` : diff === 0 ? 'today' : `${Math.abs(diff)} day(s) overdue`;
        await Notification.create({
          userId: s.parentUserId,
          title: 'Fee Reminder',
          message: `Fee for ${s.fullName} (${f.month}) is due ${label}. Kindly clear pending dues.`,
          type: 'fee',
          link: '/dashboard/fees',
        });
        sent++;
      }
    }
  }
  res.json({ sent, checked: pending.length, on: iso });
});

module.exports = router;
