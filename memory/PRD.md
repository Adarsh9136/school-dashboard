# Resonance International School — ERP + Marketing Site

## Problem Statement (Verbatim)
Build a complete School ERP Management System for "Resonance International School" — a premium enterprise-grade school platform with responsive Web Dashboard, Node.js backend, MongoDB DB, JWT auth, RBAC (Admin, Principal, Teacher, Parent, Accountant, Fingerprint Scanner), and full modules: Attendance, Leave Mgmt, Timetable, Fees (Paid/Pending only), Student Mgmt with permanent PRN + yearly Class ID, Teacher Mgmt, Audit Logs, Holidays (Sunday auto-holiday), Report Cards (Excel), Notifications, Admission Enquiries, News Feed, Announcements, Reports & Analytics — all wrapped in premium 60-FPS Framer Motion animations (aurora backgrounds, magnetic buttons, custom cursor, staggered text reveal, count-ups, confetti, glassmorphism, dark/light mode).

User choice: **Node.js + MongoDB backend** (switched from FastAPI default).

## User Personas
- **Principal / Admin** — full control: manage students, teachers, timetable, approve leaves, upload report cards, view analytics & audit logs.
- **Teacher** — take attendance, view own timetable, apply for leaves, view assigned classes, announcements.
- **Parent** — multi-child support, view attendance/timetable/fee status/report cards/announcements (fee amounts hidden).
- **Accountant** — mark fees paid, record offline payments, view reports.
- **Fingerprint Scanner** — device role for attendance sync (backend supports).

## Architecture
- **Backend**: Node.js + Express + Mongoose (MongoDB) at `/app/backend`. Supervisor runs `node server.js` on `0.0.0.0:8001`. JWT auth with role guards. Audit logging on every mutation.
- **Frontend**: React 19 + Tailwind + Framer Motion + Recharts at `/app/frontend`. Path alias `@/` → `/app/frontend/src`.
- **DB**: MongoDB via `MONGO_URL` + `DB_NAME` from `/app/backend/.env`.

## What's been implemented (Feb 2026)
### Backend (17 API modules)
- `/api/auth` — login, me, change-password
- `/api/users` — Principal generates usernames/passwords
- `/api/students` — CRUD, promote (PRN permanent, Class ID rebuilt yearly)
- `/api/teachers` — CRUD
- `/api/attendance` — bulk mark, summary, parent-scoped, audit-logged
- `/api/leaves` — apply, review (approve/reject), notifications
- `/api/timetable` — grid, substitute (teacher notified)
- `/api/fees` — create, mark-paid, `/send-reminders` (auto-fires notifications 2/1/0/-N days)
- `/api/holidays` — Sundays auto, Principal adds/removes
- `/api/notifications` — inbox, unread count, mark read
- `/api/announcements` — Principal posts to All/Teachers/Parents/Students + fan-out
- `/api/announcements/public/news` — public news feed for website
- `/api/enquiries/public` — public admission form; `/api/enquiries` list/status
- `/api/audit` — Principal/Admin view
- `/api/analytics` — summary, attendance trend, class distribution, fee status
- `/api/remarks` — teacher period-wise remarks
- `/api/reports` — report card bulk upload (Excel-shaped JSON)
- `/api/health`

### Frontend
- Premium marketing site: Hero (staggered text, typing rotator, mouse parallax, floating shapes, count-ups, aurora background), Programs, Campus gallery (masonry), News Feed (dynamic), CTA
- Admission Enquiry form with floating labels, grade pills, success state
- Login page: split hero + one-tap demo accounts, shake on error, password toggle
- Dashboard shell: sticky glassmorphism topbar with global search + notifications panel (slide-in right, unread badge, mark-all-read), sidebar with active-pill layout animation, custom cursor, scroll progress, back-to-top
- Role-based dashboards:
  - Principal/Admin: 4 StatCards with CountUp + LineChart trend + PieChart fee mix + BarChart distribution
  - Teacher: Today's classes, leave stats
  - Parent: Children cards + attendance/fee mini stats
  - Accountant: Fees split
- Students: table with drawer editor, search, promote-ready
- Teachers: card grid
- Attendance: cell flash green/red animations, bulk mark, save with audit trail
- Timetable: 7 periods × 6 days grid, substitute markers
- Leaves: apply drawer, approve/reject with **canvas-confetti burst on approval**
- Fees: Paid/Pending badges (amounts intentionally hidden), send-reminders trigger
- Holidays: Calendar UI, Sundays auto-highlighted, today pulse
- Announcements + News Feed: post modal with audience targeting
- Enquiries: filterable list with status pills
- Audit Logs: filterable immutable trail
- Reports: Bar / Pie / Line charts

### Design system
- Fonts: Playfair Display (headings) + Outfit (body) + JetBrains Mono (data)
- Palette (light): cream `#FDFBF7`, maroon `#7A1022`, forest `#1E3F2D`, gold `#C4A454`
- Palette (dark): near-black `#0B0B0C`, red `#E53935`, sage `#81C784`, saffron `#F2C94C`
- Global animations: aurora blobs, floating particles, grain grid overlay, glass-navbar with backdrop-blur
- Reduced-motion respected

### Seed Data
Auto-seeded by `node seed.js` on startup (idempotent): 1 principal, 1 admin, 1 accountant, 6 teachers with user accounts, 6 parents with 1 student each (VII-A and VIII-A), 42 timetable slots, 6 holidays, current-month fee records, sample attendance for today, 3 news posts, 2 announcements, 1 pending leave, 2 enquiries.

## Prioritized Backlog (Post-MVP)
- **P0**: Report card Excel actual file upload (currently JSON body upload); Teacher period-wise attendance UI (backend supports)
- **P1**: Drag-and-drop timetable reallocation UI (backend has substitute endpoint); Bulk user-generation UI for principal
- **P2**: React Native mobile app (Firebase FCM); Email/SMS notifications (Resend + Twilio); Multi-school super-admin; PDF/Excel export of enquiries and reports; Report cards printable view

## Deployment Notes
- Supervisor config at `/etc/supervisor/conf.d/supervisord.conf` runs `node server.js` for backend.
- `.env` requires: `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`, `JWT_SECRET`, `PORT=8001`.
- Reseed: `cd /app/backend && node seed.js`
