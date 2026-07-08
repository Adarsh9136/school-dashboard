import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Check } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import EmptyState from '@/components/common/EmptyState';

export default function Fees() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const canMark = ['accountant', 'principal', 'admin'].includes(user.role);
  const isParent = user.role === 'parent';

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/fees'); setItems(data); } catch(e){}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markPaid = async (f) => {
    try {
      await api.post(`/fees/${f._id}/mark-paid`, { paymentMode: 'offline' });
      toast.success(`Fee for ${f.studentName} marked as Paid`);
      load();
    } catch (e) { toast.error('Failed'); }
  };

  const sendReminders = async () => {
    try {
      const { data } = await api.post('/fees/send-reminders');
      toast.success(`${data.sent} reminders sent`);
    } catch (e) { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="overline">{isParent ? 'For your child(ren)' : 'Ledger'}</p>
          <h1 className="font-serif text-4xl mt-2">Fee Status</h1>
          <p className="text-muted-foreground mt-1">{isParent ? 'Shows only status. Amounts are not displayed.' : 'Mark monthly fees as received. Amounts intentionally hidden from the portal.'}</p>
        </div>
        {canMark && (
          <button onClick={sendReminders} className="btn-ghost-line text-sm py-2" data-testid="send-reminders">
            Send pending reminders
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-2">{Array.from({length:5}).map((_,i)=><div key={i} className="skeleton h-16" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Wallet} title="No fee records" />
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 mono text-xs uppercase tracking-widest text-muted-foreground text-left">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Month</th>
                <th className="p-4">Due</th>
                <th className="p-4">Status</th>
                {canMark && <th className="p-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((f, i) => (
                <motion.tr
                  key={f._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                  data-testid={`fee-row-${f._id}`}
                >
                  <td className="p-4">{f.studentName}</td>
                  <td className="p-4 mono">{f.month}</td>
                  <td className="p-4 mono">{f.dueDate}</td>
                  <td className="p-4">
                    <motion.span
                      initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                      className={`text-xs mono uppercase tracking-widest px-3 py-1 rounded-full border ${f.status === 'paid' ? 'border-secondary/50 bg-secondary/10 text-secondary' : 'border-primary/50 bg-primary/10 text-primary'}`}
                    >{f.status}</motion.span>
                  </td>
                  {canMark && (
                    <td className="p-4 text-right">
                      {f.status === 'pending' ? (
                        <button onClick={() => markPaid(f)} className="inline-flex items-center gap-1 text-xs mono px-3 py-1.5 rounded-full border border-secondary/50 text-secondary hover:bg-secondary/10 transition-colors" data-testid={`mark-paid-${f._id}`}>
                          <Check size={12} /> Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs mono text-muted-foreground">Paid {f.paidOn}</span>
                      )}
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
