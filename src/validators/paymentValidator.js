'use strict';

const { ValidationError } = require('../utils/errors');

function validateChargeRequest(body, headers = {}) {
  const errors = [];
  const idempotencyKey = headers['idempotency-key'];
  const paymentToken = body && body.paymentToken;

  if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8 || idempotencyKey.length > 64) {
    errors.push('El encabezado Idempotency-Key es obligatorio (8 a 64 caracteres)');
  }
  if (typeof paymentToken !== 'string' || !paymentToken.startsWith('tok_')) {
    errors.push('paymentToken es obligatorio');
  }

  if (errors.length > 0) {
    throw new ValidationError('Solicitud de pago inválida', errors);
  }
  return { idempotencyKey, paymentToken };
}

function validateRefundRequest(body) {
  const { amountCents, reason } = body || {};
  const errors = [];

  if (amountCents !== undefined && (!Number.isInteger(amountCents) || amountCents <= 0)) {
    errors.push('amountCents debe ser un entero positivo');
  }
  if (reason !== undefined && (typeof reason !== 'string' || reason.length > 200)) {
    errors.push('reason debe ser un texto de hasta 200 caracteres');
  }

  if (errors.length > 0) {
    throw new ValidationError('Solicitud de reembolso inválida', errors);
  }
  return { amountCents, reason };
}

module.exports = { validateChargeRequest, validateRefundRequest };
