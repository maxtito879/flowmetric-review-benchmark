'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ROLES } = require('../../src/config/constants');
const { PASSWORD, buildTestApp, signUp } = require('../helpers/testApp');

describe('API de autenticación', () => {
  it('registra, inicia sesión y devuelve el perfil', async () => {
    const app = buildTestApp();
    const registered = await app.handle('POST', '/auth/register', {
      body: { email: 'ana@example.com', password: PASSWORD, name: 'Ana' },
    });
    assert.equal(registered.status, 201);
    assert.equal(registered.body.user.role, ROLES.CUSTOMER);

    const { headers } = await signUp(app, 'beto@example.com');
    const me = await app.handle('GET', '/auth/me', { headers });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, 'beto@example.com');
  });

  it('rechaza credenciales incorrectas y tokens inválidos', async () => {
    const app = buildTestApp();
    await signUp(app, 'ana@example.com');
    const login = await app.handle('POST', '/auth/login', { body: { email: 'ana@example.com', password: 'otra-clave-123' } });
    assert.equal(login.status, 401);

    const me = await app.handle('GET', '/auth/me', { headers: { authorization: 'Bearer basura' } });
    assert.equal(me.status, 401);
  });

  it('permite al administrador crear usuarios de soporte', async () => {
    const app = buildTestApp();
    const admin = await signUp(app, 'root@example.com', { role: ROLES.ADMIN });

    const created = await app.handle('POST', '/admin/users', {
      headers: admin.headers,
      body: { email: 'soporte@example.com', password: PASSWORD, name: 'Soporte', role: ROLES.SUPPORT },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.user.role, ROLES.SUPPORT);
  });

  it('impide a los clientes usar la ruta administrativa', async () => {
    const app = buildTestApp();
    const customer = await signUp(app, 'ana@example.com');
    const response = await app.handle('POST', '/admin/users', {
      headers: customer.headers,
      body: { email: 'otro@example.com', password: PASSWORD, name: 'Otro' },
    });
    assert.equal(response.status, 403);
  });

  it('permite a soporte consultar pedidos de clientes sin poder administrarlos', async () => {
    const app = buildTestApp();
    const customer = await signUp(app, 'ana@example.com');
    const support = await signUp(app, 'soporte@example.com', { role: ROLES.SUPPORT });
    const created = await app.handle('POST', '/orders', {
      headers: customer.headers,
      body: { items: [{ productId: 'prod_cable', quantity: 1 }], country: 'MX' },
    });

    const viewed = await app.handle('GET', `/orders/${created.body.order.id}`, { headers: support.headers });
    assert.equal(viewed.status, 200);

    const refund = await app.handle('POST', '/payments/pay_inexistente/refunds', { headers: support.headers, body: {} });
    assert.equal(refund.status, 403);
  });
});
