import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronUp, X, Trash2, Edit3, GraduationCap } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import EmptyState from '@/components/common/EmptyState';

const emptyForm = { prn: '', fullName: '', className: 'VII', section: 'A', gender: '', dob: '', bloodGroup: '', address: '', parentName: '', parentPhone: '' };
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

export default function Students() {
  const { user } = useAuth();
  const canEdit = ['principal', 'admin'].includes(user.role);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState(null); // null | 'new' | student object
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/students', { params: search ? { search } : {} });
      setItems(data);
    } catch (e) { toast.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search]);

  const openNew = () => { setForm(emptyForm); setDrawer('new'); };
  const openEdit = (s) => { setForm({ ...emptyForm, ...s }); setDrawer(s); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (drawer === 'new') {
        const { data } = await api.post('/students', form);
        if (data.parentUser) {
          toast.success(`Student added. Parent login: ${data.parentUser.username} / Parent@123`);
        } else {
          toast.success('Student added');
        }
      } else {
        await api.patch(`/students/${drawer._id}`, form);
        toast.success('Student updated');
      }
      setDrawer(null); load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed');
    }
    setSaving(false);
  };

  const remove = async (s) => {
    if (!window.confirm(`Deactivate ${s.fullName}?`)) return;
    await api.delete(`/students/${s._id}`);
    toast.success('Deactivated');
    load();
  };

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="overline">Roster</p>
          <h1 className="font-serif text-4xl mt-2">Students</h1>
          <p className="text-muted-foreground mt-1">{items.length} active enrolments</p>
        </div>
        {canEdit && (
          <button onClick={openNew} className="btn-magnetic text-sm py-2" data-testid="add-student-btn">
            <Plus size={16} /> Add Student
          </button>
        )}
      </div>

      <div className="mb-6 relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by PRN or name…"
          className="w-full h-11 pl-10 pr-4 rounded-full bg-muted/50 border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          data-testid="student-search"
        />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students found" description="Try clearing the search or add a new enrolment." />
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm" data-testid="students-table">
            <thead className="bg-muted/40 text-left mono text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4">PRN</th>
                <th className="p-4">Name</th>
                <th className="p-4">Class</th>
                <th className="p-4">Class ID</th>
                <th className="p-4">Parent</th>
                {canEdit && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((s, i) => (
                <motion.tr
                  key={s._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4 mono">{s.prn}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-serif">{s.fullName[0]}</div>
                      {s.fullName}
                    </div>
                  </td>
                  <td className="p-4 mono">{s.className}-{s.section}</td>
                  <td className="p-4 mono text-xs text-muted-foreground">{s.classId}</td>
                  <td className="p-4">{s.parentName || <span className="text-muted-foreground">—</span>}</td>
                  {canEdit && (
                    <td className="p-4 text-right">
                      <button onClick={() => openEdit(s)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted transition-colors mr-1" data-testid={`edit-student-${s._id}`}><Edit3 size={14} /></button>
                      <button onClick={() => remove(s)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors" data-testid={`del-student-${s._id}`}><Trash2 size={14} /></button>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            <motion.aside
              initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-card border-l border-border z-50 overflow-y-auto"
              data-testid="student-drawer"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <p className="overline">{drawer === 'new' ? 'New' : 'Edit'}</p>
                  <h3 className="font-serif text-2xl mt-1">Student Record</h3>
                </div>
                <button onClick={() => setDrawer(null)} className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted"><X size={16} /></button>
              </div>
              <form onSubmit={save} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="PRN" value={form.prn} disabled={drawer !== 'new'} onChange={v => setForm({ ...form, prn: v })} required testId="field-prn" />
                  <TextField label="Full Name" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} required testId="field-name" />
                  <SelectField
                    label="Class"
                    value={form.className}
                    onChange={v => setForm({ ...form, className: v })}
                    options={grades}
                    testId="field-class"
                  />

                  <SelectField
                    label="Section"
                    value={form.section}
                    onChange={v => setForm({ ...form, section: v })}
                    options={sections}
                    testId="field-section"
                  />
                  <TextField label="Date of Birth" value={form.dob} onChange={v => setForm({ ...form, dob: v })} placeholder="YYYY-MM-DD" testId="field-dob" />
                  <TextField label="Gender" value={form.gender} onChange={v => setForm({ ...form, gender: v })} testId="field-gender" />
                  <TextField label="Blood Group" value={form.bloodGroup} onChange={v => setForm({ ...form, bloodGroup: v })} testId="field-blood" />
                  <TextField label="Parent Name" value={form.parentName} onChange={v => setForm({ ...form, parentName: v })} testId="field-parent-name" />
                  <TextField label="Parent Phone" value={form.parentPhone} onChange={v => setForm({ ...form, parentPhone: v })} testId="field-parent-phone" />
                </div>
                <TextField label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} testId="field-address" />
                {form.parentPhone && drawer === 'new' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-accent/50 bg-accent/5 p-4 text-sm"
                    data-testid="parent-login-preview"
                  >
                    <p className="overline text-accent-foreground">Parent Login (auto-created)</p>
                    <p className="mt-2">Username: <span className="mono font-medium">{form.parentPhone.replace(/[^0-9+]/g, '').replace(/^\+/, '')}</span></p>
                    <p className="mt-1">Password: <span className="mono font-medium">Parent@123</span> <span className="text-xs text-muted-foreground">(default — parent can change on first login)</span></p>
                  </motion.div>
                )}
                <button type="submit" disabled={saving} className="btn-magnetic w-full justify-center" data-testid="save-student">
                  {saving ? 'Saving…' : (drawer === 'new' ? 'Create Student' : 'Save Changes')}
                </button>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SelectField({ label, value, onChange, options, testId }) {
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="w-full h-12 px-3 rounded-lg bg-transparent border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <label className="absolute left-3 -top-2 bg-card px-1 text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
    </div>
  );
}

function TextField({ label, value, onChange, required, placeholder, disabled, testId }) {
  return (
    <div className="relative">
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ' '}
        disabled={disabled}
        required={required}
        data-testid={testId}
        className="peer w-full h-12 px-3 pt-4 rounded-lg bg-transparent border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm disabled:opacity-60"
      />
      <label className={`absolute left-3 pointer-events-none transition-all duration-200 ${value ? 'top-1.5 text-[9px]' : 'top-3.5 text-xs'} uppercase tracking-widest text-muted-foreground peer-focus:top-1.5 peer-focus:text-[9px]`}>
        {label}
      </label>
    </div>
  );
}
