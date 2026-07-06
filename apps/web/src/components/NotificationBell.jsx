import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import pb from '@/lib/apiClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TYPE_LABELS = {
  late_payment: { color: 'text-destructive', bg: 'bg-destructive/10', dot: 'bg-destructive' },
  new_member: { color: 'text-secondary', bg: 'bg-secondary/10', dot: 'bg-secondary' },
  collection_alert: { color: 'text-amber-500', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  system: { color: 'text-primary', bg: 'bg-primary/10', dot: 'bg-primary' },
};

const TYPE_TOAST_LABELS = {
  late_payment: { label: 'Paiement en retard', icon: '🔴' },
  new_member: { label: 'Nouveau membre', icon: '👤' },
  collection_alert: { label: 'Alerte collecte', icon: '⚠️' },
  system: { label: 'Système', icon: 'ℹ️' },
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const prevCountRef = useRef(0);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const records = await pb.collection('notifications').getList(1, 8, {
        sort: '-created', $autoCancel: false,
      });
      const items = records.items || [];

      let newCount = 0;
      try {
        const countRes = await pb.request('/notifications/unread-count');
        newCount = countRes.count || 0;
      } catch {
        const unreadRes = await pb.collection('notifications').getList(1, 1, {
          filter: 'is_read = false', $autoCancel: false,
        });
        newCount = unreadRes.totalItems || 0;
      }

      // Toast on new unread notifications
      if (prevCountRef.current > 0 && newCount > prevCountRef.current && items.length > 0) {
        const latestBatch = [];
        for (const n of items) {
          if (!notifications.find(ex => ex.id === n.id)) {
            latestBatch.push(n);
          }
        }
        if (latestBatch.length > 0) {
          const newest = latestBatch[0];
          const config = TYPE_TOAST_LABELS[newest.type] || TYPE_TOAST_LABELS.system;
          toast(`${config.icon} ${config.label}`, {
            description: newest.title,
            action: { label: 'Voir', onClick: () => navigate('/notifications') },
            duration: 5000,
          });
          // Play notification sound
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = 800;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
          } catch (_) { /* silent */ }
        }
      }
      prevCountRef.current = newCount;

      setNotifications(items);
      setUnreadCount(newCount);
    } catch (err) {
      if (err.status !== 404) console.warn('Notif fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, notifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      for (const n of unread) {
        await pb.collection('notifications').update(n.id, { is_read: true }, { $autoCancel: false });
      }
      setUnreadCount(0);
      prevCountRef.current = 0;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.warn('Mark read error:', err.message);
    }
  };

  const handleClick = (notif) => {
    setOpen(false);
    if (!notif.is_read) {
      pb.collection('notifications').update(notif.id, { is_read: true }, { $autoCancel: false }).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notif.action_url) navigate(notif.action_url);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-all">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-destructive/30 animate-scale-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-card border border-border rounded-2xl shadow-modal z-50 overflow-hidden animate-scale-in origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h4 className="text-sm font-bold text-foreground">Notifications</h4>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Tout lu
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucune notification</p>
                <p className="text-xs mt-1">Les notifications apparaîtront ici.</p>
              </div>
            ) : (
              notifications.map((n, i) => {
                const style = TYPE_LABELS[n.type] || TYPE_LABELS.system;
                return (
                  <button key={n.id} onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 flex items-start gap-3 animate-slide-up`}
                    style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                  >
                    <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <div className={`w-2 h-2 rounded-full ${style.dot} ${n.is_read ? 'opacity-30' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.is_read ? 'font-bold' : 'font-medium'} text-foreground truncate`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(n.created).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2 animate-pulse-soft" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <button onClick={() => { setOpen(false); navigate('/notifications'); }}
            className="w-full py-3 text-center text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-colors border-t border-border">
            Voir toutes les notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;