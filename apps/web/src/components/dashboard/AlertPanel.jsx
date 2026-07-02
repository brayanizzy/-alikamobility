import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, DollarSign, Ban, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/currency.js';

const ALERT_ICONS = {
  warning: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  error: { icon: Ban, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  info: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  success: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
};

const AlertPanel = ({ title = 'Alertes', alerts = [], loading, viewAllLink }) => {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
        <div className="h-5 w-24 bg-muted rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground mb-4">État du système</p>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Tout est ok</p>
            <p className="text-xs text-muted-foreground">Aucune alerte à signaler</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">{alerts.length}</span>
      </div>
      <div className="space-y-2">
        {alerts.map((alert, i) => {
          const severity = alert.severity || 'warning';
          const colors = ALERT_ICONS[severity] || ALERT_ICONS.warning;
          const AlertIcon = colors.icon;
          return (
            <motion.div
              key={alert.id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-start gap-3 p-3 rounded-xl ${colors.bg} ${colors.border} border`}
            >
              <AlertIcon className={`w-5 h-5 ${colors.color} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                {alert.message && <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>}
                {alert.amount !== undefined && (
                  <p className="text-sm font-bold text-red-500 mt-1">{formatCurrency(alert.amount)}</p>
                )}
              </div>
              {alert.link && (
                <Link to={alert.link} className="shrink-0">
                  <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
      {viewAllLink && (
        <Link to={viewAllLink}
          className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors pt-3 border-t border-border"
        >
          Voir tout <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
};

export default AlertPanel;
