export function formatPeriod(from, to) {
  if (!from && !to) return '';
  const opts = { day: '2-digit', month: 'long', year: 'numeric' };
  try {
    if (from === to) return new Date(from + 'T00:00:00').toLocaleDateString('fr-FR', opts);
    return `du ${new Date(from + 'T00:00:00').toLocaleDateString('fr-FR', opts)} au ${new Date(to + 'T00:00:00').toLocaleDateString('fr-FR', opts)}`;
  } catch {
    return `${from} - ${to}`;
  }
}

export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${Number(value).toFixed(1)}%`;
}

export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function formatCompactCurrency(value) {
  const v = Number(value || 0);
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return v.toString();
}

export function generateReportId() {
  return `RPT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}
