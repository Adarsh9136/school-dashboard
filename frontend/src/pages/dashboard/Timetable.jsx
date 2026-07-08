import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table2, Pencil, X, Save, ArrowRightLeft } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import EmptyState from '@/components/common/EmptyState';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const periods = [1, 2, 3, 4, 5, 6, 7];

export default function Timetable() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [activeLeaves, setActiveLeaves] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('VII');
  const [section, setSection] = useState('A');
  const [editing, setEditing] = useState(null); // { day, period, slot? }
  const [form, setForm] = useState({ subject: '', teacherId: '', isSubstitute: false });
  const [showAllTeachers, setShowAllTeachers] = useState(false);
  const [saving, setSaving] = useState(false);

  const canEdit = ['principal', 'admin'].includes(user.role);
  const isTeacher = user.role === 'teacher';

  const load = async () => {
    setLoading(true);
    try {
      const params = isTeacher ? {} : { className, section };
      const [tt, tch, allTt, allLeaves] = await Promise.all([
        api.get('/timetable', { params }),
        canEdit ? api.get('/teachers') : Promise.resolve({ data: [] }),
        canEdit ? api.get('/timetable', { params: {} }) : Promise.resolve({ data: [] }),
        canEdit ? api.get('/leaves', { params: { status: 'approved' } }) : Promise.resolve({ data: [] }),
      ]);
      setSlots(tt.data);
      setTeachers(tch.data);
      setAllSlots(allTt.data);
      setActiveLeaves(allLeaves.data);
    } catch (e) { toast.error('Load failed'); }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [className, section]);

  const at = (day, period) => slots.find(s => s.day === day && s.period === period);

  // Returns 'teaching X-Y' if teacher already has a slot at day+period (excluding current slot), or 'on leave' if teacher has an approved leave overlapping today, else null.
  const conflictReason = (teacherId, day, period, excludeSlotId) => {
    if (!teacherId) return null;
    const clash = allSlots.find(s => s.teacherId === teacherId && s.day === day && s.period === period && s._id !== excludeSlotId);
    if (clash) return `already teaching ${clash.className}-${clash.section}`;
    // For "today"-context we don't have a specific date here; we just flag active leaves that cover today or later
    const today = new Date().toISOString().slice(0, 10);
    const onLeave = activeLeaves.find(l => l.teacherId === teacherId && l.fromDate <= today && l.toDate >= today);
    if (onLeave) return `on approved leave (${onLeave.fromDate} → ${onLeave.toDate})`;
    return null;
  };

  const openEditor = (day, period) => {
    if (!canEdit) return;
    const slot = at(day, period);
    setEditing({ day, period, slot });
    setForm({
      subject: slot?.subject || '',
      teacherId: slot?.teacherId || '',
      isSubstitute: slot?.isSubstitute || false,
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (editing && form.teacherId) {
      const conflict = conflictReason(form.teacherId, editing.day, editing.period, editing.slot?._id);
      if (conflict) {
        const proceed = window.confirm(`⚠ Conflict: this teacher is ${conflict} at ${editing.day} · Period ${editing.period}. Assign anyway?`);
        if (!proceed) return;
      }
    }
    setSaving(true);
    try {
      const teacher = teachers.find(t => t._id === form.teacherId);
      // If slot exists and only teacher is changing, use substitute endpoint for cleaner audit
      if (editing.slot && form.isSubstitute && editing.slot.teacherId !== form.teacherId) {
        await api.post(`/timetable/${editing.slot._id}/substitute`, {
          teacherId: form.teacherId,
          teacherName: teacher?.fullName || '',
        });
        toast.success(`Substitute assigned — ${teacher?.fullName || ''}`);
      } else {
        await api.post('/timetable', {
          className, section, day: editing.day, period: editing.period,
          subject: form.subject,
          teacherId: form.teacherId,
          teacherName: teacher?.fullName || '',
        });
        toast.success('Slot updated');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed');
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="overline">Weekly Schedule</p>
          <h1 className="font-serif text-4xl mt-2">Timetable</h1>
          <p className="text-muted-foreground mt-1">
            {isTeacher ? 'Your weekly teaching schedule' : canEdit ? `Click any cell to edit — Class ${className} · Section ${section}` : `Class ${className} — Section ${section}`}
          </p>
        </div>
        {!isTeacher && (
          <div className="flex items-center gap-2">
            <select value={className} onChange={e => setClassName(e.target.value)} className="h-11 px-4 rounded-full border border-border bg-transparent focus:border-primary outline-none mono text-sm" data-testid="tt-class">
              {['V','VI','VII','VIII','IX','X','XI','XII'].map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={section} onChange={e => setSection(e.target.value)} className="h-11 px-4 rounded-full border border-border bg-transparent focus:border-primary outline-none mono text-sm" data-testid="tt-section">
              {['A','B','C'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="skeleton h-96" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm" data-testid="timetable-grid">
            <thead className="bg-muted/40 text-left mono text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4">Day \\ Period</th>
                {periods.map(p => <th key={p} className="p-4 text-center">P{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {days.map((d, di) => (
                <tr key={d} className="border-t border-border">
                  <td className="p-4 font-serif">{d}</td>
                  {periods.map(p => {
                    const s = at(d, p);
                    const clickable = canEdit;
                    return (
                      <td key={p} className="p-2 align-top">
                        {s ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: di * 0.03 + p * 0.02 }}
                            onClick={() => clickable && openEditor(d, p)}
                            className={`relative rounded-lg p-3 border transition-[transform,border-color,background-color] ${clickable ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/60' : ''} ${s.isSubstitute ? 'border-accent/60 bg-accent/10' : 'border-border bg-muted/30'}`}
                            data-testid={`slot-${d}-${p}`}
                          >
                            <p className="text-xs font-medium leading-tight">{s.subject}</p>
                            <p className="text-[10px] mono text-muted-foreground mt-1 truncate">{s.teacherName || '—'}</p>
                            {s.isSubstitute && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-accent" title="Substitute" />}
                            {clickable && <Pencil size={10} className="absolute bottom-1 right-1 text-muted-foreground/60" />}
                          </motion.div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => clickable && openEditor(d, p)}
                            disabled={!clickable}
                            className={`w-full rounded-lg p-3 border border-dashed border-border/50 text-center text-xs text-muted-foreground ${clickable ? 'hover:border-primary/50 hover:text-primary transition-colors' : ''}`}
                            data-testid={`slot-empty-${d}-${p}`}
                          >
                            {clickable ? '+ add' : '—'}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && slots.length === 0 && !canEdit && (
        <div className="mt-6">
          <EmptyState icon={Table2} title="No timetable configured yet" description="Ask your principal to configure the class timetable." />
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 grid place-items-center p-4" onClick={() => setEditing(null)}>
            <motion.form
              initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              onClick={e => e.stopPropagation()}
              onSubmit={save}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4"
              data-testid="tt-edit-modal"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="overline">{editing.day} · Period {editing.period}</p>
                  <h3 className="font-serif text-2xl mt-1">{editing.slot ? 'Edit Slot' : 'Add Slot'}</h3>
                </div>
                <button type="button" onClick={() => setEditing(null)} className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted"><X size={16} /></button>
              </div>
              <div>
                <p className="overline mb-1">Subject</p>
                <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required placeholder="e.g. Mathematics" className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" data-testid="tt-subject" />
              </div>
              <div>
                <p className="overline mb-1">Teacher</p>
                {(() => {
                  const free = teachers.filter(t => !conflictReason(t._id, editing.day, editing.period, editing.slot?._id));
                  const busyList = teachers.filter(t => conflictReason(t._id, editing.day, editing.period, editing.slot?._id));
                  return (
                    <>
                      <select value={form.teacherId} onChange={e => setForm({...form, teacherId: e.target.value})} className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:border-primary outline-none text-sm" data-testid="tt-teacher">
                        <option value="">— Unassigned —</option>
                        {free.map(t => <option key={t._id} value={t._id}>{t.fullName} · {t.subjects.slice(0,2).join(', ')}</option>)}
                        {showAllTeachers && busyList.length > 0 && (
                          <optgroup label="Busy (will warn)">
                            {busyList.map(t => {
                              const reason = conflictReason(t._id, editing.day, editing.period, editing.slot?._id);
                              return <option key={t._id} value={t._id}>{t.fullName} — {reason}</option>;
                            })}
                          </optgroup>
                        )}
                      </select>
                      <div className="mt-2 flex items-center justify-between text-[11px] mono text-muted-foreground">
                        <span>{free.length} available · {busyList.length} busy</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={showAllTeachers} onChange={e => setShowAllTeachers(e.target.checked)} className="h-3.5 w-3.5 accent-primary" data-testid="tt-show-all" />
                          Include busy
                        </label>
                      </div>
                      {form.teacherId && conflictReason(form.teacherId, editing.day, editing.period, editing.slot?._id) && (
                        <p className="mt-2 text-[11px] text-primary mono flex items-center gap-1.5">
                          ⚠ {teachers.find(t => t._id === form.teacherId)?.fullName} is {conflictReason(form.teacherId, editing.day, editing.period, editing.slot?._id)} — you'll be asked to confirm.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
              {editing.slot && editing.slot.teacherId && editing.slot.teacherId !== form.teacherId && (
                <label className="flex items-center gap-2 text-sm cursor-pointer" data-testid="tt-substitute-check">
                  <input type="checkbox" checked={form.isSubstitute} onChange={e => setForm({...form, isSubstitute: e.target.checked})} className="h-4 w-4 accent-primary" />
                  <span>Mark as substitute (temporary reallocation, teacher will be notified)</span>
                </label>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-magnetic flex-1 justify-center text-sm py-2.5" data-testid="tt-save">
                  {saving ? 'Saving…' : (<><Save size={14} /> {editing.slot ? 'Save Changes' : 'Add Slot'}</>)}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
