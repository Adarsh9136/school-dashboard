import React from 'react';
import { motion } from 'framer-motion';

// Ambient background: aurora blobs + floating particles + soft grain grid
export default function AmbientBackground({ intensity = 'normal' }) {
  const particles = Array.from({ length: intensity === 'high' ? 22 : 12 });
  return (
    <div className="aurora-bg" aria-hidden="true">
      <div className="absolute inset-0 grid-etched opacity-40 dark:opacity-20" />
      <motion.div
        className="aurora-blob"
        style={{ top: '-10rem', left: '-8rem', background: 'radial-gradient(circle, #7A1022 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="aurora-blob"
        style={{ bottom: '-14rem', right: '-6rem', background: 'radial-gradient(circle, #C4A454 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="aurora-blob"
        style={{ top: '30%', left: '55%', background: 'radial-gradient(circle, #1E3F2D 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      />
      {particles.map((_, i) => {
        const size = 3 + Math.random() * 5;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 6;
        const dur = 8 + Math.random() * 8;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-accent/50"
            style={{ width: size, height: size, left: `${left}%`, top: `${top}%`, filter: 'blur(1px)' }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: dur, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        );
      })}
    </div>
  );
}
