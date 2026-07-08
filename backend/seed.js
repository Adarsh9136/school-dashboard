// One-time seed script for demo data. Idempotent — safe to run multiple times.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Timetable = require('./models/Timetable');
const Holiday = require('./models/Holiday');
const Fee = require('./models/Fee');
const Announcement = require('./models/Announcement');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Enquiry = require('./models/Enquiry');
const Notification = require('./models/Notification');

async function upsertUser({ username, password, role, fullName, email = '', phone = '', linkedRef = '', avatarUrl = '' }) {
  const existing = await User.findOne({ username });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ username, passwordHash, role, fullName, email, phone, linkedRef, avatarUrl });
}

async function upsertStudent(data) {
  const existing = await Student.findOne({ prn: data.prn });
  if (existing) return existing;
  const classId = `${data.prn}_${data.className}_${data.section}`;
  return Student.create({ ...data, classId });
}

async function upsertTeacher(data) {
  const existing = await Teacher.findOne({ employeeId: data.employeeId });
  if (existing) return existing;
  return Teacher.create(data);
}

async function run() {
  await connectDB();
  console.log('[seed] starting...');

  // Core admin/principal/accountant accounts
  const principal = await upsertUser({ username: 'principal', password: 'Principal@123', role: 'principal', fullName: 'Dr. Anjali Rao', email: 'principal@resonance.edu.in', avatarUrl: 'https://images.pexels.com/photos/8423008/pexels-photo-8423008.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' });
  const admin = await upsertUser({ username: 'admin', password: 'Admin@123', role: 'admin', fullName: 'Rohit Sharma', email: 'admin@resonance.edu.in' });
  const accountant = await upsertUser({ username: 'accountant', password: 'Account@123', role: 'accountant', fullName: 'Meera Iyer', email: 'accounts@resonance.edu.in' });

  // Teachers
  const teachers = [];
  const teacherSeed = [
    { employeeId: 'T001', fullName: 'Kavita Menon', subjects: ['Mathematics', 'Physics'], classes: ['VII-A', 'VIII-A'], qualification: 'M.Sc, B.Ed', joiningDate: '2018-06-12' },
    { employeeId: 'T002', fullName: 'Arjun Verma', subjects: ['English Literature'], classes: ['VII-A', 'VII-B'], qualification: 'M.A English, B.Ed', joiningDate: '2019-04-01' },
    { employeeId: 'T003', fullName: 'Priya Nair', subjects: ['Biology', 'Chemistry'], classes: ['VIII-A'], qualification: 'M.Sc Botany', joiningDate: '2020-07-15' },
    { employeeId: 'T004', fullName: 'Farhan Qureshi', subjects: ['History', 'Civics'], classes: ['VII-A'], qualification: 'M.A History', joiningDate: '2017-06-01' },
    { employeeId: 'T005', fullName: 'Sneha Kulkarni', subjects: ['Hindi'], classes: ['VII-A', 'VII-B'], qualification: 'M.A Hindi', joiningDate: '2021-08-20' },
    { employeeId: 'T006', fullName: 'Vikram Singh', subjects: ['Physical Education'], classes: ['VII-A', 'VII-B', 'VIII-A'], qualification: 'B.P.Ed', joiningDate: '2019-06-10' },
  ];
  for (const t of teacherSeed) {
    const teacher = await upsertTeacher(t);
    teachers.push(teacher);
    const username = `t.${t.fullName.toLowerCase().split(' ')[0]}`;
    await upsertUser({
      username,
      password: 'Teacher@123',
      role: 'teacher',
      fullName: t.fullName,
      email: `${username}@resonance.edu.in`,
      linkedRef: teacher._id,
    });
  }

  // Parents & Students
  const parentSeed = [
    { username: 'parent.gupta', name: 'Rajesh Gupta', phone: '+91-9876500001', child: { prn: '76540001', fullName: 'Aarav Gupta', className: 'VII', section: 'A', gender: 'M' } },
    { username: 'parent.khan', name: 'Sadiya Khan', phone: '+91-9876500002', child: { prn: '76540002', fullName: 'Zara Khan', className: 'VII', section: 'A', gender: 'F' } },
    { username: 'parent.reddy', name: 'Vinod Reddy', phone: '+91-9876500003', child: { prn: '76540003', fullName: 'Ishaan Reddy', className: 'VII', section: 'A', gender: 'M' } },
    { username: 'parent.das', name: 'Ananya Das', phone: '+91-9876500004', child: { prn: '76540004', fullName: 'Riya Das', className: 'VII', section: 'A', gender: 'F' } },
    { username: 'parent.pillai', name: 'Suresh Pillai', phone: '+91-9876500005', child: { prn: '76540005', fullName: 'Vihaan Pillai', className: 'VIII', section: 'A', gender: 'M' } },
    { username: 'parent.mehta', name: 'Neha Mehta', phone: '+91-9876500006', child: { prn: '76540006', fullName: 'Aanya Mehta', className: 'VIII', section: 'A', gender: 'F' } },
  ];

  for (const p of parentSeed) {
    const parentUser = await upsertUser({
      username: p.username,
      password: 'Parent@123',
      role: 'parent',
      fullName: p.name,
      phone: p.phone,
      email: `${p.username}@example.com`,
    });
    await upsertStudent({
      ...p.child,
      parentUserId: parentUser._id,
      parentName: p.name,
      parentPhone: p.phone,
      dob: '2012-04-15',
      bloodGroup: 'O+',
      address: 'Andheri West, Mumbai',
      admissionYear: '2020',
    });
  }

  // Timetable — 7 periods x 6 days for VII-A
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const subjects = ['Mathematics', 'English Literature', 'History', 'Hindi', 'Physical Education', 'Biology', 'Physics'];
  const teacherMap = { 'Mathematics': teachers[0], 'Physics': teachers[0], 'English Literature': teachers[1], 'Biology': teachers[2], 'Chemistry': teachers[2], 'History': teachers[3], 'Civics': teachers[3], 'Hindi': teachers[4], 'Physical Education': teachers[5] };
  for (const day of days) {
    for (let period = 1; period <= 7; period++) {
      const subject = subjects[(period - 1 + days.indexOf(day)) % subjects.length];
      const teacher = teacherMap[subject] || teachers[0];
      const existing = await Timetable.findOne({ className: 'VII', section: 'A', day, period });
      if (!existing) {
        await Timetable.create({ className: 'VII', section: 'A', day, period, subject, teacherId: teacher._id, teacherName: teacher.fullName });
      }
    }
  }

  // Holidays
  const year = new Date().getFullYear();
  const holidaySeed = [
    { date: `${year}-01-26`, name: 'Republic Day', type: 'public' },
    { date: `${year}-03-08`, name: 'Holi', type: 'public' },
    { date: `${year}-08-15`, name: 'Independence Day', type: 'public' },
    { date: `${year}-10-02`, name: 'Gandhi Jayanti', type: 'public' },
    { date: `${year}-11-01`, name: 'Founder\'s Day', type: 'school' },
    { date: `${year}-12-25`, name: 'Christmas', type: 'public' },
  ];
  for (const h of holidaySeed) {
    const exists = await Holiday.findOne({ date: h.date });
    if (!exists) await Holiday.create({ ...h, createdBy: principal._id });
  }

  // Fee records for current month for all students
  const currentMonth = new Date().toISOString().slice(0, 7);
  const students = await Student.find({ active: true });
  const dueDate = `${currentMonth}-10`;
  for (const s of students) {
    const exists = await Fee.findOne({ studentId: s._id, month: currentMonth });
    if (!exists) {
      await Fee.create({
        studentId: s._id,
        studentName: s.fullName,
        classId: s.classId,
        month: currentMonth,
        dueDate,
        status: Math.random() > 0.6 ? 'paid' : 'pending',
        paidOn: Math.random() > 0.6 ? dueDate : '',
      });
    }
  }

  // Sample attendance for today
  const today = new Date().toISOString().slice(0, 10);
  for (const s of students) {
    const exists = await Attendance.findOne({ type: 'student', refId: s._id, date: today, period: 0 });
    if (!exists) {
      await Attendance.create({
        type: 'student',
        refId: s._id,
        classId: s.classId,
        date: today,
        status: Math.random() > 0.1 ? 'present' : 'absent',
        period: 0,
        markedBy: principal._id,
        markedByRole: 'principal',
      });
    }
  }

  // News & announcements
  const newsSeed = [
    { title: 'Annual Sports Day 2026 — Registrations Open', body: 'We are thrilled to announce the Annual Sports Day, scheduled for 22nd March 2026. Students from all grades can register with their PE coordinators until 15th March. Track events, team sports, and a special inter-house championship await.', imageUrl: 'https://images.unsplash.com/photo-1717584146940-118a65525da8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTB8MHwxfHNlYXJjaHwzfHxzY2hvb2wlMjBjaGlsZHJlbiUyMHJ1bm5pbmclMjBzcG9ydHN8ZW58MHx8fHwxNzgzNTM0NDI5fDA&ixlib=rb-4.1.0&q=85', isNews: true },
    { title: 'Resonance Wins National Science Olympiad — Silver Medal', body: 'Our Grade VIII student Aanya Mehta represented Resonance at the National Science Olympiad and secured a silver medal in the Junior Physics category. A moment of immense pride for the entire Resonance family.', imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjBjbGFzc3Jvb20lMjBsZWFybmluZyUyMG1vZGVybnxlbnwwfHx8fDE3ODM1MzQ0Mjl8MA&ixlib=rb-4.1.0&q=85', isNews: true },
    { title: 'New Library Wing Inaugurated', body: 'The newly built East Library Wing, housing over 12,000 volumes and dedicated silent-reading zones, is now open for students and faculty.', imageUrl: 'https://images.unsplash.com/photo-1763582516354-e417d2902207?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzOTB8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBsaWJyYXJ5JTIwbW9kZXJuJTIwcmVhZGluZ3xlbnwwfHx8fDE3ODM1MzQ0Mjh8MA&ixlib=rb-4.1.0&q=85', isNews: true },
  ];
  for (const n of newsSeed) {
    const exists = await Announcement.findOne({ title: n.title });
    if (!exists) await Announcement.create({ ...n, postedBy: principal._id, postedByName: principal.fullName, audience: 'all' });
  }

  const annSeed = [
    { title: 'Parent-Teacher Meeting — Grade VII', body: 'PTM scheduled for Saturday, 8th March, from 10:00 AM to 1:00 PM. Kindly confirm your slot with the class teacher.', audience: 'parents' },
    { title: 'Winter Uniform Discontinued from 15th March', body: 'Students may switch to summer uniform starting Monday, 15th March. Please refer to the uniform guide on the parent portal.', audience: 'all' },
  ];
  for (const a of annSeed) {
    const exists = await Announcement.findOne({ title: a.title });
    if (!exists) await Announcement.create({ ...a, postedBy: principal._id, postedByName: principal.fullName, isNews: false });
  }

  // Sample leave request
  const t1Leave = await Leave.findOne({ teacherId: teachers[0]._id, status: 'pending' });
  if (!t1Leave) {
    await Leave.create({
      teacherId: teachers[0]._id,
      teacherName: teachers[0].fullName,
      fromDate: today,
      toDate: today,
      reason: 'Medical appointment — half-day expected',
      leaveType: 'medical',
      status: 'pending',
    });
  }

  // Sample enquiries
  const enqSeed = [
    { childName: 'Aditya Malhotra', parentName: 'Kunal Malhotra', email: 'kunal.m@example.com', phone: '+91-9988771122', classAppliedFor: 'V', status: 'new' },
    { childName: 'Saanvi Bose', parentName: 'Debashree Bose', email: 'd.bose@example.com', phone: '+91-9988771133', classAppliedFor: 'VI', status: 'contacted' },
  ];
  for (const e of enqSeed) {
    const exists = await Enquiry.findOne({ email: e.email, childName: e.childName });
    if (!exists) await Enquiry.create(e);
  }

  console.log('[seed] complete.');
  console.log('---');
  console.log('Login credentials:');
  console.log('  Principal  → principal / Principal@123');
  console.log('  Admin      → admin / Admin@123');
  console.log('  Accountant → accountant / Account@123');
  console.log('  Teacher    → t.kavita / Teacher@123');
  console.log('  Parent     → parent.gupta / Parent@123');
  console.log('---');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(err => {
  console.error('[seed] error', err);
  process.exit(1);
});
