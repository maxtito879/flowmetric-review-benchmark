'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { applyBasisPoints, formatMoney, sumCents, toCents } = require('../../src/utils/money');

describe('money', () => {
  it('convierte importes decimales a centavos', () => {
    assert.equal(toCents(129.9), 12990);
    assert.equal(toCents(0.1 + 0.2), 30);
  });

  it('aplica puntos base con redondeo al centavo más cercano', () => {
    assert.equal(applyBasisPoints(10000, 1600), 1600);
    assert.equal(applyBasisPoints(999, 1600), 160);
  });

  it('suma centavos y rechaza valores no enteros', () => {
    assert.equal(sumCents([100, 250, 50]), 400);
    assert.throws(() => sumCents([100, 1.5]), TypeError);
  });

  it('da formato a importes', () => {
    assert.equal(formatMoney(129900), '1299.00 MXN');
  });
});
