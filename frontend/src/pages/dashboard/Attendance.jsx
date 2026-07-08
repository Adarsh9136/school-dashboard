import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, ClipboardCheck, Users, Clock, Check, X as XIcon } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import EmptyState from '@/components/common/EmptyState';

const statusOptions = [
  { key: 'present', label: 'Present', cls: 'cell-present', icon: Check },
  { key: 'absent', label: 'Absent', cls: 'cell-absent', icon: XIcon },
  { key: 'late', label: 'Late', cls: 'cell-late', icon: Clock },
];

export default function Attendance() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [existing, setExisting] = useState({});
  const [marks, setMarks] = useState({});
  const [flashing, setFlashing] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const canMark = ['teacher', 'principal', 'admin', 'scanner'].includes(user.role);
  const isParent = user.role === 'parent';

  const load = async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        api.get('/students'),
        api.get('/attendance', { params: { type: 'student', date } }),
      ]);
      setStudents(s.data);
      const map = {};
      a.data.forEach(r => { if (r.period === 0) map[r.refId] = r.status; });
      setExisting(map);
      setMarks(map);
    } catch (e) { toast.error('Load failed'); }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [date]);

  const mark = (refId, status) => {
    if (!canMark) return;
    setMarks(m => ({ ...m, [refId]: status }));
    setFlashing(f => ({ ...f, [refId]: status }));
    setTimeout(() => setFlashing(f => ({ ...f, [refId]: null })), 700);
  };

  const bulk = (status) => {
    if (!canMark) return;
    const next = {};
    students.forEach(s => { next[s._id] = status; });
    setMarks(next);
    const fl = {}; students.forEach(s => { fl[s._id] = status; });
    setFlashing(fl);
    setTimeout(() => setFlashing({}), 700);
  };

  const save = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(marks).map(([refId, status]) => ({ refId, status }));
      await api.post('/attendance/mark', { type: 'student', date, entries, period: 0 });
      toast.success('Attendance saved');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed');
    }
    setSaving(false);
  };

  const stats = useMemo(() => {
    const total = students.length;
    const p = Object.values(marks).filter(v => v === 'present').length;
    const a = Object.values(marks).filter(v => v === 'absent').length;
    return { total, present: p, absent: a, pct: total ? Math.round((p/total)*100) : 0 };
  }, [marks, students]);

  return (
    <div>
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="overline">Roll Call</p>
          <h1 className="font-serif text-4xl mt-2">Attendance</h1>
          <p className="text-muted-foreground mt-1">{isParent ? 'View your child\'s attendance' : 'Mark today\'s attendance and save'}</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11 px-4 rounded-full border border-border bg-transparent focus:border-primary outline-none mono text-sm" data-testid="date-picker" />
          {canMark && (
            <button onClick={save} disabled={saving} className="btn-magnetic text-sm py-2" data-testid="save-attendance">
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatMini label="Total" value={stats.total} tone="ink" />
        <StatMini label="Present" value={stats.present} tone="secondary" />
        <StatMini label="Absent" value={stats.absent} tone="primary" />
        <StatMini label="Attendance %" value={`${stats.pct}%`} tone="accent" />
      </div>

      {canMark && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="overline mr-2">Bulk</span>
          {statusOptions.map(o => (
            <button key={o.key} onClick={() => bulk(o.key)} className={`text-xs mono px-3 py-1.5 rounded-full border transition-colors ${o.cls} hover:brightness-110`} data-testid={`bulk-${o.key}`}>
              Mark all {o.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-2">{Array.from({length:6}).map((_,i)=><div key={i} className="skeleton h-14" />)}</div>
      ) : students.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No students to display" />
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          {students.map((s, i) => {
            const cur = marks[s._id];
            const wasChanged = existing[s._id] !== marks[s._id];
            const flashClass = flashing[s._id] === 'present' ? 'animate-flash-green' : flashing[s._id] === 'absent' ? 'animate-flash-red' : '';
            return (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className={`flex items-center gap-4 p-4 border-t border-border first:border-t-0 ${flashClass}`}
                data-testid={`att-row-${s.prn}`}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center font-serif text-sm shrink-0">{s.fullName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.fullName}</p>
                  <p className="text-xs mono text-muted-foreground">{s.prn} · {s.className}-{s.section}</p>
                </div>
                {isParent ? (
                  <span className={`text-xs mono px-3 py-1 rounded-full border ${cur === 'present' ? 'cell-present' : cur === 'absent' ? 'cell-absent' : 'cell-late'}`}>
                    {(cur || 'not marked').toUpperCase()}
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    {statusOptions.map(o => {
                      const active = cur === o.key;
                      return (
                        <button
                          key={o.key}
                          onClick={() => mark(s._id, o.key)}
                          className={`attendance-cell ${active ? o.cls : 'text-muted-foreground hover:border-primary/40'}`}
                          data-testid={`mark-${o.key}-${s.prn}`}
                          title={o.label}
                        >
                          <o.icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                )}
                {wasChanged && <span className="h-2 w-2 rounded-full bg-accent shrink-0" title="Unsaved change" />}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatMini({ label, value, tone }) {
  const map = { primary: 'text-primary', secondary: 'text-secondary', accent: 'text-accent', ink: 'text-foreground' };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="overline">{label}</p>
      <p className={`mt-2 font-serif text-3xl ${map[tone]}`}>{value}</p>
    </div>
  );
}
