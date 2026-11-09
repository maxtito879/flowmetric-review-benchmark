'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { isNonEmptyString, isPositiveInteger } = require('../../src/validators/common');

describe('validators/common', () => {
  it('isNonEmptyString solo acepta texto con contenido', () => {
    assert.equal(isNonEmptyString('abc'), true);
    for (const value of ['', '   ', 5, null, undefined]) {
      assert.equal(isNonEmptyString(value), false);
    }
  });

  it('isPositiveInteger solo acepta enteros mayores que cero', () => {
    assert.equal(isPositiveInteger(3), true);
    for (const value of [0, -2, 1.5, NaN, '3']) {
      assert.equal(isPositiveInteger(value), false);
    }
  });
});
