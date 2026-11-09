'use strict';

const { ROLES } = require('./config/constants');

function registerRoutes(router, { controllers, middleware }) {
  const { auth, product, order, payment } = controllers;
  const { authenticate, requireRole } = middleware;
  const adminOnly = requireRole(ROLES.ADMIN);

  router.add('POST', '/auth/register', [(req) => auth.register(req)]);
  router.add('POST', '/auth/login', [(req) => auth.login(req)]);
  router.add('GET', '/auth/me', [authenticate, (req) => auth.me(req)]);

  router.add('GET', '/products', [(req) => product.list(req)]);
  router.add('GET', '/products/:id', [(req) => product.get(req)]);

  router.add('POST', '/orders', [authenticate, (req) => order.create(req)]);
  router.add('GET', '/orders', [authenticate, (req) => order.list(req)]);
  router.add('GET', '/orders/:id', [authenticate, (req) => order.get(req)]);
  router.add('PATCH', '/orders/:id/items', [authenticate, (req) => order.updateItems(req)]);
  router.add('POST', '/orders/:id/cancel', [authenticate, (req) => order.cancel(req)]);
  router.add('POST', '/orders/:id/payments', [authenticate, (req) => payment.charge(req)]);

  router.add('GET', '/payments/:id', [authenticate, (req) => payment.get(req)]);
  router.add('POST', '/payments/:id/refunds', [authenticate, adminOnly, (req) => payment.refund(req)]);
}

module.exports = { registerRoutes };
