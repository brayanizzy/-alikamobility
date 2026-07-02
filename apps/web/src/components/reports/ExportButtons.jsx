import React from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';

export default function ExportButtons({
  onPrint,
  onCsv,
  csvLabel = 'CSV',
  printLabel = 'Imprimer / PDF',
  isExporting = false,
  className = '',
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {onPrint && (
        <button
          onClick={onPrint}
          className="bg-card border border-border text-foreground font-bold px-3 py-2 rounded-xl hover:bg-muted active:scale-95 transition-all flex items-center gap-1.5 text-xs"
          title="Imprimer ou générer PDF via le navigateur"
        >
          <Printer className="w-3.5 h-3.5" /> {printLabel}
        </button>
      )}
      {onCsv && (
        <button
          onClick={onCsv}
          disabled={isExporting}
          className="bg-primary text-primary-foreground font-bold px-3 py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 text-xs disabled:opacity-50"
          title="Télécharger en CSV"
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {csvLabel}
        </button>
      )}
    </div>
  );
}
