const express = require('express');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const Timetable = require('../models/Timetable');
const Enquiry = require('../models/Enquiry');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', auth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const [
    studentCount, teacherCount,
    todayStudentAtt, todayTeacherAtt,
    pendingFees, pendingLeaves,
    upcomingHolidaysCount, newEnquiries,
  ] = await Promise.all([
    Student.countDocuments({ active: true }),
    Teacher.countDocuments({ active: true }),
    Attendance.find({ type: 'student', date: today, period: 0 }),
    Attendance.find({ type: 'teacher', date: today, period: 0 }),
    Fee.countDocuments({ status: 'pending' }),
    Leave.countDocuments({ status: 'pending' }),
    Holiday.countDocuments({ date: { $gte: today } }),
    Enquiry.countDocuments({ status: 'new' }),
  ]);
  const presentStudents = todayStudentAtt.filter(a => a.status === 'present').length;
  const absentStudents = todayStudentAtt.filter(a => a.status === 'absent').length;
  const presentTeachers = todayTeacherAtt.filter(a => a.status === 'present').length;

  res.json({
    studentCount,
    teacherCount,
    presentStudents,
    absentStudents,
    studentAttendancePct: studentCount ? Math.round((presentStudents / studentCount) * 100) : 0,
    presentTeachers,
    teacherAttendancePct: teacherCount ? Math.round((presentTeachers / teacherCount) * 100) : 0,
    pendingFees,
    pendingLeaves,
    upcomingHolidays: upcomingHolidaysCount,
    newEnquiries,
    todayISO: today,
  });
});

router.get('/attendance-trend', auth, async (req, res) => {
  const days = 7;
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const total = await Student.countDocuments({ active: true });
    const rows = await Attendance.find({ type: 'student', date: iso, period: 0 });
    const p = rows.filter(r => r.status === 'present').length;
    out.push({ date: iso, present: p, absent: rows.filter(r => r.status === 'absent').length, pct: total ? Math.round((p / total) * 100) : 0 });
  }
  res.json(out);
});

router.get('/class-distribution', auth, async (req, res) => {
  const agg = await Student.aggregate([
    { $match: { active: true } },
    { $group: { _id: { className: '$className', section: '$section' }, count: { $sum: 1 } } },
    { $sort: { '_id.className': 1, '_id.section': 1 } },
  ]);
  res.json(agg.map(a => ({ label: `${a._id.className}-${a._id.section}`, count: a.count })));
});

router.get('/fee-status', auth, async (req, res) => {
  const paid = await Fee.countDocuments({ status: 'paid' });
  const pending = await Fee.countDocuments({ status: 'pending' });
  res.json({ paid, pending });
});

module.exports = router;
