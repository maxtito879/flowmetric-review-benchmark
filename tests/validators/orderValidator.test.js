'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ValidationError } = require('../../src/utils/errors');
const { validateCreateOrder, validateListFilters, validateUpdateItems } = require('../../src/validators/orderValidator');

const valid = { items: [{ productId: 'prod_mouse', quantity: 2 }], country: 'mx' };

describe('validateCreateOrder', () => {
  it('normaliza país y cupón', () => {
    const result = validateCreateOrder({ ...valid, couponCode: 'PROMO20' });
    assert.deepEqual(result, {
      items: [{ productId: 'prod_mouse', quantity: 2 }],
      couponCode: 'PROMO20',
      country: 'MX',
      notes: null,
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

  it('recorta las notas y las deja en null cuando vienen vacías', () => {
    assert.equal(validateCreateOrder({ ...valid, notes: '  Dejar con el vecino ' }).notes, 'Dejar con el vecino');
    assert.equal(validateCreateOrder({ ...valid, notes: '   ' }).notes, null);
    assert.equal(validateCreateOrder(valid).notes, null);
  });

  it('rechaza notas demasiado largas', () => {
    assert.throws(() => validateCreateOrder({ ...valid, notes: 'x'.repeat(281) }), ValidationError);
  });
});

describe('validateUpdateItems', () => {
  it('acepta una lista de artículos válida', () => {
    const result = validateUpdateItems({ items: [{ productId: ' prod_mouse ', quantity: 3 }] });
    assert.deepEqual(result.items, [{ productId: 'prod_mouse', quantity: 3 }]);
  });

  it('rechaza cuerpos sin lista de artículos', () => {
    assert.throws(() => validateUpdateItems({}), ValidationError);
  });

  it('rechaza cantidades fuera de rango', () => {
    assert.throws(() => validateUpdateItems({ items: [{ productId: 'prod_mouse', quantity: 100 }] }), ValidationError);
  });
});

describe('validateListFilters', () => {
  it('acepta estados conocidos y rechaza los demás', () => {
    assert.deepEqual(validateListFilters({ status: 'PAID' }), { status: 'PAID' });
    assert.deepEqual(validateListFilters({}), {});
    assert.throws(() => validateListFilters({ status: 'LOST' }), ValidationError);
  });
});
