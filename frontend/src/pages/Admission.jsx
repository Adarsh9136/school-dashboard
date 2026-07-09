import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import Footer from '@/components/marketing/Footer';
import AmbientBackground from '@/components/common/AmbientBackground';
import { toast } from 'sonner';
import api from '@/lib/api';

const grades = [
  'Nursery',
  'LKG',
  'UKG',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII'
];

function FloatingInput({ label, name, type = 'text', value, onChange, required, testId }) {
  const has = !!value;
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder=" "
        data-testid={testId}
        className="peer w-full h-14 px-4 pt-5 rounded-xl bg-transparent border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-[border-color,box-shadow] text-foreground"
      />
      <label className={`absolute left-4 pointer-events-none transition-all duration-200 ${has ? 'top-2 text-[10px] uppercase tracking-widest text-muted-foreground' : 'top-4 text-sm text-muted-foreground'} peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest`}>
        {label}
      </label>
    </div>
  );
}

export default function Admission() {
  const [form, setForm] = useState({ childName: '', parentName: '', email: '', phone: '', classAppliedFor: 'V', currentSchool: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api.post('/enquiries/public', form);
      setDone(true);
      toast.success('Enquiry received. We will connect with you soon.');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Something went wrong';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <MarketingNavbar />
      <section className="relative pt-40 pb-24 overflow-hidden">
        <AmbientBackground />
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start relative">
          <div className="lg:sticky lg:top-32">
            <p className="overline">Admissions 2026 – 27</p>
            <h1 className="mt-6 font-serif text-5xl sm:text-6xl leading-[1.02] tracking-tight text-balance">
              Begin the conversation.<br/>
              <span className="italic brand-gradient-text">Personally.</span>
            </h1>
            <p className="mt-8 text-muted-foreground leading-relaxed max-w-md">
              Every admission at Resonance begins with a conversation — not a form. Share a few details and our Head of Admissions will reach out within 48 hours.
            </p>
            <div className="mt-10 space-y-4">
              {[
                'Personalized campus tour by appointment',
                'Meet the Principal & Head of Admissions',
                'Learn about our scholarship programme',
              ].map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-3 text-sm"
                >
                  <CheckCircle2 size={16} className="text-primary" />
                  {t}
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-border bg-card p-10 text-center"
                data-testid="enquiry-success"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="mx-auto h-16 w-16 rounded-full bg-secondary/15 text-secondary grid place-items-center"
                >
                  <CheckCircle2 size={28} />
                </motion.div>
                <h2 className="mt-6 font-serif text-3xl">Thank you.</h2>
                <p className="mt-3 text-muted-foreground max-w-sm mx-auto">Your enquiry is with our admissions team. We will connect with you within 48 hours.</p>
              </motion.div>
            ) : (
              <motion.form
                onSubmit={submit}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-border bg-card p-8 space-y-4"
                data-testid="admission-form"
              >
                <FloatingInput label="Child's Full Name" name="childName" value={form.childName} onChange={change} required testId="input-child-name" />
                <FloatingInput label="Parent / Guardian Name" name="parentName" value={form.parentName} onChange={change} required testId="input-parent-name" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FloatingInput label="Email" name="email" type="email" value={form.email} onChange={change} required testId="input-email" />
                  <FloatingInput label="Phone" name="phone" value={form.phone} onChange={change} required testId="input-phone" />
                </div>
                <div>
                  <label className="overline mb-2 block">Grade Applying For</label>
                  <div className="flex flex-wrap gap-2">
                    {grades.map(g => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setForm({ ...form, classAppliedFor: g })}
                        className={`h-10 px-4 rounded-full border text-sm mono transition-[background-color,color,border-color] ${form.classAppliedFor === g ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}
                        data-testid={`grade-pill-${g}`}
                      >{g}</button>
                    ))}
                  </div>
                </div>
                <FloatingInput label="Current School (optional)" name="currentSchool" value={form.currentSchool} onChange={change} testId="input-current-school" />
                <div className="relative">
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={change}
                    placeholder=" "
                    rows={3}
                    data-testid="input-message"
                    className="peer w-full px-4 pt-5 pb-3 rounded-xl bg-transparent border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                  <label className={`absolute left-4 pointer-events-none transition-all duration-200 ${form.message ? 'top-2 text-[10px] uppercase tracking-widest text-muted-foreground' : 'top-4 text-sm text-muted-foreground'} peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest`}>
                    Anything you'd like to share
                  </label>
                </div>
                {error && <p className="text-sm text-destructive animate-shake mono">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-magnetic w-full justify-center disabled:opacity-60"
                  data-testid="submit-enquiry"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </span>
                  ) : (
                    <>Submit enquiry <ArrowRight size={16} /></>
                  )}
                </button>
              </motion.form>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
