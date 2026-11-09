'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ValidationError } = require('../../src/utils/errors');
const { validateChargeRequest, validateRefundRequest } = require('../../src/validators/paymentValidator');

describe('validateChargeRequest', () => {
  it('acepta una solicitud completa', () => {
    const result = validateChargeRequest({ paymentToken: 'tok_visa' }, { 'idempotency-key': 'abc-12345_X' });
    assert.deepEqual(result, { idempotencyKey: 'abc-12345_X', paymentToken: 'tok_visa' });
  });

  it('rechaza claves ausentes, cortas o con caracteres no permitidos', () => {
    for (const key of [undefined, 'corta', 'tiene espacios aquí']) {
      assert.throws(
        () => validateChargeRequest({ paymentToken: 'tok_visa' }, { 'idempotency-key': key }),
        ValidationError,
      );
    }
  });

  it('rechaza tokens que no tienen el prefijo esperado', () => {
    assert.throws(() => validateChargeRequest({ paymentToken: 'visa' }, { 'idempotency-key': 'abc-12345' }), ValidationError);
  });
});

describe('validateRefundRequest', () => {
  it('acepta reembolsos totales y parciales', () => {
    assert.deepEqual(validateRefundRequest({}), { amountCents: undefined, reason: undefined });
    assert.deepEqual(validateRefundRequest({ amountCents: 5000, reason: 'Duplicado' }), {
      amountCents: 5000,
      reason: 'Duplicado',
    });
  });

  it('rechaza importes negativos o no numéricos y motivos demasiado largos', () => {
    assert.throws(() => validateRefundRequest({ amountCents: -5 }), ValidationError);
    assert.throws(() => validateRefundRequest({ amountCents: 'abc' }), ValidationError);
    assert.throws(() => validateRefundRequest({ reason: 'x'.repeat(201) }), ValidationError);
  });
});
