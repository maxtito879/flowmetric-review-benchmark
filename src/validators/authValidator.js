'use strict';

const { ValidationError } = require('../utils/errors');
const { isNonEmptyString } = require('./common');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(body) {
  const { email, password, name } = body || {};
  const errors = [];

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    errors.push('email inválido');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    errors.push('password debe tener entre 8 y 128 caracteres');
  }
  if (!isNonEmptyString(name) || name.length > 80) {
    errors.push('name es obligatorio (máximo 80 caracteres)');
  }

  if (errors.length > 0) {
    throw new ValidationError('Registro inválido', errors);
  }
  return { email: email.trim(), password, name: name.trim() };
}

function validateLogin(body) {
  const { email, password } = body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ValidationError('email y password son obligatorios');
  }
  return { email, password };
}

module.exports = { validateRegister, validateLogin };
