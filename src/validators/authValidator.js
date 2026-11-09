'use strict';

const { ROLES } = require('../config/constants');
const { ValidationError } = require('../utils/errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(body) {
  const { email, password, name, role } = body || {};
  const errors = [];

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    errors.push('email inválido');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    errors.push('password debe tener entre 8 y 128 caracteres');
  }
  if (typeof email === 'string' && typeof password === 'string' && email.trim().toLowerCase() === password.toLowerCase()) {
    errors.push('password no puede ser igual al email');
  }
  if (typeof name !== 'string' || name.trim() === '' || name.length > 80) {
    errors.push('name es obligatorio (máximo 80 caracteres)');
  }
  if (role !== undefined && !Object.values(ROLES).includes(role)) {
    errors.push('role inválido');
  }

  if (errors.length > 0) {
    throw new ValidationError('Registro inválido', errors);
  }
  return { email: email.trim(), password, name: name.trim(), role };
}

function validateLogin(body) {
  const { email, password } = body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ValidationError('email y password son obligatorios');
  }
  return { email, password };
}

module.exports = { validateRegister, validateLogin };
