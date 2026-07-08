import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Megaphone, Newspaper } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import EmptyState from '@/components/common/EmptyState';

export default function Announcements({ isNewsMode = false }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', imageUrl: '', audience: 'all', isNews: isNewsMode });
  const canPost = ['principal', 'admin'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/announcements', { params: { isNews: isNewsMode } }); setItems(data); } catch(e){}
    setLoading(false);
  };
  useEffect(() => { load(); setForm(f => ({ ...f, isNews: isNewsMode })); /* eslint-disable-next-line */ }, [isNewsMode]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', form);
      toast.success(isNewsMode ? 'News post published' : 'Announcement sent');
      setModal(false); setForm({ title: '', body: '', imageUrl: '', audience: 'all', isNews: isNewsMode });
      load();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    await api.delete(`/announcements/${a._id}`);
    load();
  };

  return (
    <div>
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="overline">{isNewsMode ? 'Campus Dispatch' : 'Broadcasts'}</p>
          <h1 className="font-serif text-4xl mt-2">{isNewsMode ? 'News Feed' : 'Announcements'}</h1>
          <p className="text-muted-foreground mt-1">{isNewsMode ? 'Latest stories from Resonance.' : 'Communications from the school office.'}</p>
        </div>
        {canPost && (
          <button onClick={() => setModal(true)} className="btn-magnetic text-sm py-2" data-testid={isNewsMode ? 'add-news-btn' : 'add-announcement-btn'}>
            <Plus size={14} /> {isNewsMode ? 'New Post' : 'New Announcement'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-48" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={isNewsMode ? Newspaper : Megaphone} title={isNewsMode ? 'No news posts yet' : 'No announcements yet'} description={canPost ? 'Post the first one to keep everyone informed.' : ''} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((a, i) => (
            <motion.article
              key={a._id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative rounded-2xl border border-border bg-card overflow-hidden card-lift"
              data-testid={`ann-card-${a._id}`}
            >
              {a.imageUrl && (
                <div className="h-48 overflow-hidden">
                  <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="overline">{new Date(a.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}</span>
                  <span className="text-[10px] mono uppercase tracking-widest px-2 py-0.5 rounded-full border border-border">{a.audience}</span>
                </div>
                <h3 className="mt-3 font-serif text-xl leading-tight">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{a.body}</p>
                <p className="mt-3 text-xs mono text-muted-foreground">— {a.postedByName}</p>
                {canPost && (
                  <button onClick={() => remove(a)} className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-md bg-background/70 border border-border hover:text-destructive hover:border-destructive transition-colors" data-testid={`del-ann-${a._id}`}><Trash2 size={12} /></button>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 grid place-items-center p-4" onClick={() => setModal(false)}>
            <motion.form
              initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
              onClick={e => e.stopPropagation()} onSubmit={submit}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4"
              data-testid="ann-modal"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl">{isNewsMode ? 'New News Post' : 'New Announcement'}</h3>
                <button type="button" onClick={() => setModal(false)} className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted"><X size={16} /></button>
              </div>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Title" className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:border-primary outline-none text-sm" />
              <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})} required placeholder="Write your message…" rows={5} className="w-full p-3 rounded-lg border border-border bg-transparent focus:border-primary outline-none text-sm resize-none" />
              <input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="Image URL (optional)" className="w-full h-11 px-3 rounded-lg border border-border bg-transparent focus:border-primary outline-none text-sm mono" />
              <div>
                <p className="overline mb-1">Audience</p>
                <div className="flex flex-wrap gap-2">
                  {['all','teachers','parents','students'].map(a => (
                    <button type="button" key={a} onClick={() => setForm({...form, audience: a})} className={`text-xs mono px-3 py-1.5 rounded-full border ${form.audience === a ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{a}</button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-magnetic w-full justify-center">{isNewsMode ? 'Publish' : 'Send Announcement'}</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
