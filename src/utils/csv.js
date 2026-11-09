'use strict';

function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers, rows) {
  return `${[headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')}\n`;
}

module.exports = { toCsv };
