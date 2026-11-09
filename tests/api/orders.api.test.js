'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ROLES } = require('../../src/config/constants');
const { buildTestApp, signUp } = require('../helpers/testApp');

const orderBody = { items: [{ productId: 'prod_mouse', quantity: 2 }], country: 'MX' };

describe('API de pedidos', () => {
  it('exige autenticación', async () => {
    const app = buildTestApp();
    const response = await app.handle('POST', '/orders', { body: orderBody });
    assert.equal(response.status, 401);
  });

  it('devuelve 404 para rutas desconocidas', async () => {
    const response = await buildTestApp().handle('GET', '/nada');
    assert.equal(response.status, 404);
  });

  it('valida el cuerpo del pedido', async () => {
    const app = buildTestApp();
    const { headers } = await signUp(app, 'ana@example.com');
    const response = await app.handle('POST', '/orders', { headers, body: { items: [], country: 'MX' } });
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  it('recorre el flujo completo: crear, pagar y consultar', async () => {
    const app = buildTestApp();
    const { headers } = await signUp(app, 'ana@example.com');

    const created = await app.handle('POST', '/orders', { headers, body: orderBody });
    assert.equal(created.status, 201);

    const paid = await app.handle('POST', `/orders/${created.body.order.id}/payments`, {
      headers: { ...headers, 'Idempotency-Key': 'api-key-0001' },
      body: { paymentToken: 'tok_visa' },
    });
    assert.equal(paid.status, 201);

    const fetched = await app.handle('GET', `/orders/${created.body.order.id}`, { headers });
    assert.equal(fetched.body.order.status, 'PAID');
  });

  it('actualiza los artículos de un pedido propio', async () => {
    const app = buildTestApp();
    const { headers } = await signUp(app, 'ana@example.com');
    const created = await app.handle('POST', '/orders', { headers, body: orderBody });

    const response = await app.handle('PATCH', `/orders/${created.body.order.id}/items`, {
      headers,
      body: { items: [{ productId: 'prod_cable', quantity: 4 }] },
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.order.items[0].productId, 'prod_cable');
  });

  it('lista pedidos filtrando por estado', async () => {
    const app = buildTestApp();
    const { headers } = await signUp(app, 'ana@example.com');
    await app.handle('POST', '/orders', { headers, body: orderBody });

    const pending = await app.handle('GET', '/orders', { headers, query: { status: 'PENDING_PAYMENT' } });
    assert.equal(pending.body.orders.length, 1);
    const paid = await app.handle('GET', '/orders', { headers, query: { status: 'PAID' } });
    assert.equal(paid.body.orders.length, 0);
    const invalid = await app.handle('GET', '/orders', { headers, query: { status: 'LOST' } });
    assert.equal(invalid.status, 400);
  });

  it('impide que otro cliente consulte el pedido', async () => {
    const app = buildTestApp();
    const owner = await signUp(app, 'ana@example.com');
    const other = await signUp(app, 'beto@example.com');
    const created = await app.handle('POST', '/orders', { headers: owner.headers, body: orderBody });

    const response = await app.handle('GET', `/orders/${created.body.order.id}`, { headers: other.headers });
    assert.equal(response.status, 403);
  });

  it('solo los administradores pueden reembolsar', async () => {
    const app = buildTestApp();
    const customer = await signUp(app, 'ana@example.com');
    const admin = await signUp(app, 'root@example.com', { role: ROLES.ADMIN });
    const created = await app.handle('POST', '/orders', { headers: customer.headers, body: orderBody });
    const paid = await app.handle('POST', `/orders/${created.body.order.id}/payments`, {
      headers: { ...customer.headers, 'idempotency-key': 'api-key-0002' },
      body: { paymentToken: 'tok_visa' },
    });
    const paymentId = paid.body.payment.id;

    const denied = await app.handle('POST', `/payments/${paymentId}/refunds`, { headers: customer.headers, body: {} });
    assert.equal(denied.status, 403);

    const allowed = await app.handle('POST', `/payments/${paymentId}/refunds`, { headers: admin.headers, body: {} });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.payment.status, 'REFUNDED');
  });
});
