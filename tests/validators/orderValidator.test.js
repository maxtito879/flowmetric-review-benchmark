'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ValidationError } = require('../../src/utils/errors');
const { validateCreateOrder } = require('../../src/validators/orderValidator');

const valid = { items: [{ productId: 'prod_mouse', quantity: 2 }], country: 'mx' };

describe('validateCreateOrder', () => {
  it('normaliza país y cupón', () => {
    const result = validateCreateOrder({ ...valid, couponCode: 'PROMO20' });
    assert.deepEqual(result, {
      items: [{ productId: 'prod_mouse', quantity: 2 }],
      couponCode: 'PROMO20',
      country: 'MX',
    });
  });

  it('combina artículos repetidos', () => {
    const result = validateCreateOrder({
      ...valid,
      items: [
        { productId: 'prod_mouse', quantity: 1 },
        { productId: 'prod_mouse', quantity: 3 },
      ],
    });
    assert.deepEqual(result.items, [{ productId: 'prod_mouse', quantity: 4 }]);
  });

  it('rechaza pedidos sin artículos', () => {
    assert.throws(() => validateCreateOrder({ ...valid, items: [] }), ValidationError);
  });

  it('rechaza cantidades cero, negativas o decimales', () => {
    for (const quantity of [0, -1, 1.5]) {
      assert.throws(
        () => validateCreateOrder({ ...valid, items: [{ productId: 'prod_mouse', quantity }] }),
        ValidationError,
      );
    }
  });

  it('rechaza países no soportados y cupones mal formados', () => {
    assert.throws(() => validateCreateOrder({ ...valid, country: 'FR' }), ValidationError);
    assert.throws(() => validateCreateOrder({ ...valid, couponCode: 'promo 20' }), ValidationError);
  });

  it('rechaza cuerpos que no son objetos', () => {
    assert.throws(() => validateCreateOrder(undefined), ValidationError);
  });
});
