import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, CreditCard, UserPlus, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/currency.js';

const TYPE_CONFIG = {
  payment: { icon: CreditCard, color: 'text-green-500', bg: 'bg-green-500/15' },
  member: { icon: UserPlus, color: 'text-primary', bg: 'bg-primary/15' },
  alert: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/15' },
};

const RecentActivityList = ({ items = [], type = 'payment', title, viewAllLink, maxItems = 5, loading }) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.payment;
  const Icon = config.icon;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
        <div className="h-5 w-32 bg-muted rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-2 w-16 bg-muted rounded" />
              </div>
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-bold text-foreground mb-4">{title || 'Activité récente'}</h3>
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <Icon className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-foreground font-medium">Aucune activité</p>
          <p className="text-xs text-muted-foreground mt-1">Les données apparaîtront ici</p>
        </div>
      </div>
    );
  }

  const displayItems = items.slice(0, maxItems);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">{items.length} élément{items.length > 1 ? 's' : ''}</span>
        </div>
      )}
      <div className="space-y-1">
        {displayItems.map((item, i) => (
          <motion.div
            key={item.id || i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors"
          >
            <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{item.title || item.name || item.memberName || '—'}</p>
              <p className="text-[10px] text-muted-foreground">
                {item.time || (item.created ? new Date(item.created).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '')}
              </p>
            </div>
            {item.amount !== undefined && (
              <span className="text-sm font-bold text-green-500">+{formatCurrency(item.amount)}</span>
            )}
            {item.status && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                item.status === 'active' || item.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                item.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                'bg-red-500/10 text-red-500'
              }`}>
                {item.status}
              </span>
            )}
          </motion.div>
        ))}
      </div>
      {viewAllLink && displayItems.length > 0 && (
        <Link to={viewAllLink}
          className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors pt-3 border-t border-border"
        >
          Voir tout <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
};

export default RecentActivityList;
