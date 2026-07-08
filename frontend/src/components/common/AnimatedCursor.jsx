import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function AnimatedCursor() {
  const [hoverInteractive, setHoverInteractive] = useState(false);
  const x = useSpring(0, { stiffness: 500, damping: 40, mass: 0.4 });
  const y = useSpring(0, { stiffness: 500, damping: 40, mass: 0.4 });
  const rx = useSpring(0, { stiffness: 120, damping: 20 });
  const ry = useSpring(0, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const move = (e) => {
      x.set(e.clientX); y.set(e.clientY);
      rx.set(e.clientX); ry.set(e.clientY);
      const el = e.target;
      const interactive = el.closest && el.closest('a,button,input,textarea,select,[role="button"],[data-cursor-hover]');
      setHoverInteractive(!!interactive);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y, rx, ry]);

  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y, opacity: hoverInteractive ? 0 : 1 }} />
      <motion.div
        className="cursor-ring"
        style={{
          x: rx, y: ry,
          width: hoverInteractive ? 56 : 40,
          height: hoverInteractive ? 56 : 40,
        }}
      />
    </>
  );
}
