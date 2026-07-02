import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import {
  getQueueItems, getSyncSummary, triggerSync,
  retryAllFailed, clearSyncedItems, formatLastSync,
  isOnline, getLastSyncTimestamp, retryQueueItem,
} from '@/utils/SyncService.js';
import { formatCurrency } from '@/utils/currency.js';
import NetworkStatusBadge from '@/components/offline/NetworkStatusBadge.jsx';
import SyncButton from '@/components/offline/SyncButton.jsx';
import {
  Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw,
  Upload, Ban, Trash2, WifiOff, ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

const TAB_CONFIG = [
  { key: 'all', label: 'Tous' },
  { key: 'pending', label: 'En attente', icon: Clock },
  { key: 'failed', label: 'Échec', icon: XCircle },
  { key: 'synced', label: 'Synchronisé', icon: CheckCircle2 },
  { key: 'conflict', label: 'Conflit', icon: AlertTriangle },
];

const OfflineSyncPage = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, failed: 0, synced: 0, conflict: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lastSyncLabel, setLastSyncLabel] = useState('');
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [queue, summ, lastSync] = await Promise.all([
      getQueueItems(),
      getSyncSummary(),
      formatLastSync(),
    ]);
    setItems(queue);
    setSummary(summ);
    setLastSyncLabel(lastSync);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleChange = () => loadData();
    const handleSyncEnd = () => { setSyncing(false); loadData(); };
    const handleSyncError = () => setSyncing(false);
    window.addEventListener('alika:sync-count-changed', handleChange);
    window.addEventListener('alika:sync-end', handleSyncEnd);
    window.addEventListener('alika:sync-error', handleSyncError);
    return () => {
      window.removeEventListener('alika:sync-count-changed', handleChange);
      window.removeEventListener('alika:sync-end', handleSyncEnd);
      window.removeEventListener('alika:sync-error', handleSyncError);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const result = await triggerSync();
    if (result.synced) toast.success('Synchronisation terminée');
    else if (result.reason === 'offline') toast.error('Vous êtes hors ligne');
    setSyncing(false);
    loadData();
  };

  const handleRetryAll = async () => {
    await retryAllFailed();
    toast.success('Tentatives relancées');
    loadData();
    if (isOnline()) handleSync();
  };

  const handleClearSynced = async () => {
    await clearSyncedItems();
    toast.success('Éléments synchronisés supprimés');
    loadData();
  };

  const filteredItems = activeTab === 'all' ? items : items.filter(i => i.sync_status === activeTab);

  const statusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'syncing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'synced': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'conflict': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'syncing': return 'Synchronisation...';
      case 'synced': return 'Synchronisé';
      case 'failed': return 'Échec';
      case 'conflict': return 'Conflit';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <Header />
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Synchronisation</h1>
              <p className="text-xs text-muted-foreground">Dernière sync: {lastSyncLabel}</p>
            </div>
          </div>
          <NetworkStatusBadge showLabel={false} />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { key: 'pending', count: summary.pending, label: 'En attente', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            { key: 'failed', count: summary.failed, label: 'Échec', color: 'text-red-500', bg: 'bg-red-500/10' },
            { key: 'synced', count: summary.synced, label: 'OK', color: 'text-green-500', bg: 'bg-green-500/10' },
            { key: 'conflict', count: summary.conflict, label: 'Conflit', color: 'text-orange-500', bg: 'bg-orange-500/10' },
          ].map((stat) => (
            <div key={stat.key} className={`${stat.bg} rounded-xl p-3 text-center`}>
              <span className={`text-2xl font-extrabold ${stat.color} block`}>{stat.count}</span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-6">
          <SyncButton onSyncComplete={() => loadData()} className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2" />
          {summary.failed > 0 && (
            <button onClick={handleRetryAll}
              className="px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Relancer
            </button>
          )}
          {summary.synced > 0 && (
            <button onClick={handleClearSynced}
              className="px-4 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm hover:text-foreground transition-all flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Nettoyer
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {TAB_CONFIG.map((tab) => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {summary[tab.key] > 0 && activeTab !== tab.key && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-foreground/10 text-[10px]">
                  {summary[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Queue items */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
            <p className="font-bold text-foreground">Aucun élément</p>
            <p className="text-sm text-muted-foreground">Tout est à jour</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{statusIcon(item.sync_status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">
                        {item.collection === 'payments' ? 'Paiement' : item.collection}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {item.collection === 'payments' && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(item.data?.amount || 0)} — {item.data?.member_id?.substring(0, 12) || '?'}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-semibold ${
                        item.sync_status === 'synced' ? 'text-green-500'
                        : item.sync_status === 'failed' ? 'text-red-500'
                        : item.sync_status === 'conflict' ? 'text-orange-500'
                        : item.sync_status === 'syncing' ? 'text-blue-500'
                        : 'text-yellow-500'
                      }`}>
                        {statusLabel(item.sync_status)}
                      </span>
                      {item.attempts > 0 && (
                        <span className="text-[9px] text-muted-foreground">
                          Tentative {item.attempts}/{10}
                        </span>
                      )}
                    </div>
                    {item.last_error && (
                      <p className="text-[10px] text-red-400 mt-0.5">{item.last_error}</p>
                    )}
                  </div>
                  {item.sync_status === 'failed' && (
                    <button
                      onClick={async () => {
                        await retryQueueItem(item.id);
                        toast.success('Relancé');
                        loadData();
                      }}
                      className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title="Relancer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OfflineSyncPage;
