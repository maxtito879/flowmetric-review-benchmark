'use strict';

const { ROLES } = require('./config/constants');

function registerRoutes(router, { controllers, middleware }) {
  const { auth, category, product, order, payment, report } = controllers;
  const { authenticate, loginLimiter, requireRole } = middleware;
  const adminOnly = requireRole(ROLES.ADMIN);

  router.add('POST', '/auth/register', [(req) => auth.register(req)]);
  router.add('POST', '/auth/login', [loginLimiter, (req) => auth.login(req)]);
  router.add('GET', '/auth/me', [authenticate, (req) => auth.me(req)]);

  router.add('GET', '/categories', [(req) => category.list(req)]);
  router.add('GET', '/categories/:id', [(req) => category.get(req)]);
  router.add('GET', '/products', [(req) => product.list(req)]);
  router.add('GET', '/products/:id', [(req) => product.get(req)]);

  router.add('POST', '/orders', [authenticate, (req) => order.create(req)]);
  router.add('GET', '/orders', [authenticate, (req) => order.list(req)]);
  router.add('GET', '/orders/:id', [authenticate, (req) => order.get(req)]);
  router.add('POST', '/orders/:id/cancel', [authenticate, (req) => order.cancel(req)]);
  router.add('POST', '/orders/:id/payments', [authenticate, (req) => payment.charge(req)]);

  router.add('GET', '/payments/:id', [authenticate, (req) => payment.get(req)]);
  router.add('POST', '/payments/:id/refunds', [authenticate, adminOnly, (req) => payment.refund(req)]);

  router.add('GET', '/admin/reports/sales', [authenticate, adminOnly, (req) => report.sales(req)]);
  router.add('GET', '/admin/reports/top-products', [authenticate, adminOnly, (req) => report.topProducts(req)]);
  router.add('GET', '/admin/reports/daily-revenue', [authenticate, adminOnly, (req) => report.dailyRevenue(req)]);
  router.add('GET', '/admin/exports/orders.csv', [authenticate, adminOnly, (req) => report.ordersCsv(req)]);
  router.add('GET', '/admin/exports/customers.csv', [authenticate, adminOnly, (req) => report.customersCsv(req)]);
}

module.exports = { registerRoutes };
