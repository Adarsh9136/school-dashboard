import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Users, GraduationCap, Wallet, Bell, ClipboardCheck, ClockAlert, CalendarDays, TrendingUp, Sparkles } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } };

function ChartCard({ title, subtitle, children, tall, testId }) {
  return (
    <motion.div variants={item} className="rounded-2xl border border-border bg-card p-6 card-lift" data-testid={testId}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="overline">{subtitle}</p>
          <h3 className="font-serif text-xl mt-1">{title}</h3>
        </div>
        <TrendingUp size={16} className="text-muted-foreground" />
      </div>
      <div className={tall ? 'h-72' : 'h-56'}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// Principal / Admin overview with charts
function AdminOverview() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [dist, setDist] = useState([]);
  const [feeMix, setFeeMix] = useState({ paid: 0, pending: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary').then(r => setSummary(r.data)),
      api.get('/analytics/attendance-trend').then(r => setTrend(r.data)),
      api.get('/analytics/class-distribution').then(r => setDist(r.data)),
      api.get('/analytics/fee-status').then(r => setFeeMix(r.data)),
    ]).catch(() => {});
  }, []);

  if (!summary) {
    return (
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-32" />)}
      </div>
    );
  }

  const pieColors = ['#1E3F2D', '#7A1022'];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div variants={item}><StatCard label="Total Students" value={summary.studentCount} icon={GraduationCap} tone="primary" trend={`${summary.studentAttendancePct}% present today`} testId="stat-students" /></motion.div>
        <motion.div variants={item}><StatCard label="Total Teachers" value={summary.teacherCount} icon={Users} tone="secondary" trend={`${summary.teacherAttendancePct}% present today`} testId="stat-teachers" /></motion.div>
        <motion.div variants={item}><StatCard label="Pending Fees" value={summary.pendingFees} icon={Wallet} tone="accent" trend="This month" testId="stat-pending-fees" /></motion.div>
        <motion.div variants={item}><StatCard label="Pending Leaves" value={summary.pendingLeaves} icon={ClockAlert} tone="primary" trend="Awaiting review" testId="stat-pending-leaves" /></motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title="Attendance — Last 7 days" subtitle="Trend" tall testId="chart-attendance-trend">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="present" stroke="#1E3F2D" strokeWidth={2.5} dot={{ r: 4 }} animationDuration={1400} />
              <Line type="monotone" dataKey="absent" stroke="#7A1022" strokeWidth={2.5} dot={{ r: 4 }} animationDuration={1400} />
            </LineChart>
          </ChartCard>
        </div>
        <ChartCard title="Fee Collection" subtitle="Status Split" testId="chart-fee-mix">
          <PieChart>
            <Pie data={[{ name: 'Paid', value: feeMix.paid }, { name: 'Pending', value: feeMix.pending }]} innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" animationDuration={1200}>
              {pieColors.map((c, i) => <Cell key={i} fill={c} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Legend />
          </PieChart>
        </ChartCard>
      </div>

      <ChartCard title="Class Distribution" subtitle="Roster Strength" testId="chart-class-dist">
        <BarChart data={dist}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
          <Bar dataKey="count" fill="#7A1022" radius={[6, 6, 0, 0]} animationDuration={1400} />
        </BarChart>
      </ChartCard>
    </motion.div>
  );
}

