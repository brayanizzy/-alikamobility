import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import pb from '@/lib/apiClient';
import Header from '@/components/Header.jsx';
import { Bell, CheckCheck, Loader2, AlertCircle, ArrowLeft, Filter, Inbox, RefreshCw, Send, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  late_payment: { label: 'Paiement en retard', bg: 'bg-destructive/20 text-destructive', border: 'border-l-destructive' },
  new_member: { label: 'Nouveau membre', bg: 'bg-secondary/20 text-secondary', border: 'border-l-secondary' },
  collection_alert: { label: 'Alerte collecte', bg: 'bg-amber-500/20 text-amber-500', border: 'border-l-amber-500' },
  system: { label: 'Système', bg: 'bg-primary/20 text-primary', border: 'border-l-primary' },
  debt_reminder: { label: 'Rappel dette', bg: 'bg-orange-500/20 text-orange-500', border: 'border-l-orange-500' },
  payment_receipt: { label: 'Reçu paiement', bg: 'bg-green-500/20 text-green-500', border: 'border-l-green-500' },
  penalty_notice: { label: 'Avis pénalité', bg: 'bg-red-500/20 text-red-500', border: 'border-l-red-500' },
  document_expiry: { label: 'Expiration document', bg: 'bg-yellow-500/20 text-yellow-500', border: 'border-l-yellow-500' },
  member_card_ready: { label: 'Carte membre', bg: 'bg-indigo-500/20 text-indigo-500', border: 'border-l-indigo-500' },
  custom_message: { label: 'Message', bg: 'bg-sky-500/20 text-sky-500', border: 'border-l-sky-500' },
};

