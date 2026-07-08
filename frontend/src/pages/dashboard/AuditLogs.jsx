import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Filter } from 'lucide-react';
import api from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';

const entities = ['', 'user', 'student', 'teacher', 'attendance', 'leave', 'timetable', 'fee', 'holiday', 'announcement', 'enquiry'];

export default function AuditLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState('');

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/audit', { params: entity ? { entity } : {} }); setItems(data); } catch(e){}
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [entity]);

  return (
    <div>
      <div className="mb-8">
        <p className="overline">Accountability</p>
        <h1 className="font-serif text-4xl mt-2">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Immutable record of every meaningful change in the system.</p>
      </div>

      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-muted-foreground" />
        {entities.map(en => (
          <button key={en || 'all'} onClick={() => setEntity(en)} className={`text-xs mono px-3 py-1.5 rounded-full border ${entity === en ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`} data-testid={`audit-filter-${en || 'all'}`}>
            {en || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-2">{Array.from({length:6}).map((_,i)=><div key={i} className="skeleton h-14" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit entries" />
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left mono text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">By</th>
                <th className="p-4">Reason</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a, i) => (
                <motion.tr key={a._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.01, 0.3) }} className="border-t border-border" data-testid={`audit-row-${a._id}`}>
                  <td className="p-4 mono text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="p-4"><span className="text-[10px] mono uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">{a.action}</span></td>
                  <td className="p-4 mono text-xs">{a.entity} <span className="text-muted-foreground">/ {a.entityId?.slice(0, 8)}</span></td>
                  <td className="p-4">
                    <p className="text-sm">{a.userName || '—'}</p>
                    <p className="text-[10px] mono text-muted-foreground">{a.userRole}</p>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{a.reason || '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
