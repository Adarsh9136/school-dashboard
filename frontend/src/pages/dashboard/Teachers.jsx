import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users2, Plus, X, Copy, Check } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import EmptyState from '@/components/common/EmptyState';

const emptyForm = {
  employeeId: '', fullName: '', email: '', phone: '',
  subjects: '', classes: [], qualification: '', joiningDate: '',
  username: '', password: '',
};
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

const sections = ['A', 'B', 'C'];
function suggestUsername(fullName) {
  if (!fullName) return '';
  const first = fullName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
  return first ? `t.${first}` : '';
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let p = 'T'; // start uppercase for readability
  for (let i = 0; i < 7; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p + '@1';
}

export default function Teachers() {
  const { user } = useAuth();
  const canEdit = ['principal', 'admin'].includes(user.role);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null); // { teacher, user }
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/teachers'); setItems(data); } catch(e){}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ ...emptyForm, password: generatePassword() });
    setCreated(null);
    setDrawer(true);
  };

  const onNameChange = (v) => {
    setForm(f => ({
      ...f,
      fullName: v,
      username: f.username || suggestUsername(v),
    }));
  };

  const classOptions = grades.flatMap(grade =>
    sections.map(section => `${grade}-${section}`)
  );

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...form,
        subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
        classes: form.classes,
      };
      const { data } = await api.post('/teachers/with-user', payload);
      setCreated(data);
      toast.success(`${data.teacher.fullName} added — login credentials generated`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed');
    }
    setSaving(false);
  };

  const copyCreds = () => {
    if (!created) return;
    const text = `Username: ${created.user.username}\nPassword: ${form.password}\nLogin at: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Credentials copied');
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="overline">Faculty</p>
          <h1 className="font-serif text-4xl mt-2">Teachers</h1>
          <p className="text-muted-foreground mt-1">{items.length} educators on staff</p>
        </div>
        {canEdit && (
          <button onClick={openNew} className="btn-magnetic text-sm py-2" data-testid="add-teacher-btn">
            <Plus size={16} /> Add Teacher
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="skeleton h-48" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Users2} title="No teachers yet" description={canEdit ? 'Click "Add Teacher" to onboard your first educator.' : ''} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t, i) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative rounded-2xl border border-border bg-card p-6 card-lift overflow-hidden"
              data-testid={`teacher-card-${t.employeeId}`}
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center font-serif text-xl">{t.fullName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-lg leading-tight">{t.fullName}</p>
                  <p className="text-xs mono text-muted-foreground mt-1">{t.employeeId}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.qualification}</p>
                </div>
              </div>
              {t.subjects?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {t.subjects.map(s => (
                    <span key={s} className="text-[10px] mono uppercase tracking-widest px-2 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/30">{s}</span>
                  ))}
                </div>
              )}
              {t.classes?.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">Classes: <span className="mono text-foreground">{t.classes.join(', ')}</span></p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            <motion.aside
              initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] bg-card border-l border-border z-50 overflow-y-auto"
              data-testid="teacher-drawer"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <p className="overline">New</p>
                  <h3 className="font-serif text-2xl mt-1">Add Teacher</h3>
                </div>
                <button onClick={() => setDrawer(false)} className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted"><X size={16} /></button>
              </div>

              {created ? (
                <div className="p-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="rounded-2xl border border-secondary/50 bg-secondary/5 p-5"
                    data-testid="teacher-created-success"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary/15 text-secondary grid place-items-center">
                        <Check size={18} />
                      </div>
                      <div>
                        <p className="font-serif text-lg">Teacher created</p>
                        <p className="text-xs mono text-muted-foreground">Share these credentials with {created.teacher.fullName}</p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-2 text-sm">
                      <div className="rounded-lg border border-border bg-background p-3">
                        <p className="overline">Username</p>
                        <p className="mono mt-1" data-testid="new-teacher-username">{created.user.username}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-background p-3">
                        <p className="overline">Temporary Password</p>
                        <p className="mono mt-1" data-testid="new-teacher-password">{form.password}</p>
                      </div>
                    </div>
                    <button onClick={copyCreds} className="btn-ghost-line w-full mt-4 justify-center text-sm py-2" data-testid="copy-teacher-creds">
                      {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy credentials</>}
                    </button>
                  </motion.div>
                  <button onClick={() => { setDrawer(false); setCreated(null); }} className="btn-magnetic w-full justify-center mt-4">Done</button>
                </div>
              ) : (
                <form onSubmit={save} className="p-6 space-y-4">
                  <p className="overline">Teacher Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <TextField label="Employee ID" value={form.employeeId} onChange={v => setForm({ ...form, employeeId: v })} required testId="tf-empid" />
                    <TextField label="Full Name" value={form.fullName} onChange={onNameChange} required testId="tf-name" />
                    <TextField label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} testId="tf-email" />
                    <TextField label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} testId="tf-phone" />
                    <TextField label="Qualification" value={form.qualification} onChange={v => setForm({ ...form, qualification: v })} testId="tf-qual" />
                    <TextField label="Joining Date" value={form.joiningDate} onChange={v => setForm({ ...form, joiningDate: v })} placeholder="YYYY-MM-DD" testId="tf-joining" />
                  </div>
                  <TextField label="Subjects (comma-separated)" value={form.subjects} onChange={v => setForm({ ...form, subjects: v })} testId="tf-subjects" />
                  <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Classes
                  </label>

                  <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto border border-border rounded-lg p-3">
                    {classOptions.map((cls) => (
                      <label
                        key={cls}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={(form.classes || []).includes(cls)}
                          onChange={(e) => {
                            const current = form.classes || [];

                            if (e.target.checked) {
                              setForm({
                                ...form,
                                classes: [...current, cls]
                              });
                            } else {
                              setForm({
                                ...form,
                                classes: current.filter(c => c !== cls)
                              });
                            }
                          }}
                        />
                        {cls}
                      </label>
                    ))}
                  </div>
                </div>
                  <div className="pt-2">
                    <p className="overline">Login Credentials</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">This teacher will use these to sign in. Passwords can be changed later.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <TextField label="Username" value={form.username} onChange={v => setForm({ ...form, username: v })} required testId="tf-username" />
                    <div className="relative">
                      <TextField label="Password" value={form.password} onChange={v => setForm({ ...form, password: v })} required testId="tf-password" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, password: generatePassword() }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] mono uppercase tracking-widest text-primary hover:underline" data-testid="tf-regen-pwd">
                        regen
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={saving} className="btn-magnetic w-full justify-center mt-2" data-testid="save-teacher">
                    {saving ? 'Creating…' : 'Create Teacher & Login'}
                  </button>
                </form>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function TextField({ label, value, onChange, required, placeholder, type = 'text', testId }) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ' '}
        required={required}
        data-testid={testId}
        className="peer w-full h-12 px-3 pt-4 rounded-lg bg-transparent border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
      />
      <label className={`absolute left-3 pointer-events-none transition-all duration-200 ${value ? 'top-1.5 text-[9px]' : 'top-3.5 text-xs'} uppercase tracking-widest text-muted-foreground peer-focus:top-1.5 peer-focus:text-[9px]`}>
        {label}
      </label>
    </div>
  );
}