function TeacherOverview() {
  const [tt, setTt] = useState([]);
  const [leaves, setLeaves] = useState([]);
  useEffect(() => {
    api.get('/timetable').then(r => setTt(r.data)).catch(() => {});
    api.get('/leaves').then(r => setLeaves(r.data)).catch(() => {});
  }, []);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = tt.filter(t => t.day === today).sort((a,b) => a.period - b.period);
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div variants={item}><StatCard label="Today's Classes" value={todayClasses.length} icon={ClipboardCheck} tone="primary" testId="stat-today-classes" /></motion.div>
        <motion.div variants={item}><StatCard label="Pending Leaves" value={leaves.filter(l => l.status === 'pending').length} icon={ClockAlert} tone="accent" testId="stat-my-leaves" /></motion.div>
        <motion.div variants={item}><StatCard label="Total Slots / Week" value={tt.length} icon={CalendarDays} tone="secondary" testId="stat-slots" /></motion.div>
      </div>
      <motion.div variants={item} className="rounded-2xl border border-border bg-card p-6">
        <p className="overline">Today · {today}</p>
        <h3 className="font-serif text-2xl mt-2">Your teaching schedule</h3>
        {todayClasses.length === 0 ? (
          <EmptyState icon={Sparkles} title="No classes scheduled today" description="Enjoy a lighter day — or catch up on planning." />
        ) : (
          <div className="mt-6 grid gap-3">
            {todayClasses.map(c => (
              <div key={c._id} className="flex items-center gap-4 rounded-xl border border-border p-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary grid place-items-center mono">P{c.period}</div>
                <div className="flex-1">
                  <p className="font-medium">{c.subject}</p>
                  <p className="text-xs text-muted-foreground mono">{c.className}-{c.section}</p>
                </div>
                {c.isSubstitute && <span className="text-[10px] mono px-2 py-1 rounded-full bg-accent/20 text-accent-foreground border border-accent/40">SUBSTITUTE</span>}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ParentOverview() {
  const [kids, setKids] = useState([]);
  const [att, setAtt] = useState([]);
  const [fees, setFees] = useState([]);

  useEffect(() => {
    api.get('/students').then(r => setKids(r.data)).catch(() => {});
    api.get('/attendance').then(r => setAtt(r.data)).catch(() => {});
    api.get('/fees').then(r => setFees(r.data)).catch(() => {});
  }, []);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div variants={item}><StatCard label="Children" value={kids.length} icon={GraduationCap} tone="primary" testId="stat-children" /></motion.div>
        <motion.div variants={item}><StatCard label="This Month Attendance" value={att.filter(a => a.status === 'present').length} suffix={` / ${att.length || 0}`} icon={ClipboardCheck} tone="secondary" testId="stat-att-count" /></motion.div>
        <motion.div variants={item}><StatCard label="Pending Fees" value={fees.filter(f => f.status === 'pending').length} icon={Wallet} tone="accent" testId="stat-fees" /></motion.div>
      </div>
      {kids.map((k, i) => (
        <motion.div key={k._id} variants={item} className="rounded-2xl border border-border bg-card p-6 card-lift">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center font-serif text-xl">
              {k.fullName[0]}
            </div>
            <div className="flex-1">
              <p className="font-serif text-2xl">{k.fullName}</p>
              <div className="flex items-center gap-3 mt-1 text-xs mono text-muted-foreground">
                <span>PRN {k.prn}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span>{k.className} · Section {k.section}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      {kids.length === 0 && <EmptyState icon={GraduationCap} title="No children linked yet" description="Please contact your school administrator." />}
    </motion.div>
  );
}

function AccountantOverview() {
  const [summary, setSummary] = useState(null);
  const [feeMix, setFeeMix] = useState({ paid: 0, pending: 0 });
  useEffect(() => {
    api.get('/analytics/summary').then(r => setSummary(r.data)).catch(() => {});
    api.get('/analytics/fee-status').then(r => setFeeMix(r.data)).catch(() => {});
  }, []);
  if (!summary) return <div className="skeleton h-40" />;
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div variants={item}><StatCard label="Total Students" value={summary.studentCount} icon={GraduationCap} tone="primary" testId="stat-students-a" /></motion.div>
        <motion.div variants={item}><StatCard label="Fees Received" value={feeMix.paid} icon={Wallet} tone="secondary" testId="stat-paid" /></motion.div>
        <motion.div variants={item}><StatCard label="Fees Pending" value={feeMix.pending} icon={ClockAlert} tone="accent" testId="stat-pending" /></motion.div>
      </div>
    </motion.div>
  );
}

export default function Overview() {
  const { user } = useAuth();
  return (
    <div>
      <div className="mb-8">
        <p className="overline">Welcome back</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-3 tracking-tight" data-testid="overview-title">
          Good day, <span className="italic brand-gradient-text">{(user.fullName.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+/i, '').split(' ')[0])}.</span>
        </h1>
        <p className="text-muted-foreground mt-2">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      {(user.role === 'principal' || user.role === 'admin') && <AdminOverview />}
      {user.role === 'teacher' && <TeacherOverview />}
      {user.role === 'parent' && <ParentOverview />}
      {user.role === 'accountant' && <AccountantOverview />}
    </div>
  );
}
