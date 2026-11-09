'use strict';

const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/constants');

function parsePositiveInt(value, fallback, label, errors) {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    errors.push(`${label} debe ser un entero positivo`);
    return fallback;
  }
  return parsed;
}

/**
 * Lee page (base 1) y pageSize desde la query. Los errores se acumulan en `errors`.
 */
function parsePagination(query = {}, errors = []) {
  const page = parsePositiveInt(query.page, 1, 'page', errors);
  const requested = parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, 'pageSize', errors);
  return { page, pageSize: Math.min(requested, MAX_PAGE_SIZE) };
}

function paginate(items, { page, pageSize }) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

module.exports = { parsePagination, paginate };
