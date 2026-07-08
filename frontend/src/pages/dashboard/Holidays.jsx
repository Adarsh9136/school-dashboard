import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function pad(n) { return n < 10 ? `0${n}` : `${n}`; }

export default function Holidays() {
  const { user } = useAuth();
  const canEdit = ['principal', 'admin'].includes(user.role);
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: '', name: '', type: 'school' });

  const load = async () => {
    try { const { data } = await api.get('/holidays', { params: { year: cursor.y } }); setItems(data); } catch(e){}
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cursor.y]);

  const monthName = new Date(cursor.y, cursor.m).toLocaleString('en-US', { month: 'long' });
  const days = daysInMonth(cursor.y, cursor.m);
  const firstDay = new Date(cursor.y, cursor.m, 1).getDay(); // 0=Sun

  const map = useMemo(() => {
    const m = {};
    items.forEach(h => { m[h.date] = h; });
    return m;
  }, [items]);

  const changeMonth = (dir) => {
    let { y, m } = cursor;
    m += dir;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCursor({ y, m });
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/holidays', form);
      toast.success('Holiday added');
      setModal(false); setForm({ date: '', name: '', type: 'school' });
      load();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  };

  const remove = async (h) => {
    if (!window.confirm(`Remove ${h.name}?`)) return;
    await api.delete(`/holidays/${h._id}`);
    toast.success('Removed');
    load();
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="overline">Calendar</p>
          <h1 className="font-serif text-4xl mt-2">Holidays</h1>
          <p className="text-muted-foreground mt-1">Sundays are treated as holidays automatically.</p>
        </div>
        {canEdit && (
          <button onClick={() => setModal(true)} className="btn-magnetic text-sm py-2" data-testid="add-holiday">
            <Plus size={14} /> Add Holiday
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => changeMonth(-1)} className="h-10 w-10 grid place-items-center rounded-full border border-border hover:bg-muted transition-colors" data-testid="cal-prev"><ChevronLeft size={16} /></button>
          <h3 className="font-serif text-3xl">{monthName} <span className="text-muted-foreground">{cursor.y}</span></h3>
          <button onClick={() => changeMonth(1)} className="h-10 w-10 grid place-items-center rounded-full border border-border hover:bg-muted transition-colors" data-testid="cal-next"><ChevronRight size={16} /></button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2 text-xs mono text-muted-foreground uppercase tracking-widest text-center">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const dateStr = `${cursor.y}-${pad(cursor.m + 1)}-${pad(d)}`;
            const dt = new Date(cursor.y, cursor.m, d);
            const isSunday = dt.getDay() === 0;
            const isHoliday = !!map[dateStr];
            const isToday = dateStr === today;
            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.008 }}
                className={`relative aspect-square rounded-xl border p-2 transition-colors ${isToday ? 'border-primary bg-primary/10' : isSunday ? 'border-primary/30 bg-primary/5' : isHoliday ? 'border-accent/60 bg-accent/10' : 'border-border hover:bg-muted/40'}`}
                data-testid={`day-${dateStr}`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-sm mono ${isToday ? 'text-primary font-semibold' : ''}`}>{d}</span>
                  {isToday && <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </div>
                {isHoliday && (
                  <div className="mt-1">
                    <p className="text-[10px] leading-tight line-clamp-2 text-accent-foreground">{map[dateStr].name}</p>
                    {canEdit && (
                      <button onClick={() => remove(map[dateStr])} className="absolute top-1 right-1 h-5 w-5 grid place-items-center rounded hover:bg-destructive/20 hover:text-destructive opacity-0 group-hover:opacity-100" data-testid={`del-holiday-${map[dateStr]._id}`}>
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                )}
                {isSunday && !isHoliday && <p className="text-[10px] text-primary/70 mt-1 mono">Holiday</p>}
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 grid place-items-center p-4" onClick={() => setModal(false)}>
            <motion.form
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              onSubmit={save}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4"
              data-testid="add-holiday-modal"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl">Add Holiday</h3>
                <button type="button" onClick={() => setModal(false)} className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted"><X size={16} /></button>
              </div>
              <div>
                <p className="overline mb-1">Date</p>
                <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:border-primary outline-none mono text-sm" />
              </div>
              <div>
                <p className="overline mb-1">Name</p>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Founder's Day" className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
              </div>
              <div>
                <p className="overline mb-1">Type</p>
                <div className="flex gap-2">
                  {['school', 'public'].map(t => (
                    <button type="button" key={t} onClick={() => setForm({...form, type: t})} className={`text-xs mono px-3 py-1.5 rounded-full border ${form.type === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-magnetic w-full justify-center">Add Holiday</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
