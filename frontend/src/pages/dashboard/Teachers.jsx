import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users2 } from 'lucide-react';
import api from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';

export default function Teachers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teachers').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <p className="overline">Faculty</p>
        <h1 className="font-serif text-4xl mt-2">Teachers</h1>
        <p className="text-muted-foreground mt-1">{items.length} educators on staff</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="skeleton h-48" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Users2} title="No teachers yet" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t, i) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative rounded-2xl border border-border bg-card p-6 card-lift overflow-hidden"
              data-testid={`teacher-card-${t.employeeId}`}
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center font-serif text-xl">{t.fullName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-lg leading-tight">{t.fullName}</p>
                  <p className="text-xs mono text-muted-foreground mt-1">{t.employeeId}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.qualification}</p>
                </div>
              </div>
              {t.subjects?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {t.subjects.map(s => (
                    <span key={s} className="text-[10px] mono uppercase tracking-widest px-2 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/30">{s}</span>
                  ))}
                </div>
              )}
              {t.classes?.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">Classes: <span className="mono text-foreground">{t.classes.join(', ')}</span></p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
