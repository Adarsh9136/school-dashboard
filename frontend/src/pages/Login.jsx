import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AmbientBackground from '@/components/common/AmbientBackground';
import { toast } from 'sonner';

const quickAccounts = [
  { role: 'Principal', username: 'principal', password: 'Principal@123' },
  { role: 'Teacher', username: 't.kavita', password: 'Teacher@123' },
  { role: 'Parent', username: 'parent.gupta', password: 'Parent@123' },
  { role: 'Accountant', username: 'accountant', password: 'Account@123' },
  { role: 'Admin', username: 'admin', password: 'Admin@123' },
];

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [shake, setShake] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Welcome back to Resonance.');
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid credentials');
      setShake(true); setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const fill = (acc) => setForm({ username: acc.username, password: acc.password });

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] relative overflow-hidden">
      {/* Left panel */}
      <div className="relative hidden lg:block">
        <AmbientBackground intensity="high" />
        <div className="relative h-full p-12 flex flex-col justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="login-back-home">
            <div className="h-10 w-10 rounded-lg border-2 border-primary grid place-items-center">
              <span className="font-serif text-lg font-bold text-primary">R</span>
            </div>
            <div>
              <p className="font-serif text-base font-semibold">Resonance</p>
              <p className="overline">International School</p>
            </div>
          </Link>
          <div className="max-w-md">
            <p className="overline">Portal Login</p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight">
              A quieter, more thoughtful <span className="italic brand-gradient-text">school portal.</span>
            </h1>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Attendance, timetables, fee status, announcements — everything you need, nothing you don't. Secure by design, calm by intent.
            </p>
            <div className="mt-10 flex items-center gap-3 text-xs mono text-muted-foreground">
              <ShieldCheck size={14} className="text-secondary" />
              End-to-end encrypted · Audit logged · SOC-2 aligned
            </div>
          </div>
          <p className="text-xs mono text-muted-foreground">© 2026 Resonance International School</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-8 lg:p-16 bg-background relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md ${shake ? 'animate-shake' : ''}`}
        >
          <h2 className="font-serif text-4xl">Welcome back.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with your Resonance credentials.</p>

          <form onSubmit={submit} className="mt-10 space-y-4" data-testid="login-form">
            <div className="relative">
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                placeholder=" "
                className="peer w-full h-14 px-4 pt-5 rounded-xl bg-transparent border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                data-testid="input-username"
              />
              <label className={`absolute left-4 pointer-events-none transition-all duration-200 ${form.username ? 'top-2 text-[10px] uppercase tracking-widest text-muted-foreground' : 'top-4 text-sm text-muted-foreground'} peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest`}>
                Username
              </label>
            </div>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                placeholder=" "
                className="peer w-full h-14 px-4 pt-5 pr-12 rounded-xl bg-transparent border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                data-testid="input-password"
              />
              <label className={`absolute left-4 pointer-events-none transition-all duration-200 ${form.password ? 'top-2 text-[10px] uppercase tracking-widest text-muted-foreground' : 'top-4 text-sm text-muted-foreground'} peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest`}>
                Password
              </label>
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="toggle-password">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive mono"
                data-testid="login-error"
              >{error}</motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-magnetic w-full justify-center disabled:opacity-60"
              data-testid="submit-login"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-8">
            <p className="overline mb-3">Demo accounts · one-tap login</p>
            <div className="flex flex-wrap gap-2">
              {quickAccounts.map(a => (
                <button
                  key={a.role}
                  onClick={() => fill(a)}
                  className="text-xs px-3 py-2 rounded-full border border-border hover:border-primary hover:text-primary transition-colors mono"
                  data-testid={`demo-${a.role.toLowerCase()}`}
                >{a.role}</button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
