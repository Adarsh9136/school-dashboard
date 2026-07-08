import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import MagneticButton from '@/components/common/MagneticButton';
import AmbientBackground from '@/components/common/AmbientBackground';
import CountUp from 'react-countup';

const words = ['Wisdom.', 'Character.', 'Legacy.'];

export default function Hero() {
  const [wordIdx, setWordIdx] = useState(0);
  const heroRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const rotateX = useTransform(sy, [-200, 200], [4, -4]);
  const rotateY = useTransform(sx, [-200, 200], [-4, 4]);

  useEffect(() => {
    const t = setInterval(() => setWordIdx(w => (w + 1) % words.length), 2600);
    return () => clearInterval(t);
  }, []);

  const onMouseMove = (e) => {
    const rect = heroRef.current.getBoundingClientRect();
    mx.set(e.clientX - rect.left - rect.width / 2);
    my.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={onMouseMove}
      className="relative min-h-[100vh] pt-32 pb-20 overflow-hidden"
      data-testid="hero-section"
    >
      <AmbientBackground intensity="high" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-16 items-center">
          {/* Left copy */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="overline flex items-center gap-2"
            >
              <Sparkles size={12} className="text-accent" />
              Established 1989 · Mumbai
            </motion.p>
            <h1 className="mt-6 font-serif font-semibold text-5xl sm:text-6xl lg:text-7xl leading-[0.98] tracking-tight text-balance">
              {'Where legacy'.split(' ').map((w, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-3"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >{w}</motion.span>
              ))}
              <br />
              {'meets'.split(' ').map((w, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-3"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >{w}</motion.span>
              ))}
              <motion.span
                key={wordIdx}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="brand-gradient-text italic"
              >
                {words[wordIdx]}
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              An institution built on 35 years of academic rigor, guided mentorship, and an unwavering commitment to nurturing minds prepared for a complex world.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link to="/admission">
                <MagneticButton className="btn-magnetic" data-testid="hero-cta-admission">
                  Begin Admission <ArrowRight size={16} />
                </MagneticButton>
              </Link>
              <Link to="/login">
                <MagneticButton className="btn-ghost-line" data-testid="hero-cta-login">
                  Parent / Staff Portal
                </MagneticButton>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-14 grid grid-cols-3 gap-6 max-w-lg"
            >
              {[
                { n: 2400, s: '+', l: 'Alumni' },
                { n: 98, s: '%', l: 'Board Pass' },
                { n: 35, s: 'y', l: 'Heritage' },
              ].map((x, i) => (
                <div key={i} className="border-l border-border pl-4">
                  <p className="font-serif text-3xl font-semibold">
                    <CountUp end={x.n} duration={2.4} />{x.s}
                  </p>
                  <p className="overline mt-1">{x.l}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right visual */}
          <motion.div
            style={{ rotateX, rotateY, transformPerspective: 1000 }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl shadow-primary/10">
              <motion.img
                src="https://images.unsplash.com/photo-1758611228434-7b5b697abd0a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBzY2hvb2wlMjBidWlsZGluZyUyMGNhbXB1cyUyMGV4dGVyaW9yfGVufDB8fHx8MTc4MzUzNDQyOHww&ixlib=rb-4.1.0&q=85"
                alt="Campus"
                className="w-full h-[520px] object-cover"
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/10 to-transparent" />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <p className="overline">Now Accepting</p>
                    <p className="font-serif text-lg">Grades V — XII · 2026–27</p>
                  </div>
                </div>
              </motion.div>
            </div>
            <motion.div
              className="absolute -top-6 -left-6 h-16 w-16 rounded-2xl border border-accent/50 bg-accent/10 backdrop-blur"
              animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-8 -right-4 h-20 w-20 rounded-full border border-primary/50"
              animate={{ y: [0, 8, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
