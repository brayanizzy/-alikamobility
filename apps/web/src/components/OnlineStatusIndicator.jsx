
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isOnline } from '@/utils/OfflineService.js';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

const OnlineStatusIndicator = () => {
  const [status, setStatus] = useState(isOnline() ? 'online' : 'offline');

  useEffect(() => {
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');
    const handleSyncStart = () => setStatus('syncing');
    const handleSyncEnd = () => setStatus(isOnline() ? 'online' : 'offline');
    const handleSyncError = () => {
      setStatus('error');
      setTimeout(() => {
        setStatus(isOnline() ? 'online' : 'offline');
      }, 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('alika:sync-start', handleSyncStart);
    window.addEventListener('alika:sync-end', handleSyncEnd);
    window.addEventListener('alika:sync-error', handleSyncError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('alika:sync-start', handleSyncStart);
      window.removeEventListener('alika:sync-end', handleSyncEnd);
      window.removeEventListener('alika:sync-error', handleSyncError);
    };
  }, []);

  if (status === 'online') return null; // Hide when online and quiet

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
          </div>
        )}
        {status === 'syncing' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/90 text-yellow-950 backdrop-blur-md rounded-full shadow-lg border border-yellow-500/50 text-sm font-medium">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Synchronisation...
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/90 text-white backdrop-blur-md rounded-full shadow-lg border border-orange-500/50 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Erreur de sync - Réessai...
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OnlineStatusIndicator;
