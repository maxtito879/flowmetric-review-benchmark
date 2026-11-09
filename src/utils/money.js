'use strict';

function assertCents(value, label = 'amount') {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${label} must be an integer number of cents`);
  }
  return value;
}

function toCents(decimalAmount) {
  return Math.round(decimalAmount * 100);
}

function fromCents(cents) {
  return assertCents(cents) / 100;
}

function sumCents(values) {
  return values.reduce((total, value) => total + assertCents(value), 0);
}

function applyBasisPoints(cents, basisPoints) {
  assertCents(cents);
  return Math.round((cents * basisPoints) / 10000);
}

function percentage(partCents, totalCents) {
  if (totalCents === 0) return 0;
  return Math.round((assertCents(partCents) / assertCents(totalCents)) * 10000) / 100;
}

function formatMoney(cents, currency = 'MXN') {
  return `${fromCents(cents).toFixed(2)} ${currency}`;
}

module.exports = { assertCents, toCents, fromCents, sumCents, applyBasisPoints, percentage, formatMoney };
