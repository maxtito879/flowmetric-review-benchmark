'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ROLES } = require('../../src/config/constants');
const { PASSWORD, buildTestApp, signUp } = require('../helpers/testApp');

describe('API de catálogo', () => {
  it('lista productos con paginación', async () => {
    const response = await buildTestApp().handle('GET', '/products', { query: { pageSize: '5' } });
    assert.equal(response.status, 200);
    assert.equal(response.body.products.length, 5);
    assert.equal(response.body.pagination.total, 12);
    assert.equal(response.body.pagination.totalPages, 3);
  });

  it('aplica filtros y ordenamiento', async () => {
    const response = await buildTestApp().handle('GET', '/products', {
      query: { category: 'monitores', sort: 'price_asc' },
    });
    assert.deepEqual(response.body.products.map((product) => product.id), ['prod_monitor', 'prod_ultrawide']);
  });

  it('rechaza parámetros inválidos con el identificador de solicitud', async () => {
    const response = await buildTestApp().handle('GET', '/products', { query: { sort: 'random', page: '0' } });
    assert.equal(response.status, 400);
    assert.equal(response.body.error.details.length, 2);
    assert.match(response.body.error.requestId, /^req_/);
  });

  it('expone categorías', async () => {
    const app = buildTestApp();
    const list = await app.handle('GET', '/categories');
    assert.equal(list.body.categories.length, 3);
    assert.equal((await app.handle('GET', '/categories/perifericos')).status, 200);
    assert.equal((await app.handle('GET', '/categories/nada')).status, 404);
  });
});

describe('API de reportes', () => {
  it('solo permite el acceso a administradores', async () => {
    const app = buildTestApp();
    const customer = await signUp(app, 'ana@example.com');
    const admin = await signUp(app, 'root@example.com', { role: ROLES.ADMIN });

    assert.equal((await app.handle('GET', '/admin/reports/sales')).status, 401);
    assert.equal((await app.handle('GET', '/admin/reports/sales', { headers: customer.headers })).status, 403);

    const allowed = await app.handle('GET', '/admin/reports/sales', { headers: admin.headers });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.report.orderCount, 0);
  });

  it('valida el rango y devuelve CSV como texto', async () => {
    const app = buildTestApp();
    const admin = await signUp(app, 'root@example.com', { role: ROLES.ADMIN });

    const invalid = await app.handle('GET', '/admin/reports/top-products', { headers: admin.headers, query: { limit: '99' } });
    assert.equal(invalid.status, 400);

    const csv = await app.handle('GET', '/admin/exports/customers.csv', { headers: admin.headers });
    assert.equal(csv.status, 200);
    assert.equal(csv.headers['content-type'], 'text/csv; charset=utf-8');
    assert.match(csv.body, /root@example.com/);
  });
});

describe('Límite de intentos de inicio de sesión', () => {
  it('bloquea al décimo primer intento dentro de la ventana', async () => {
    const app = buildTestApp();
    const attempt = () => app.handle('POST', '/auth/login', { body: { email: 'nadie@example.com', password: PASSWORD } });

    for (let index = 0; index < 10; index += 1) {
      assert.equal((await attempt()).status, 401);
    }
    assert.equal((await attempt()).status, 429);
  });

  it('reinicia el contador cuando termina la ventana', async () => {
    let now = new Date('2026-01-01T00:00:00Z');
    const app = buildTestApp({ clock: { now: () => now } });
    const attempt = () => app.handle('POST', '/auth/login', { body: { email: 'nadie@example.com', password: PASSWORD } });

    for (let index = 0; index < 11; index += 1) await attempt();
    now = new Date('2026-01-01T00:02:00Z');
    assert.equal((await attempt()).status, 401);
  });
});
