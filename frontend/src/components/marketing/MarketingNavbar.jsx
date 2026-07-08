import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Sun, Moon, LogIn } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const nav = [
  { to: '/', label: 'Home' },
  { to: '/#programs', label: 'Programs' },
  { to: '/#news', label: 'News' },
  { to: '/#campus', label: 'Campus' },
  { to: '/admission', label: 'Admissions' },
];

export default function MarketingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', on);
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 glass-navbar transition-[padding,background-color] duration-300 ${scrolled ? 'py-2' : 'py-4'}`}
      data-testid="marketing-navbar"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" data-testid="brand-link">
          <div className="relative h-9 w-9 rounded-lg border-2 border-primary grid place-items-center">
            <span className="font-serif text-lg font-bold text-primary">R</span>
            <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="font-serif text-base font-semibold tracking-tight">Resonance</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mono">International School</p>
          </div>
        </Link>
        <nav className="hidden lg:flex items-center gap-8 text-sm">
          {nav.map(n => (
            <a key={n.to} href={n.to} className="link-underline text-foreground/80 hover:text-foreground" data-testid={`nav-${n.label.toLowerCase()}`}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="h-10 w-10 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors" data-testid="theme-toggle" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="btn-magnetic text-sm py-2" data-testid="go-dashboard">
              Dashboard
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="btn-magnetic text-sm py-2" data-testid="nav-login">
              <LogIn size={14} /> Sign In
            </button>
          )}
          <button className="lg:hidden h-10 w-10 rounded-full border border-border grid place-items-center" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle" aria-label="Menu">
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl"
        >
          <div className="px-6 py-4 flex flex-col gap-3">
            {nav.map((n, i) => (
              <motion.a
                key={n.to}
                href={n.to}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setOpen(false)}
                className="text-base py-2 border-b border-border/40"
              >{n.label}</motion.a>
            ))}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
