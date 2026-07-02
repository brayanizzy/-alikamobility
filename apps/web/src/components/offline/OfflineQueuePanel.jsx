import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getQueueItems,
  removeQueueItem,
  formatLastSync,
} from '@/utils/SyncService.js';
import { formatCurrency } from '@/utils/currency.js';
import {
  Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw,
  Upload, Ban, ChevronDown, ChevronUp, Trash2, WifiOff,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'En attente' },
  syncing: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Sync...' },
  synced: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Synchronisé' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Échec' },
  conflict: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Conflit' },
};

const OfflineQueuePanel = ({ compact = false, showTitle = true }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [lastSyncLabel, setLastSyncLabel] = useState('');

  const loadItems = async () => {
    setLoading(true);
    const queue = await getQueueItems();
    setItems(queue);
    setLastSyncLabel(await formatLastSync());
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
    const handleChange = () => loadItems();
    window.addEventListener('alika:sync-count-changed', handleChange);
    window.addEventListener('alika:sync-end', handleChange);
    return () => {
      window.removeEventListener('alika:sync-count-changed', handleChange);
      window.removeEventListener('alika:sync-end', handleChange);
    };
  }, []);

  const pendingCount = items.filter(i => i.sync_status === 'pending').length;
  const failedCount = items.filter(i => i.sync_status === 'failed').length;

  if (items.length === 0 && !compact) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
        <p className="font-bold text-foreground">Aucune opération en attente</p>
        <p className="text-xs text-muted-foreground mt-1">Tout est synchronisé</p>
      </div>
    );
  }

  if (compact && items.length === 0) return null;

  const visibleItems = compact && !expanded ? items.filter(i => i.sync_status !== 'synced' && i.sync_status !== 'conflict') : items;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
      {showTitle && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            File d'attente
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
            {failedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[10px] font-bold">
                {failedCount} échec{failedCount > 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{lastSyncLabel}</span>
            {compact && items.length > 3 && (
              <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {visibleItems.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Tous les éléments sont synchronisés
          </div>
        )}

        {visibleItems.map((item) => {
          const cfg = STATUS_CONFIG[item.sync_status] || STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          const isPayment = item.collection === 'payments';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  {item.sync_status === 'syncing' ? (
                    <Loader2 className={`w-4 h-4 ${cfg.color} animate-spin`} />
                  ) : (
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">
                      {isPayment ? 'Paiement' : item.collection}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {isPayment ? (
                      <>
                        Montant: {formatCurrency(item.data?.amount || 0)} — {item.data?.member_id?.substring(0, 8) || '?'}
                      </>
                    ) : (
                      item.data?.id?.substring(0, 12) || 'ID inconnu'
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                    {item.last_error && (
                      <span className="text-[9px] text-muted-foreground truncate">{item.last_error}</span>
                    )}
                  </div>
                </div>

                {(item.sync_status === 'failed' || item.sync_status === 'conflict') && (
                  <button
                    onClick={async () => {
                      await removeQueueItem(item.id);
                      loadItems();
                    }}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OfflineQueuePanel;
