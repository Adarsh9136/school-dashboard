import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import DashboardShell from '@/components/dashboard/DashboardShell';
import LoadingSplash from '@/components/common/LoadingSplash';
import AnimatedCursor from '@/components/common/AnimatedCursor';

import Home from '@/pages/Home';
import Admission from '@/pages/Admission';
import Login from '@/pages/Login';
import Overview from '@/pages/dashboard/Overview';
import Students from '@/pages/dashboard/Students';
import Teachers from '@/pages/dashboard/Teachers';
import Attendance from '@/pages/dashboard/Attendance';
import Timetable from '@/pages/dashboard/Timetable';
import Leaves from '@/pages/dashboard/Leaves';
import Fees from '@/pages/dashboard/Fees';
import Holidays from '@/pages/dashboard/Holidays';
import Announcements from '@/pages/dashboard/Announcements';
import Enquiries from '@/pages/dashboard/Enquiries';
import AuditLogs from '@/pages/dashboard/AuditLogs';
import Reports from '@/pages/dashboard/Reports';

function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <LoadingSplash show={!booted} />
        <AnimatedCursor />
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'font-sans',
            style: { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admission" element={<Admission />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<DashboardShell />}>
              <Route index element={<Overview />} />
              <Route path="students" element={<Students />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="leaves" element={<Leaves />} />
              <Route path="fees" element={<Fees />} />
              <Route path="holidays" element={<Holidays />} />
              <Route path="announcements" element={<Announcements isNewsMode={false} />} />
              <Route path="news" element={<Announcements isNewsMode={true} />} />
              <Route path="enquiries" element={<Enquiries />} />
              <Route path="audit" element={<AuditLogs />} />
              <Route path="reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
