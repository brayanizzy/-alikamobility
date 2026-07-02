import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isOnline, getPendingSyncCount, syncQueue } from '@/utils/OfflineService.js';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Upload } from 'lucide-react';

const OnlineStatusIndicator = () => {
  const [status, setStatus] = useState(isOnline() ? 'online' : 'offline');
  const [pendingCount, setPendingCount] = useState(0);
  const mountedRef = useRef(true);

  const refreshPendingCount = async () => {
    const count = await getPendingSyncCount();
    if (mountedRef.current) setPendingCount(count);
  };

  useEffect(() => {
    mountedRef.current = true;
    refreshPendingCount();

    const handleOnline = () => { if (mountedRef.current) { setStatus('online'); refreshPendingCount(); } };
    const handleOffline = () => { if (mountedRef.current) setStatus('offline'); };
    const handleSyncStart = () => { if (mountedRef.current) setStatus('syncing'); };
    const handleSyncEnd = () => { if (mountedRef.current) { setStatus(isOnline() ? 'online' : 'offline'); refreshPendingCount(); } };
    const handleSyncError = () => {
      if (!mountedRef.current) return;
      setStatus('error');
      const timer = setTimeout(() => { if (mountedRef.current) setStatus(isOnline() ? 'online' : 'offline'); }, 5000);
      timers.push(timer);
    };
    const handleCountChanged = () => { if (mountedRef.current) refreshPendingCount(); };
    const timers = [];

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('alika:sync-start', handleSyncStart);
    window.addEventListener('alika:sync-end', handleSyncEnd);
    window.addEventListener('alika:sync-error', handleSyncError);
    window.addEventListener('alika:sync-count-changed', handleCountChanged);

    return () => {
      mountedRef.current = false;
      timers.forEach(clearTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('alika:sync-start', handleSyncStart);
      window.removeEventListener('alika:sync-end', handleSyncEnd);
      window.removeEventListener('alika:sync-error', handleSyncError);
      window.removeEventListener('alika:sync-count-changed', handleCountChanged);
    };
  }, []);

  const isIdle = status === 'online' && pendingCount === 0;
  if (isIdle) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-4 z-[60] flex flex-col gap-2"
      >
        {status === 'offline' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/90 text-destructive-foreground backdrop-blur-md rounded-full shadow-lg border border-destructive/50 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            Mode Offline
            {pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-destructive-foreground/20 rounded-full text-xs">{pendingCount}</span>}
          </div>
        )}

        {status === 'syncing' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/90 text-yellow-950 backdrop-blur-md rounded-full shadow-lg border border-yellow-500/50 text-sm font-medium">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Synchronisation en cours...
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/90 text-white backdrop-blur-md rounded-full shadow-lg border border-orange-500/50 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Erreur de sync - Nouvel essai...
          </div>
        )}

        {status === 'online' && pendingCount > 0 && (
          <button
            onClick={() => syncQueue()}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/90 text-primary-foreground backdrop-blur-md rounded-full shadow-lg border border-primary/50 text-sm font-medium hover:brightness-110 transition-all"
          >
            <Upload className="w-4 h-4" />
            {pendingCount} action{pendingCount > 1 ? 's' : ''} en attente
            <RefreshCw className="w-3 h-3 ml-1" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OnlineStatusIndicator;
