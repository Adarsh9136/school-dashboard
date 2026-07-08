import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Magnetic button: element gently follows cursor within its bounds
export default function MagneticButton({ children, className = '', onClick, ...rest }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const rx = e.clientX - rect.left - rect.width / 2;
    const ry = e.clientY - rect.top - rect.height / 2;
    x.set(rx * 0.25);
    y.set(ry * 0.25);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
