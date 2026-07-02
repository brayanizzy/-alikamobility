import React from 'react';

const STATUS_STYLES = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  suspended: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  inactive: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  late: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  overdue: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  synced: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  offline: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  preparing: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  default: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
};

const STATUS_LABELS = {
  active: 'Actif',
  paid: 'Payé',
  in_progress: 'En cours',
  suspended: 'Suspendu',
  inactive: 'Inactif',
  pending: 'En attente',
  late: 'Retard',
  overdue: 'En retard',
  error: 'Erreur',
  synced: 'Synchronisé',
  offline: 'Hors ligne',
  preparing: 'En préparation',
};

const StatusBadge = ({ status, label, className = '' }) => {
  const key = status?.toLowerCase() || 'default';
  const style = STATUS_STYLES[key] || STATUS_STYLES.default;
  const displayLabel = label || STATUS_LABELS[key] || status;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${style} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        key === 'active' || key === 'paid' || key === 'synced' ? 'bg-emerald-500' :
        key === 'suspended' || key === 'pending' ? 'bg-amber-500' :
        key === 'late' || key === 'overdue' || key === 'error' ? 'bg-red-500' :
        'bg-gray-400'
      }`} />
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
