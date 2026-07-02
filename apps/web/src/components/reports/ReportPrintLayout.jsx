import React from 'react';

export default function ReportPrintLayout({
  title,
  period,
  generatedAt,
  generatedBy,
  organizationName,
  children,
}) {
  return (
    <div className="print-only" id="report-print-area">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-print-area, #report-print-area * { visibility: visible; }
          #report-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; font-family: Arial, sans-serif; }
          .no-print { display: none !important; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #f3f4f6; font-weight: 700; text-align: left; padding: 8px 6px; border: 1px solid #d1d5db; }
          td { padding: 6px; border: 1px solid #d1d5db; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          h2 { font-size: 14px; margin-top: 16px; margin-bottom: 8px; }
          .meta { font-size: 10px; color: #6b7280; margin-bottom: 16px; }
          .footer { margin-top: 24px; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
        }
      `}</style>

      <div className="hidden print:block">
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{title}</h1>
        {organizationName && (
          <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 4 }}>{organizationName}</p>
        )}
        <div className="meta">
          {period && <span>Période : {period}</span>}
          {generatedAt && <span> | Généré le : {generatedAt}</span>}
          {generatedBy && <span> | Par : {generatedBy}</span>}
        </div>
        {children}
        <div className="footer">
          Rapport généré par ALIKA MOBILITY — {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  );
}
