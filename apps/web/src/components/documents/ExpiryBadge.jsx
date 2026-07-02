import React from 'react';
import { Clock, AlertTriangle, Ban, Minus } from 'lucide-react';

const ExpiryBadge = ({ expiryDate, className = '' }) => {
  if (!expiryDate) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 ${className}`}>
        <Minus className="w-3 h-3" /> Aucune expiration
      </span>
    );
  }

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 ${className}`}>
        <Ban className="w-3 h-3" /> Expiré
      </span>
    );
  }

  if (daysLeft <= 30) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 ${className}`}>
        <AlertTriangle className="w-3 h-3" /> Expire bientôt ({daysLeft}j)
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 ${className}`}>
      <Clock className="w-3 h-3" /> Valide
    </span>
  );
};

export default ExpiryBadge;
