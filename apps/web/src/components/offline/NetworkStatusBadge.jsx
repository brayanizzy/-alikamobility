import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isOnline, getPendingSyncCount } from '@/utils/OfflineService.js';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Upload } from 'lucide-react';

const NetworkStatusBadge = ({ showLabel = true, showCount = true, showSync = true, className = '' }) => {
  const [status, setStatus] = useState(isOnline() ? 'online' : 'offline');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncLabel, setLastSyncLabel] = useState('');

  const refresh = async () => {
    const count = await getPendingSyncCount();
    setPendingCount(count);
  };

  useEffect(() => {
    refresh();

    const handleOnline = () => { setStatus('online'); refresh(); };
    const handleOffline = () => setStatus('offline');
    const handleSyncStart = () => setStatus('syncing');
    const handleSyncEnd = () => { setStatus(isOnline() ? 'online' : 'offline'); refresh(); };
    const handleSyncError = () => { setStatus('error'); setTimeout(() => setStatus(isOnline() ? 'online' : 'offline'), 5000); };
    const handleCountChanged = () => refresh();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('alika:sync-start', handleSyncStart);
    window.addEventListener('alika:sync-end', handleSyncEnd);
    window.addEventListener('alika:sync-error', handleSyncError);
    window.addEventListener('alika:sync-count-changed', handleCountChanged);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('alika:sync-start', handleSyncStart);
      window.removeEventListener('alika:sync-end', handleSyncEnd);
      window.removeEventListener('alika:sync-error', handleSyncError);
      window.removeEventListener('alika:sync-count-changed', handleCountChanged);
    };
  }, []);

  const show = (status !== 'online' || pendingCount > 0);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border ${className}`}
          style={
            status === 'offline' ? { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.25)', color: '#ef4444' }
            : status === 'syncing' ? { backgroundColor: 'rgba(234,179,8,0.12)', borderColor: 'rgba(234,179,8,0.25)', color: '#a16207' }
            : status === 'error' ? { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: 'rgba(249,115,22,0.25)', color: '#ea580c' }
            : { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.25)', color: '#16a34a' }
          }
        >
          {status === 'offline' && <WifiOff className="w-3.5 h-3.5" />}
          {status === 'syncing' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          {status === 'error' && <AlertTriangle className="w-3.5 h-3.5" />}
          {status === 'online' && pendingCount > 0 && <Upload className="w-3.5 h-3.5" />}
          {status === 'online' && pendingCount === 0 && <Wifi className="w-3.5 h-3.5" />}

          {showLabel && (
            <span>
              {status === 'offline' && 'Hors ligne'}
              {status === 'syncing' && 'Sync...'}
              {status === 'error' && 'Erreur sync'}
              {status === 'online' && pendingCount > 0 && `${pendingCount} en attente`}
              {status === 'online' && pendingCount === 0 && 'En ligne'}
            </span>
          )}

          {showCount && pendingCount > 0 && status === 'online' && (
            <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatusBadge;
