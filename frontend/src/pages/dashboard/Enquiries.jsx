import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import EmptyState from '@/components/common/EmptyState';

const statusColors = {
  new: 'border-accent/50 bg-accent/10 text-accent-foreground',
  contacted: 'border-blue-500/50 bg-blue-500/10 text-blue-500',
  shortlisted: 'border-secondary/50 bg-secondary/10 text-secondary',
  admitted: 'border-secondary/70 bg-secondary/20 text-secondary',
  rejected: 'border-primary/50 bg-primary/10 text-primary',
};

const statuses = ['new', 'contacted', 'shortlisted', 'admitted', 'rejected'];

export default function Enquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      const { data } = await api.get('/enquiries', { params });
      setItems(data);
    } catch(e){}
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search]);

  const updateStatus = async (e, newStatus) => {
    try {
      await api.patch(`/enquiries/${e._id}`, { status: newStatus });
      toast.success('Status updated');
      load();
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="overline">Front Desk</p>
        <h1 className="font-serif text-4xl mt-2">Admission Enquiries</h1>
        <p className="text-muted-foreground mt-1">{items.length} enquiries · connected to the public website form</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone…" className="w-full h-11 pl-10 pr-4 rounded-full bg-muted/50 border border-transparent focus:border-primary focus:bg-background outline-none text-sm" data-testid="enq-search" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStatus('')} className={`text-xs mono px-3 py-1.5 rounded-full border ${status === '' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`} data-testid="filter-all">All</button>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`text-xs mono px-3 py-1.5 rounded-full border ${status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`} data-testid={`filter-${s}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-2">{Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-24" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No enquiries" />
      ) : (
        <div className="grid gap-3">
          {items.map((e, i) => (
            <motion.div
              key={e._id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-card p-5 grid md:grid-cols-[1fr_auto] gap-4 items-center"
              data-testid={`enq-${e._id}`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-serif text-lg">{e.childName}</p>
                  <span className={`text-[10px] mono uppercase tracking-widest px-2 py-1 rounded-full border ${statusColors[e.status]}`}>{e.status}</span>
                  <span className="text-xs mono text-muted-foreground">Grade {e.classAppliedFor}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Parent: {e.parentName} · <span className="mono">{e.phone}</span> · <span className="mono">{e.email}</span></p>
                {e.message && <p className="text-xs text-muted-foreground mt-2 italic">"{e.message}"</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {statuses.filter(s => s !== e.status).map(s => (
                  <button key={s} onClick={() => updateStatus(e, s)} className="text-[10px] mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-border hover:border-primary transition-colors" data-testid={`enq-move-${e._id}-${s}`}>
                    → {s}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
