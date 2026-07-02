import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Receipt } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge.jsx';
import { formatCurrency } from '@/utils/currency.js';

const DebtCard = ({ debt, memberName }) => {
  return (
    <Link to={`/debts/${debt.id}`}
      className="block bg-card border border-border rounded-2xl p-5 hover:bg-muted/30 transition-all shadow-card group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
          <Receipt className="w-6 h-6 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-foreground truncate">{memberName || 'Membre inconnu'}</span>
            <StatusBadge status={debt.status} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{formatCurrency(debt.amount_remaining)} / {formatCurrency(debt.amount_original)}</span>
            <span>{debt.debt_type}</span>
            {debt.due_date && <span>Échéance: {new Date(debt.due_date).toLocaleDateString('fr-FR')}</span>}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

export default DebtCard;
