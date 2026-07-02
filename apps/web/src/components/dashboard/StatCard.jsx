import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = {
  primary: { bg: 'bg-primary/15', icon: 'text-primary', border: 'border-primary/20' },
  secondary: { bg: 'bg-secondary/15', icon: 'text-secondary', border: 'border-secondary/20' },
  accent: { bg: 'bg-accent/30', icon: 'text-accent-foreground', border: 'border-accent/30' },
  success: { bg: 'bg-green-500/15', icon: 'text-green-500', border: 'border-green-500/20' },
  warning: { bg: 'bg-amber-500/15', icon: 'text-amber-500', border: 'border-amber-500/20' },
  danger: { bg: 'bg-red-500/15', icon: 'text-red-500', border: 'border-red-500/20' },
  muted: { bg: 'bg-muted/50', icon: 'text-muted-foreground', border: 'border-border' },
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'primary', trend, trendValue, loading, className = '' }) => {
  if (loading) {
    return (
      <div className={`bg-card border border-border rounded-2xl p-5 shadow-card ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-9 w-9 rounded-xl bg-muted" />
          </div>
          <div className="h-7 w-24 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const c = COLORS[color] || COLORS.primary;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-card border ${c.border} rounded-2xl p-5 shadow-card transition-shadow hover:shadow-elevated ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</h3>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${c.icon}`} />
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold text-foreground ${typeof value === 'string' && value.length > 10 ? 'text-xl' : ''}`}>
        {value ?? '0'}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {trend !== undefined && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{Math.abs(trend)}%</span>
          {trendValue && <span className="text-muted-foreground">vs. hier</span>}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
