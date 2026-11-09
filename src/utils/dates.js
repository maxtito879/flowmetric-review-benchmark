'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value, fallback, label, errors) {
  if (value === undefined) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    errors.push(`${label} debe ser una fecha ISO válida`);
    return fallback;
  }
  return date;
}

function dayKey(isoString) {
  return isoString.slice(0, 10);
}

module.exports = { DAY_MS, parseDate, dayKey };
