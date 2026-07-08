// Sidebar navigation config per role
import {
  LayoutDashboard, Users, GraduationCap, ClipboardList, Calendar, CalendarDays,
  Wallet, Megaphone, Newspaper, ScrollText, FileSpreadsheet, Sparkles,
  ClipboardCheck, ClockAlert, Table2, BarChart3, UserSquare2
} from 'lucide-react';

export const navByRole = {
  principal: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/students', label: 'Students', icon: GraduationCap },
    { to: '/dashboard/teachers', label: 'Teachers', icon: UserSquare2 },
    { to: '/dashboard/attendance', label: 'Attendance', icon: ClipboardCheck },
    { to: '/dashboard/timetable', label: 'Timetable', icon: Table2 },
    { to: '/dashboard/leaves', label: 'Leave Requests', icon: ClockAlert },
    { to: '/dashboard/fees', label: 'Fee Status', icon: Wallet },
    { to: '/dashboard/holidays', label: 'Holidays', icon: CalendarDays },
    { to: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/dashboard/news', label: 'News Feed', icon: Newspaper },
    { to: '/dashboard/enquiries', label: 'Admissions', icon: ClipboardList },
    { to: '/dashboard/reports', label: 'Analytics', icon: BarChart3 },
    { to: '/dashboard/audit', label: 'Audit Logs', icon: ScrollText },
  ],
  admin: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/students', label: 'Students', icon: GraduationCap },
    { to: '/dashboard/teachers', label: 'Teachers', icon: UserSquare2 },
    { to: '/dashboard/attendance', label: 'Attendance', icon: ClipboardCheck },
    { to: '/dashboard/fees', label: 'Fee Status', icon: Wallet },
    { to: '/dashboard/enquiries', label: 'Admissions', icon: ClipboardList },
    { to: '/dashboard/reports', label: 'Analytics', icon: BarChart3 },
    { to: '/dashboard/audit', label: 'Audit Logs', icon: ScrollText },
  ],
  teacher: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/attendance', label: 'Take Attendance', icon: ClipboardCheck },
    { to: '/dashboard/timetable', label: 'My Timetable', icon: Table2 },
    { to: '/dashboard/leaves', label: 'My Leaves', icon: ClockAlert },
    { to: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/dashboard/news', label: 'News Feed', icon: Newspaper },
  ],
  parent: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/attendance', label: 'Attendance', icon: ClipboardCheck },
    { to: '/dashboard/timetable', label: 'Timetable', icon: Table2 },
    { to: '/dashboard/fees', label: 'Fee Status', icon: Wallet },
    { to: '/dashboard/holidays', label: 'Holidays', icon: CalendarDays },
    { to: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/dashboard/news', label: 'News Feed', icon: Newspaper },
  ],
  accountant: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/fees', label: 'Fee Management', icon: Wallet },
    { to: '/dashboard/students', label: 'Students', icon: GraduationCap },
    { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  ],
};
