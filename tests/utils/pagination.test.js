'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { paginate, parsePagination } = require('../../src/utils/pagination');

describe('parsePagination', () => {
  it('usa valores por defecto', () => {
    assert.deepEqual(parsePagination({}), { page: 1, pageSize: 10 });
  });

  it('limita el tamaño de página al máximo permitido', () => {
    assert.equal(parsePagination({ pageSize: '500' }).pageSize, 50);
  });

  it('acumula errores para valores inválidos', () => {
    const errors = [];
    parsePagination({ page: '0', pageSize: 'abc' }, errors);
    assert.equal(errors.length, 2);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, index) => index + 1);

  it('devuelve la primera página', () => {
    const result = paginate(items, { page: 1, pageSize: 10 });
    assert.deepEqual(result.items, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.equal(result.total, 25);
    assert.equal(result.totalPages, 3);
  });

  it('devuelve la última página incompleta', () => {
    assert.deepEqual(paginate(items, { page: 3, pageSize: 10 }).items, [21, 22, 23, 24, 25]);
  });

  it('devuelve una página vacía fuera de rango y una sola página para listas vacías', () => {
    assert.deepEqual(paginate(items, { page: 9, pageSize: 10 }).items, []);
    assert.equal(paginate([], { page: 1, pageSize: 10 }).totalPages, 1);
  });
});
