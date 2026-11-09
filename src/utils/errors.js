'use strict';

class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, { status: 400, code: 'VALIDATION_ERROR', details });
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, { status: 401, code: 'UNAUTHORIZED' });
  }
}

class PaymentError extends AppError {
  constructor(message) {
    super(message, { status: 402, code: 'PAYMENT_FAILED' });
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, { status: 403, code: 'FORBIDDEN' });
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, { status: 404, code: 'NOT_FOUND' });
  }
}

class ConflictError extends AppError {
  constructor(message, details) {
    super(message, { status: 409, code: 'CONFLICT', details });
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Demasiadas solicitudes') {
    super(message, { status: 429, code: 'RATE_LIMITED' });
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  PaymentError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
};
