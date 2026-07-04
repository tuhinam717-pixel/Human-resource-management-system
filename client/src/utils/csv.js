// Client-side CSV export. Builds a CSV from column defs + rows and triggers a download.
//   columns: [{ key: 'name', label: 'Name' }] OR [{ label, value: (row) => ... }]
//   rows:    array of objects

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Wrap in quotes if it contains a comma, quote, or newline; double any quotes.
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV(columns, rows) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => escapeCell(c.value ? c.value(row) : row[c.key]))
        .join(',')
    )
    .join('\r\n');
  return `${header}\r\n${body}`;
}

export function downloadCSV(filename, columns, rows) {
  const csv = toCSV(columns, rows);
  // Prepend BOM so Excel opens UTF-8 (₹ etc.) correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Adds a YYYY-MM-DD stamp to a filename base, e.g. stampName('attendance') -> 'attendance_2026-07-04'
export function stampName(base) {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${base}_${iso}`;
}
