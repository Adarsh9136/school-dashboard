import React from 'react';
import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-6 border border-dashed border-border rounded-2xl"
      data-testid="empty-state"
    >
      {Icon && (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto h-14 w-14 rounded-2xl border border-border grid place-items-center text-muted-foreground bg-muted/40"
        >
          <Icon size={22} />
        </motion.div>
      )}
      <h3 className="mt-4 text-lg font-serif">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
