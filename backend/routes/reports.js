const express = require('express');
const ReportCard = require('../models/ReportCard');
const Student = require('../models/Student');
const { auth, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../utils/audit');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { studentId, term } = req.query;
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (term) filter.term = term;
  if (req.user.role === 'parent') {
    const kids = await Student.find({ parentUserId: req.user._id }).select('_id');
    filter.studentId = { $in: kids.map(k => k._id) };
  }
  const items = await ReportCard.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(items);
});

router.post('/bulk-upload', auth, requireRole('principal', 'admin'), async (req, res) => {
  const { term, rows } = req.body || {};
  if (!term || !Array.isArray(rows)) return res.status(400).json({ error: 'term, rows[] required' });
  const created = [];
  for (const r of rows) {
    if (!r.studentId) continue;
    const s = await Student.findById(r.studentId);
    if (!s) continue;
    const totalMarks = Object.values(r.marks || {}).reduce((a, b) => a + (b.marks || 0), 0);
    const maxMarks = Object.values(r.marks || {}).reduce((a, b) => a + (b.max || 100), 0);
    const pct = maxMarks ? Math.round((totalMarks / maxMarks) * 100) : 0;
    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'D';
    const rc = await ReportCard.create({
      studentId: s._id,
      studentName: s.fullName,
      classId: s.classId,
      term,
      marks: r.marks || {},
      overallGrade: grade,
      overallPercent: pct,
      remark: r.remark || '',
      uploadedBy: req.user._id,
    });
    created.push(rc);
  }
  await writeAudit({ action: 'bulk_upload', entity: 'report_card', user: req.user, ip: req.ip, after: { count: created.length, term } });
  res.status(201).json({ count: created.length });
});

module.exports = router;
