'use strict';

const { ValidationError } = require('../utils/errors');
const { parsePagination } = require('../utils/pagination');

const SORT_OPTIONS = ['name', 'price_asc', 'price_desc'];
const CATEGORY_PATTERN = /^[a-z-]{2,30}$/;

function parseCents(value, label, errors) {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    errors.push(`${label} debe ser un entero mayor o igual a 0`);
    return undefined;
  }
  return parsed;
}

function validateProductQuery(query = {}) {
  const errors = [];

  const text = query.q === undefined ? undefined : String(query.q).trim();
  if (text !== undefined && text.length > 60) {
    errors.push('q no puede superar 60 caracteres');
  }
  if (query.category !== undefined && !CATEGORY_PATTERN.test(query.category)) {
    errors.push('category inválida');
  }

  const minPriceCents = parseCents(query.minPrice, 'minPrice', errors);
  const maxPriceCents = parseCents(query.maxPrice, 'maxPrice', errors);
  if (minPriceCents !== undefined && maxPriceCents !== undefined && minPriceCents > maxPriceCents) {
    errors.push('minPrice no puede ser mayor que maxPrice');
  }

  const sort = query.sort === undefined ? 'name' : query.sort;
  if (!SORT_OPTIONS.includes(sort)) {
    errors.push('sort inválido');
  }

  const pagination = parsePagination(query, errors);

  if (errors.length > 0) {
    throw new ValidationError('Parámetros de búsqueda inválidos', errors);
  }

  return {
    query: text || undefined,
    category: query.category,
    minPriceCents,
    maxPriceCents,
    sort,
    pagination,
  };
}

module.exports = { validateProductQuery, SORT_OPTIONS };
