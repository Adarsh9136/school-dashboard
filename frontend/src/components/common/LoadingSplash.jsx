import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingSplash({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[10000] bg-background grid place-items-center"
          data-testid="loading-splash"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto h-16 w-16 rounded-2xl border-2 border-primary grid place-items-center relative"
            >
              <motion.span
                className="font-serif text-3xl font-bold text-primary"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >R</motion.span>
              <motion.span
                className="absolute inset-0 rounded-2xl border-2 border-accent/70"
                animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 overline"
            >Resonance International School</motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
