import React from 'react';
import { FileText, Eye } from 'lucide-react';
import { formatCurrency } from '@/utils/currency.js';

const ReceiptPreview = ({ receipt, onView }) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => onView?.(receipt)}>
      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          Reçu #{receipt.id?.slice(-8) || 'N/A'}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatCurrency(receipt.amount || 0)}</span>
          {receipt.created && <span>{new Date(receipt.created).toLocaleDateString('fr-FR')}</span>}
        </div>
      </div>
      <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
    </div>
  );
};

export default ReceiptPreview;
