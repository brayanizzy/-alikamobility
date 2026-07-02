import React from 'react';
import { Loader2, Inbox } from 'lucide-react';

export default function ReportDataTable({
  columns = [],
  rows = [],
  loading = false,
  emptyMessage = 'Aucune donnée trouvée.',
  onRowClick,
  className = '',
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Inbox className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-3 ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                } ${col.className || ''}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={row.id || ri}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-b border-border/50 transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''
              }`}
            >
              {columns.map((col, ci) => {
                const val = col.render ? col.render(row, ri) : row[col.key];
                return (
                  <td
                    key={ci}
                    className={`py-3 px-3 text-foreground ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                    } ${col.cellClass || ''}`}
                  >
                    {val ?? '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
