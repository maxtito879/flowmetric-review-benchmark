'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ValidationError } = require('../../src/utils/errors');
const { validateProductQuery } = require('../../src/validators/catalogValidator');
const { validateReportQuery } = require('../../src/validators/reportValidator');

describe('validateProductQuery', () => {
  it('aplica valores por defecto', () => {
    const result = validateProductQuery({});
    assert.equal(result.sort, 'name');
    assert.deepEqual(result.pagination, { page: 1, pageSize: 10 });
  });

  it('convierte los filtros de precio a enteros', () => {
    const result = validateProductQuery({ minPrice: '1000', maxPrice: '5000', q: ' mouse ' });
    assert.equal(result.minPriceCents, 1000);
    assert.equal(result.maxPriceCents, 5000);
    assert.equal(result.query, 'mouse');
  });

  it('rechaza rangos, ordenamientos y categorías inválidos', () => {
    assert.throws(() => validateProductQuery({ minPrice: '500', maxPrice: '100' }), ValidationError);
    assert.throws(() => validateProductQuery({ sort: 'random' }), ValidationError);
    assert.throws(() => validateProductQuery({ category: 'Con Espacios' }), ValidationError);
    assert.throws(() => validateProductQuery({ minPrice: '-1' }), ValidationError);
  });
});

describe('validateReportQuery', () => {
  const now = new Date('2026-03-31T12:00:00.000Z');

  it('usa los últimos 30 días por defecto', () => {
    const result = validateReportQuery({}, { now });
    assert.equal(result.to, '2026-03-31T12:00:00.000Z');
    assert.equal(result.from, '2026-03-01T12:00:00.000Z');
    assert.equal(result.limit, 5);
  });

  it('rechaza fechas inválidas, rangos invertidos y rangos demasiado largos', () => {
    assert.throws(() => validateReportQuery({ from: 'ayer' }, { now }), ValidationError);
    assert.throws(() => validateReportQuery({ from: '2026-04-01', to: '2026-03-01' }, { now }), ValidationError);
    assert.throws(() => validateReportQuery({ from: '2020-01-01' }, { now }), ValidationError);
    assert.throws(() => validateReportQuery({ limit: '50' }, { now }), ValidationError);
  });
});
