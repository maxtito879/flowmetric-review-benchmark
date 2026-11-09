'use strict';

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

module.exports = { isNonEmptyString, isPositiveInteger };
