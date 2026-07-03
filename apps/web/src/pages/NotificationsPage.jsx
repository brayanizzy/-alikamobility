import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import { Bell, CheckCheck, Loader2, AlertCircle, ArrowLeft, Filter, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  late_payment: { label: 'Paiement en retard', bg: 'bg-destructive/20 text-destructive', border: 'border-l-destructive' },
  new_member: { label: 'Nouveau membre', bg: 'bg-secondary/20 text-secondary', border: 'border-l-secondary' },
  collection_alert: { label: 'Alerte collecte', bg: 'bg-amber-500/20 text-amber-500', border: 'border-l-amber-500' },
  system: { label: 'Système', bg: 'bg-primary/20 text-primary', border: 'border-l-primary' },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('notifications').getList(1, 100, {
        sort: '-created', $autoCancel: false,
      });
      setNotifications(records.items || []);
    } catch (err) {
      setError("Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const markAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      for (const n of unread) {
        await pb.collection('notifications').update(n.id, { is_read: true }, { $autoCancel: false });
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("Toutes les notifications marquées comme lues");
    } catch (err) {
      toast.error("Erreur lors du marquage");
    }
  };

  const markRead = async (notif) => {
    if (notif.is_read) return;
    try {
      await pb.collection('notifications').update(notif.id, { is_read: true }, { $autoCancel: false });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    } catch (_) { /* silent */ }
  };

  const filtered = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter(n => !n.is_read)
      : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const typeFilters = [
    { key: 'all', label: 'Toutes', count: notifications.length },
    { key: 'unread', label: 'Non lues', count: unreadCount },
    { key: 'late_payment', label: 'Retards', count: notifications.filter(n => n.type === 'late_payment').length },
    { key: 'new_member', label: 'Nouveaux', count: notifications.filter(n => n.type === 'new_member').length },
    { key: 'collection_alert', label: 'Alertes', count: notifications.filter(n => n.type === 'collection_alert').length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden h-24">
              <div className="animate-shimmer h-full w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4 px-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-lg font-bold">{error}</p>
          <button onClick={fetchAll}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={itemAnim} className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''} — {notifications.length} total
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-all active:scale-95">
                <CheckCheck className="w-4 h-4" /> Tout marquer lu
              </button>
            )}
          </motion.div>

          {/* Filter Tabs */}
          <motion.div variants={itemAnim} className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            {typeFilters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {f.key === 'all' && <Inbox className="w-4 h-4" />}
                {f.key === 'unread' && <Bell className="w-4 h-4" />}
                {f.key === 'late_payment' && <AlertCircle className="w-4 h-4" />}
                {f.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    filter === f.key ? 'bg-white/20' : 'bg-muted text-muted-foreground'
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* List */}
          {filtered.length === 0 ? (
            <motion.div variants={itemAnim} className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <p className="text-xl font-bold text-foreground">Aucune notification</p>
              <p className="text-sm text-muted-foreground mt-2">
                {filter === 'all' ? "Les notifications apparaîtront ici automatiquement." : "Aucune notification ne correspond à ce filtre."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filtered.map((n, i) => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                const time = new Date(n.created);
                const isToday = time.toDateString() === new Date().toDateString();
                const timeStr = isToday
                  ? time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  : time.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

                return (
                  <motion.div
                    key={n.id}
                    variants={itemAnim}
                    onClick={() => markRead(n)}
                    className={`bg-card border border-border rounded-2xl p-5 transition-all cursor-pointer hover:shadow-elevated group ${
                      !n.is_read ? 'border-l-4 shadow-sm' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ borderLeftColor: !n.is_read ? 'hsl(var(--primary))' : undefined }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${config.bg}`}>
                            {config.label}
                          </span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
                          )}
                          <span className="text-xs text-muted-foreground/60 ml-auto">{timeStr}</span>
                        </div>
                        <h3 className="font-bold text-foreground mb-1">{n.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                    {n.action_url && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          Voir les détails →
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default NotificationsPage;