const CHANNEL_ICONS = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: Smartphone,
  in_app: Bell,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
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
  const [channelFilter, setChannelFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, perPage: 20, sort: '-created', $autoCancel: false };
      if (filter !== 'all') {
        if (filter === 'unread') params.filter = 'is_read = false';
      }
      const records = await pb.collection('notifications').getList(page, 20, {
        sort: '-created', $autoCancel: false,
      });
      const items = (records.items || []).map(n => ({ ...n, _parsedType: TYPE_CONFIG[n.type] || TYPE_CONFIG.system }));
      setNotifications(items);
      setTotalPages(records.totalPages || 1);
    } catch (err) {
      if (err.status !== 404) setError('Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await pb.request('/notification-logs?perPage=20');
      setLogs(res.items || []);
    } catch { }
    setLogsLoading(false);
  };

  useEffect(() => {
    if (showLogs) fetchLogs();
  }, [showLogs]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const markAllRead = async () => {
    try {
      await pb.request('/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('Toutes les notifications marquées comme lues');
    } catch { toast.error('Erreur lors du marquage'); }
  };

  const markRead = async (id) => {
    try {
      await pb.request(`/notifications/read?id=${id}`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { }
  };

  const retryLog = async (logId) => {
    try {
      const res = await pb.request(`/notification-logs/retry?id=${logId}`, { method: 'POST' });
      if (res.success) {
        toast.success('Réessai réussi');
        fetchLogs();
      } else {
        toast.error(res.error || 'Échec du réessai');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  };

  const filtered = notifications.filter(n => {
    if (channelFilter !== 'all' && n.channel !== channelFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header title="Notifications" />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-24">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLogs(!showLogs)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showLogs ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
              {showLogs ? 'Notifications' : 'Logs d\'envoi'}
            </button>
            <button onClick={() => navigate('/notifications/send')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
              <Send className="w-3 h-3" /> Envoyer
            </button>
          </div>
        </div>

        {!showLogs ? (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[{ key: 'all', label: 'Toutes' }, { key: 'unread', label: 'Non lues' }].map(f => (
                <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.key ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
                  {f.label}
                </button>
              ))}
              <div className="w-px h-6 bg-border mx-1 self-center" />
              {[{ key: 'all', label: 'Tous canaux' }, { key: 'in_app', label: 'In-App' }, { key: 'email', label: 'Email' }, { key: 'sms', label: 'SMS' }, { key: 'whatsapp', label: 'WhatsApp' }].map(ch => (
                <button key={ch.key} onClick={() => { setChannelFilter(ch.key); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${channelFilter === ch.key ? 'bg-muted-foreground/20 text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
                  {ch.label}
                </button>
              ))}
              {filtered.some(n => !n.is_read) && (
                <button onClick={markAllRead} className="ml-auto flex items-center gap-1 text-xs text-primary font-bold hover:text-primary/80">
                  <CheckCheck className="w-3 h-3" /> Tout lu
                </button>
              )}
            </div>

            {/* List */}
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : error ? (
              <div className="text-center py-20">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive/50" />
                <p className="text-muted-foreground">{error}</p>
                <button onClick={fetchAll} className="mt-4 text-sm text-primary font-bold">Réessayer</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Inbox className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium text-foreground">Aucune notification</p>
                <p className="text-sm text-muted-foreground mt-1">Les notifications apparaîtront ici.</p>
              </div>
            ) : (
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
                {filtered.map((n, i) => {
                  const style = n._parsedType;
                  const ChannelIcon = CHANNEL_ICONS[n.channel] || Bell;
                  return (
                    <motion.div key={n.id} variants={itemAnim}
                      className={`relative bg-card border border-border rounded-xl p-4 ${style.border} border-l-4 ${!n.is_read ? 'ring-1 ring-primary/20' : ''} cursor-pointer hover:bg-muted/30 transition-all`}
                      onClick={() => { if (!n.is_read) markRead(n.id); if (n.action_url) navigate(n.action_url); }}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
                          <ChannelIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                            <span className={`px-1.5 py-0.5 rounded ${style.bg} text-[10px] font-bold`}>{style.label}</span>
                            {n.channel && n.channel !== 'in_app' && (
                              <span className="text-[10px] uppercase text-muted-foreground/60">{n.channel}</span>
                            )}
                          </div>
                          <p className={`text-sm ${!n.is_read ? 'font-bold' : 'font-medium'} text-foreground`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-1">
                            {new Date(n.created).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse-soft" />}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl bg-muted text-sm font-medium disabled:opacity-30">Précédent</button>
                <span className="px-3 py-2 text-sm text-muted-foreground">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl bg-muted text-sm font-medium disabled:opacity-30">Suivant</button>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Logs d'envoi
              <button onClick={fetchLogs} className="ml-auto text-xs text-primary font-bold hover:text-primary/80">Rafraîchir</button>
            </h2>
            {logsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Aucun log d\'envoi</div>
            ) : (
              <div className="space-y-2">
                {logs.map(log => {
                  const statusColors = { sent: 'text-green-500 bg-green-500/10', sent_simulated: 'text-amber-500 bg-amber-500/10', failed: 'text-destructive bg-destructive/10', queued: 'text-blue-500 bg-blue-500/10', sending: 'text-purple-500 bg-purple-500/10' };
                  const sc = statusColors[log.status] || 'text-muted-foreground bg-muted';
                  return (
                    <div key={log.id} className="bg-card border border-border rounded-xl p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sc}`}>{log.status}</span>
                        <span className="text-[10px] text-muted-foreground/60 uppercase">{log.channel}</span>
                      </div>
                      <p className="text-foreground font-medium truncate">{log.subject || log.message}</p>
                      <p className="text-xs text-muted-foreground truncate">{log.recipient_name} — {log.recipient_contact}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground/50">{new Date(log.created).toLocaleString('fr-FR')}</span>
                        {log.status === 'failed' && (
                          <button onClick={() => retryLog(log.id)} className="text-xs text-primary font-bold hover:text-primary/80">
                            <RefreshCw className="w-3 h-3 inline mr-1" />Réessayer
                          </button>
                        )}
                      </div>
                      {log.error_message && (
                        <p className="text-[11px] text-destructive mt-1">{log.error_message}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
