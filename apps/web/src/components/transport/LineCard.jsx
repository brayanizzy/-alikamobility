import React from 'react';
import { Link } from 'react-router-dom';
import { Route, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';
import { formatCurrency } from '@/utils/currency.js';

const LineCard = ({ line }) => {
  return (
    <Link to={`/lines/${line.id}`}
      className="block bg-card border border-border rounded-2xl p-5 hover:bg-muted/30 transition-all shadow-card group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
          <Route className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-foreground truncate">{line.name}</span>
            <StatusBadge status={line.status} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {line.departure && line.arrival && <span>{line.departure} → {line.arrival}</span>}
            {line.distance_km && <span>{line.distance_km} km</span>}
            {line.base_fare && <span>{formatCurrency(line.base_fare)}</span>}
            {!line.departure && !line.distance_km && !line.base_fare && <span>Aucune information</span>}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

export default LineCard;
