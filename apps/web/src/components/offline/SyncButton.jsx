import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { triggerSync, formatLastSync } from '@/utils/SyncService.js';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SyncButton = ({ onSyncComplete, variant = 'default', className = '' }) => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('');

  React.useEffect(() => {
    formatLastSync().then(setLastSync);
    const interval = setInterval(() => formatLastSync().then(setLastSync), 30000);
    const handleSyncEnd = () => { setSyncing(false); formatLastSync().then(setLastSync); };
    const handleSyncError = () => setSyncing(false);
    window.addEventListener('alika:sync-end', handleSyncEnd);
    window.addEventListener('alika:sync-error', handleSyncError);
    return () => {
      clearInterval(interval);
      window.removeEventListener('alika:sync-end', handleSyncEnd);
      window.removeEventListener('alika:sync-error', handleSyncError);
    };
  }, []);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await triggerSync();
      if (result.synced) {
        toast.success('Synchronisation terminée');
      } else if (result.reason === 'offline') {
        toast.error('Vous êtes hors ligne');
      }
      if (onSyncComplete) onSyncComplete(result);
    } catch (e) {
      toast.error('Erreur de synchronisation');
    } finally {
      setSyncing(false);
      formatLastSync().then(setLastSync);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`p-2 rounded-full hover:bg-muted/50 transition-all disabled:opacity-50 ${className}`}
        title="Synchroniser"
      >
        {syncing ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        )}
      </button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleSync}
      disabled={syncing}
      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${className || 'bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20'}`}
    >
      {syncing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Synchronisation...
        </>
      ) : (
        <>
          <RefreshCw className="w-5 h-5" />
          Synchroniser
        </>
      )}
    </motion.button>
  );
};

export default SyncButton;
