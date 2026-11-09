'use strict';

const { REPORT_MAX_RANGE_DAYS } = require('../config/constants');
const { DAY_MS, parseDate } = require('../utils/dates');
const { ValidationError } = require('../utils/errors');

const DEFAULT_RANGE_DAYS = 30;
const MAX_LIMIT = 20;

function validateReportQuery(query = {}, { now = new Date() } = {}) {
  const errors = [];

  const to = parseDate(query.to, now, 'to', errors);
  const from = parseDate(query.from, new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY_MS), 'from', errors);

  if (from > to) {
    errors.push('from no puede ser posterior a to');
  } else if ((to - from) / DAY_MS > REPORT_MAX_RANGE_DAYS) {
    errors.push(`El rango no puede superar ${REPORT_MAX_RANGE_DAYS} días`);
  }

  let limit = 5;
  if (query.limit !== undefined) {
    limit = Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      errors.push(`limit debe ser un entero entre 1 y ${MAX_LIMIT}`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Parámetros de reporte inválidos', errors);
  }

  return { from: from.toISOString(), to: to.toISOString(), limit };
}

module.exports = { validateReportQuery };
