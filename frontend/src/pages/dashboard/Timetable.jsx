import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Table2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/common/EmptyState';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const periods = [1, 2, 3, 4, 5, 6, 7];

export default function Timetable() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('VII');
  const [section, setSection] = useState('A');

  const load = async () => {
    setLoading(true);
    try {
      const params = user.role === 'teacher' ? {} : { className, section };
      const { data } = await api.get('/timetable', { params });
      setSlots(data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [className, section]);

  const at = (day, period) => slots.find(s => s.day === day && s.period === period);
  const isTeacher = user.role === 'teacher';

  return (
    <div>
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="overline">Weekly Schedule</p>
          <h1 className="font-serif text-4xl mt-2">Timetable</h1>
          <p className="text-muted-foreground mt-1">{isTeacher ? 'Your weekly teaching schedule' : `Class ${className} — Section ${section}`}</p>
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
      ) : slots.length === 0 ? (
        <EmptyState icon={Table2} title="No timetable configured yet" description={!isTeacher ? 'Ask your principal to configure the class timetable.' : 'No slots assigned to you yet.'} />
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
                    return (
                      <td key={p} className="p-2 align-top">
                        {s ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: di * 0.03 + p * 0.02 }}
                            className={`relative rounded-lg p-3 border transition-[transform,border-color] hover:-translate-y-0.5 hover:border-primary/60 ${s.isSubstitute ? 'border-accent/60 bg-accent/10' : 'border-border bg-muted/30'}`}
                          >
                            <p className="text-xs font-medium leading-tight">{s.subject}</p>
                            <p className="text-[10px] mono text-muted-foreground mt-1 truncate">{s.teacherName || '—'}</p>
                            {s.isSubstitute && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-accent" title="Substitute" />}
                          </motion.div>
                        ) : (
                          <div className="rounded-lg p-3 border border-dashed border-border/50 text-center text-xs text-muted-foreground">—</div>
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
    </div>
  );
}
