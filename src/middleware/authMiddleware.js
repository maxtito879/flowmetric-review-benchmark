'use strict';

const { ForbiddenError, UnauthorizedError } = require('../utils/errors');

function authenticate(authService) {
  return async (req) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Falta el token de autenticación');
    }
    req.user = await authService.authenticate(token);
  };
}

function requireRole(...roles) {
  return async (req) => {
    if (!req.user) {
      throw new UnauthorizedError('No autenticado');
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('No tienes permisos para esta acción');
    }
  };
}

module.exports = { authenticate, requireRole };
