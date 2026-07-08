import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, Sun, Moon, Menu, X, Search, Command } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { navByRole } from '@/components/dashboard/nav';
import api from '@/lib/api';
import { toast } from 'sonner';
import PageTransition from '@/components/common/PageTransition';

function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const items = navByRole[user?.role] || [];
  const nav = useNavigate();
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 0 : -300) }}
        className="fixed lg:sticky top-0 left-0 h-screen w-72 border-r border-border bg-card z-50 lg:z-0 flex flex-col"
        data-testid="dashboard-sidebar"
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg border-2 border-primary grid place-items-center">
              <span className="font-serif text-lg font-bold text-primary">R</span>
            </div>
            <div>
              <p className="font-serif text-sm font-semibold leading-tight">Resonance</p>
              <p className="overline">{user?.role}</p>
            </div>
          </div>
          <button className="lg:hidden h-8 w-8 grid place-items-center rounded-md hover:bg-muted" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              onClick={onClose}
              className={({ isActive }) => `group relative flex items-center gap-3 px-3 h-11 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground/75 hover:bg-muted hover:text-foreground'}`}
              data-testid={`sidebar-${it.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="active-pill"
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-primary"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <it.icon size={16} />
                  <span>{it.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/15 text-primary grid place-items-center font-serif">
              {user?.fullName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate mono">@{user?.username}</p>
            </div>
            <button onClick={() => { logout(); nav('/'); }} className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors" data-testid="sidebar-logout" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function NotificationsPanel({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line
  }, [open]);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get('/notifications'); setItems(r.data); } catch(e){}
    setLoading(false);
  };

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    setItems(items.map(n => n._id === id ? { ...n, read: true } : n));
  };
  const readAll = async () => {
    await api.post('/notifications/read-all');
    setItems(items.map(n => ({ ...n, read: true })));
    toast.success('All marked as read');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
          <motion.aside
            initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-card border-l border-border z-50 flex flex-col"
            data-testid="notifications-panel"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <p className="overline">Inbox</p>
                <h3 className="font-serif text-2xl mt-1">Notifications</h3>
              </div>
              <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted" data-testid="notif-close"><X size={16} /></button>
            </div>
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-xs mono text-muted-foreground">{items.filter(i => !i.read).length} unread</span>
              <button onClick={readAll} className="text-xs mono link-underline text-primary" data-testid="notif-read-all">Mark all read</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16" />)}
              {!loading && items.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No notifications yet.</p>}
              {items.map((n, i) => (
                <motion.button
                  key={n._id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => markRead(n._id)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${n.read ? 'border-border bg-transparent' : 'border-primary/40 bg-primary/5'}`}
                  data-testid={`notif-item-${i}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-8 w-8 shrink-0 rounded-lg grid place-items-center text-xs ${n.type === 'success' ? 'bg-secondary/15 text-secondary' : n.type === 'fee' ? 'bg-accent/20 text-accent' : n.type === 'leave' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Bell size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] mono text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [search, setSearch] = useState('');
  const loc = useLocation();

  useEffect(() => {
    const load = async () => {
      try { const r = await api.get('/notifications/unread-count'); setUnread(r.data.count || 0); } catch(e){}
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [loc.pathname, notifOpen]);

  return (
    <header className="sticky top-0 z-30 glass-navbar" data-testid="dashboard-topbar">
      <div className="px-6 h-16 flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden h-10 w-10 grid place-items-center rounded-md border border-border" data-testid="topbar-menu">
          <Menu size={16} />
        </button>
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md relative">
          <Search size={14} className="absolute left-3 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students, teachers, records…"
            className="w-full h-10 pl-9 pr-16 rounded-full bg-muted/60 border border-transparent focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-[background-color,border-color,width]"
            data-testid="global-search"
          />
          <span className="hidden md:flex absolute right-3 items-center gap-1 text-[10px] mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
            <Command size={10} /> K
          </span>
        </div>
        <div className="flex-1 md:hidden" />
        <button onClick={toggle} className="h-10 w-10 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors" data-testid="topbar-theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button onClick={() => setNotifOpen(true)} className="relative h-10 w-10 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors" data-testid="topbar-notifications">
          <Bell size={16} />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] mono grid place-items-center"
              data-testid="notif-badge"
            >{unread}</motion.span>
          )}
        </button>
      </div>
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  );
}

export default function DashboardShell() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav('/login');
  }, [loading, user, nav]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 overline">Loading portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[288px_1fr]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex flex-col min-h-screen">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-6 md:p-10 relative">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
