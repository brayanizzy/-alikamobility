const BOM = '\uFEFF';

export function downloadCsv(filename, rows, columns) {
  if (!rows || rows.length === 0) return;
  let csv = BOM;
  csv += columns.map(c => escapeCsv(c.label)).join(';') + '\n';
  rows.forEach(row => {
    csv += columns.map(c => {
      const val = row[c.key];
      return escapeCsv(val !== undefined && val !== null ? val : '');
    }).join(';') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsv(val) {
  const str = String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function formatCsvDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatCsvFileName(prefix, from, to) {
  const datePart = from ? `${from}_${to || ''}` : new Date().toISOString().split('T')[0];
  return `${prefix}_${datePart}.csv`;
}
