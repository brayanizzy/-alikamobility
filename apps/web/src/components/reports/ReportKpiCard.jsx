import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ReportKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
  loading = false,
  className = '',
}) {
  if (loading) {
    return (
      <div className={`bg-card border border-border rounded-2xl p-5 ${className}`}>
        <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-3 w-20 bg-muted rounded animate-pulse mt-2" />
      </div>
    );
  }

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    green: 'text-green-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
    purple: 'text-purple-500',
  };

  const bgClasses = {
    primary: 'bg-primary/10',
    secondary: 'bg-secondary/10',
    green: 'bg-green-500/10',
    red: 'bg-red-500/10',
    orange: 'bg-orange-500/10',
    purple: 'bg-purple-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-2xl p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${bgClasses[color] || 'bg-primary/10'} flex items-center justify-center`}>
            <Icon className={`w-4.5 h-4.5 ${colorClasses[color] || 'text-primary'}`} />
          </div>
        )}
      </div>
      <div className={`text-2xl md:text-3xl font-extrabold text-foreground ${value === null || value === undefined ? 'text-muted-foreground' : ''}`}>
        {value !== null && value !== undefined ? value : '—'}
      </div>
      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-2 mt-1.5">
          {trend !== undefined && trend !== null && (
            <span className={`flex items-center gap-0.5 text-xs font-bold ${
              trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  );
}
