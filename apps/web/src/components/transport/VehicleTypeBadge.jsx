import React from 'react';

const TYPE_CONFIG = {
  'taxi-moto': { label: 'Taxi-Moto', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  taxi: { label: 'Taxi', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
  bus: { label: 'Bus', bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20' },
  camion: { label: 'Camion', bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' },
  tricycle: { label: 'Tricycle', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
  minibus: { label: 'Minibus', bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20' },
};

const VehicleTypeBadge = ({ type, className = '' }) => {
  const slug = type?.toLowerCase().replace(/\s+/g, '-');
  const config = TYPE_CONFIG[slug] || { label: type || 'Inconnu', bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/20' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {config.label}
    </span>
  );
};

export default VehicleTypeBadge;
