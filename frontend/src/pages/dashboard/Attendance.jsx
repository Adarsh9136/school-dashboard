import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, ClipboardCheck, Clock, Check, X as XIcon, Lock } from 'lucide-react';
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
  const [availableClasses, setAvailableClasses] = useState([]); // [{className, section}]
  const [selectedClass, setSelectedClass] = useState(null); // {className, section}

  const isTeacher = user.role === 'teacher';
  const isParent = user.role === 'parent';
  const canMark = ['teacher', 'principal', 'admin', 'scanner'].includes(user.role);
  const dateLocked = isTeacher; // teachers can only mark today

  // Load available classes for the current user
  useEffect(() => {
    (async () => {
      if (isTeacher) {
        try {
          const { data } = await api.get('/teachers/me/classes');
          setAvailableClasses(data.classes || []);
          if (data.classes && data.classes.length > 0) {
            setSelectedClass(data.classes[0]);
          }
        } catch (e) { toast.error('Failed to load your classes'); }
      } else if (isParent) {
        // parent: no class selector — sees own children
        setSelectedClass(null);
      } else {
        // principal/admin: derive from all students
        try {
          const { data } = await api.get('/students');
          const set = new Set();
          data.forEach(s => set.add(`${s.className}|${s.section}`));
          const cls = Array.from(set).map(k => {
            const [className, section] = k.split('|');
            return { className, section };
          });
          setAvailableClasses(cls);
          if (cls.length > 0) setSelectedClass(cls[0]);
        } catch(e){}
      }
    })();
    // eslint-disable-next-line
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const studentsParams = isParent ? {} : (selectedClass ? { className: selectedClass.className, section: selectedClass.section } : {});
      const [s, a] = await Promise.all([
        api.get('/students', { params: studentsParams }),
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

  useEffect(() => {
    if (isParent || selectedClass) load();
    // eslint-disable-next-line
  }, [date, selectedClass]);

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
    if (isTeacher && !selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    setSaving(true);
    try {
      const entries = Object.entries(marks).map(([refId, status]) => ({ refId, status }));
      const payload = { type: 'student', date, entries, period: 0 };
      if (isTeacher && selectedClass) {
        payload.className = selectedClass.className;
        payload.section = selectedClass.section;
      }
      await api.post('/attendance/mark', payload);
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
          <p className="text-muted-foreground mt-1">
            {isParent ? "View your child's attendance" :
             isTeacher ? 'You may mark attendance for today, and only for classes you teach.' :
             "Mark today's attendance and save"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Class selector — hidden for parents */}
          {!isParent && availableClasses.length > 0 && (
            <div className="flex items-center gap-1 rounded-full border border-border p-1" data-testid="class-picker">
              {availableClasses.map(c => {
                const active = selectedClass && selectedClass.className === c.className && selectedClass.section === c.section;
                return (
                  <button
                    key={`${c.className}-${c.section}`}
                    onClick={() => setSelectedClass(c)}
                    className={`text-xs mono px-3 py-1.5 rounded-full transition-colors ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    data-testid={`class-pill-${c.className}-${c.section}`}
                  >
                    {c.className}-{c.section}
                  </button>
                );
              })}
            </div>
          )}
          <div className="relative">
            <input
              type="date"
              value={date}
              max={dateLocked ? today : undefined}
              min={dateLocked ? today : undefined}
              onChange={e => setDate(e.target.value)}
              disabled={dateLocked}
              className="h-11 px-4 rounded-full border border-border bg-transparent focus:border-primary outline-none mono text-sm disabled:opacity-70 disabled:cursor-not-allowed pr-9"
              data-testid="date-picker"
            />
            {dateLocked && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" title="Teachers may only mark today's attendance">
                <Lock size={12} />
              </span>
            )}
          </div>
          {canMark && !isParent && (
            <button onClick={save} disabled={saving} className="btn-magnetic text-sm py-2" data-testid="save-attendance">
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {isTeacher && availableClasses.length === 0 && (
        <EmptyState
          icon={Lock}
          title="No classes assigned"
          description="You currently have no timetable slots. Ask your Principal to assign classes to you before marking attendance."
        />
      )}

      {selectedClass && (
        <p className="mb-6 text-xs mono text-muted-foreground">
          Marking for <span className="text-foreground font-semibold">{selectedClass.className}-{selectedClass.section}</span> on <span className="text-foreground">{date}</span>
          {dateLocked && <span> · <span className="text-primary">today only</span></span>}
        </p>
      )}

      {/* Quick stats */}
      {(!isTeacher || selectedClass) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatMini label="Total" value={stats.total} tone="ink" />
          <StatMini label="Present" value={stats.present} tone="secondary" />
          <StatMini label="Absent" value={stats.absent} tone="primary" />
          <StatMini label="Attendance %" value={`${stats.pct}%`} tone="accent" />
        </div>
      )}

      {canMark && !isParent && students.length > 0 && (
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
        <EmptyState icon={ClipboardCheck} title="No students to display" description={isTeacher && selectedClass ? `No students found in ${selectedClass.className}-${selectedClass.section}.` : ''} />
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
