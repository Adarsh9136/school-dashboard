import React from 'react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, suffix = '', prefix = '', icon: Icon, tone = 'primary', trend, testId }) {
  const toneMap = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    secondary: 'from-secondary/25 to-secondary/5 text-secondary',
    accent: 'from-accent/25 to-accent/5 text-accent',
    ink: 'from-foreground/10 to-foreground/5 text-foreground',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="relative rounded-2xl border border-border bg-card p-5 card-lift overflow-hidden"
      data-testid={testId}
    >
      <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${toneMap[tone]} opacity-70 blur-2xl`} />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="overline">{label}</p>
          <p className="mt-2 text-4xl font-serif font-semibold tracking-tight">
            {prefix}<CountUp end={Number(value) || 0} duration={1.6} separator="," />{suffix}
          </p>
          {trend && <p className="mt-1 text-xs text-muted-foreground mono">{trend}</p>}
        </div>
        {Icon && (
          <div className={`shrink-0 h-11 w-11 grid place-items-center rounded-xl border border-border ${toneMap[tone]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
