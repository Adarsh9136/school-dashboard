import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, ClockAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import EmptyState from '@/components/common/EmptyState';

const statusStyles = {
  pending: { cls: 'border-accent/50 bg-accent/10 text-accent-foreground', label: 'Pending' },
  approved: { cls: 'border-secondary/50 bg-secondary/10 text-secondary', label: 'Approved' },
  rejected: { cls: 'border-primary/50 bg-primary/10 text-primary', label: 'Rejected' },
};

export default function Leaves() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [form, setForm] = useState({ fromDate: '', toDate: '', reason: '', leaveType: 'casual' });
  const [saving, setSaving] = useState(false);

  const isTeacher = user.role === 'teacher';
  const canReview = ['principal', 'admin'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/leaves'); setItems(data); } catch(e){}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/leaves', form);
      toast.success('Leave request submitted');
      setDrawer(false);
      setForm({ fromDate: '', toDate: '', reason: '', leaveType: 'casual' });
      load();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
    setSaving(false);
  };

  const review = async (leave, status) => {
    try {
      await api.post(`/leaves/${leave._id}/review`, { status });
      if (status === 'approved') {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#C4A454', '#1E3F2D', '#7A1022', '#FDFBF7'],
        });
      }
      toast.success(`Leave ${status}`);
      load();
    } catch (e) { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="overline">Time off</p>
          <h1 className="font-serif text-4xl mt-2">Leave Management</h1>
          <p className="text-muted-foreground mt-1">{canReview ? 'Review and approve teacher leave requests.' : 'Apply for leave and track status.'}</p>
        </div>
        {isTeacher && (
          <button onClick={() => setDrawer(true)} className="btn-magnetic text-sm py-2" data-testid="apply-leave-btn">
            <Plus size={14} /> Apply for Leave
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3">{Array.from({length:3}).map((_,i)=><div key={i} className="skeleton h-24" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={ClockAlert} title="No leave requests yet" />
      ) : (
        <div className="grid gap-3">
          {items.map((l, i) => {
            const s = statusStyles[l.status];
            return (
              <motion.div
                key={l._id}
                initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-5 flex flex-wrap items-center gap-4"
                data-testid={`leave-card-${l._id}`}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center font-serif text-lg">{l.teacherName[0]}</div>
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium">{l.teacherName}</p>
                  <p className="text-xs mono text-muted-foreground mt-0.5">{l.fromDate} → {l.toDate} · {l.leaveType}</p>
                  <p className="text-sm text-muted-foreground mt-1">{l.reason}</p>
                </div>
                <motion.span
                  key={l.status}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className={`text-xs mono uppercase tracking-widest px-3 py-1.5 rounded-full border ${s.cls}`}
                >{s.label}</motion.span>
                {canReview && l.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => review(l, 'approved')} className="h-10 w-10 rounded-full border border-secondary/60 text-secondary hover:bg-secondary/10 grid place-items-center transition-colors" data-testid={`approve-${l._id}`}><Check size={16} /></button>
                    <button onClick={() => review(l, 'rejected')} className="h-10 w-10 rounded-full border border-primary/60 text-primary hover:bg-primary/10 grid place-items-center transition-colors" data-testid={`reject-${l._id}`}><X size={16} /></button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            <motion.aside
              initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] bg-card border-l border-border z-50 overflow-y-auto"
              data-testid="leave-drawer"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <p className="overline">New</p>
                  <h3 className="font-serif text-2xl mt-1">Apply for Leave</h3>
                </div>
                <button onClick={() => setDrawer(false)} className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted"><X size={16} /></button>
              </div>
              <form onSubmit={submit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="overline mb-1">From</p>
                    <input type="date" value={form.fromDate} onChange={e => setForm({...form, fromDate: e.target.value})} required className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:border-primary outline-none mono text-sm" data-testid="leave-from" />
                  </div>
                  <div>
                    <p className="overline mb-1">To</p>
                    <input type="date" value={form.toDate} onChange={e => setForm({...form, toDate: e.target.value})} required className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:border-primary outline-none mono text-sm" data-testid="leave-to" />
                  </div>
                </div>
                <div>
                  <p className="overline mb-1">Type</p>
                  <div className="flex flex-wrap gap-2">
                    {['casual', 'medical', 'personal', 'emergency'].map(t => (
                      <button type="button" key={t} onClick={() => setForm({...form, leaveType: t})} className={`text-xs mono px-3 py-1.5 rounded-full border ${form.leaveType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`} data-testid={`leave-type-${t}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="overline mb-1">Reason</p>
                  <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required rows={4} placeholder="Kindly describe the reason for your leave…" className="w-full p-3 rounded-lg border border-border bg-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none" data-testid="leave-reason" />
                </div>
                <button type="submit" disabled={saving} className="btn-magnetic w-full justify-center" data-testid="submit-leave">
                  {saving ? 'Submitting…' : 'Submit Request'}
                </button>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
