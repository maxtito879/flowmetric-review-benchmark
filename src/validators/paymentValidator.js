'use strict';

const { ValidationError } = require('../utils/errors');

const KEY_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

function validateChargeRequest(body, headers = {}) {
  const errors = [];
  const idempotencyKey = headers['idempotency-key'];
  const paymentToken = body && body.paymentToken;

  if (typeof idempotencyKey !== 'string' || !KEY_PATTERN.test(idempotencyKey)) {
    errors.push('El encabezado Idempotency-Key es obligatorio (8 a 64 caracteres alfanuméricos, guion o guion bajo)');
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
  const { reason } = body || {};
  const amountCents = body && body.amountCents !== undefined ? Number(body.amountCents) : undefined;
  const errors = [];

  if (amountCents !== undefined && (!Number.isFinite(amountCents) || amountCents <= 0)) {
    errors.push('amountCents debe ser un número positivo');
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
