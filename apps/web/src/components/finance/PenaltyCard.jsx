import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Ban } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';
import { formatCurrency } from '@/utils/currency.js';

const PenaltyCard = ({ penalty, memberName }) => {
  return (
    <Link to={`/penalties/${penalty.id}`}
      className="block bg-card border border-border rounded-2xl p-5 hover:bg-muted/30 transition-all shadow-card group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center shrink-0">
          <Ban className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-foreground truncate">{memberName || 'Membre inconnu'}</span>
            <StatusBadge status={penalty.status} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{formatCurrency(penalty.amount)}</span>
            <span>{penalty.penalty_type}</span>
            <span className="truncate max-w-[150px]">{penalty.reason}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

export default PenaltyCard;
