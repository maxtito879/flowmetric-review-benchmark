'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ORDER_STATUS, ROLES } = require('../../src/config/constants');
const { ConflictError, ForbiddenError, NotFoundError } = require('../../src/utils/errors');
const { buildTestApp } = require('../helpers/testApp');

const customer = { id: 'usr_a', role: ROLES.CUSTOMER };
const stranger = { id: 'usr_b', role: ROLES.CUSTOMER };
const admin = { id: 'usr_admin', role: ROLES.ADMIN };

const input = (items, extra = {}) => ({ items, couponCode: null, country: 'MX', ...extra });

describe('OrderService', () => {
  it('crea el pedido, calcula totales y reserva inventario', async () => {
    const app = buildTestApp();
    const { orderService, inventoryRepository, notificationService } = app.deps;

    const order = await orderService.createOrder(customer, input([{ productId: 'prod_keyboard', quantity: 2 }]));

    assert.equal(order.status, ORDER_STATUS.PENDING_PAYMENT);
    assert.equal(order.totals.subtotalCents, 259800);
    assert.equal(order.totals.totalCents, 259800 + 41568);
    assert.equal(await inventoryRepository.getAvailable('prod_keyboard'), 23);
    assert.equal(await inventoryRepository.getReserved('prod_keyboard'), 2);
    assert.equal(notificationService.list('order.created').length, 1);
  });

  it('no reserva inventario si un producto no existe', async () => {
    const app = buildTestApp();
    const { orderService, inventoryRepository } = app.deps;

    await assert.rejects(
      orderService.createOrder(customer, input([{ productId: 'prod_mouse', quantity: 1 }, { productId: 'nope', quantity: 1 }])),
      NotFoundError,
    );
    assert.equal(await inventoryRepository.getReserved('prod_mouse'), 0);
  });

  it('rechaza productos inactivos', async () => {
    const app = buildTestApp();
    await assert.rejects(
      app.deps.orderService.createOrder(customer, input([{ productId: 'prod_legacy', quantity: 1 }])),
      NotFoundError,
    );
  });

  it('rechaza pedidos sin stock suficiente', async () => {
    const app = buildTestApp();
    await assert.rejects(
      app.deps.orderService.createOrder(customer, input([{ productId: 'prod_monitor', quantity: 9 }])),
      ConflictError,
    );
  });

  it('cancela pedidos pendientes y libera inventario', async () => {
    const app = buildTestApp();
    const { orderService, inventoryRepository } = app.deps;
    const order = await orderService.createOrder(customer, input([{ productId: 'prod_mouse', quantity: 3 }]));

    const cancelled = await orderService.cancelOrder(customer, order.id);

    assert.equal(cancelled.status, ORDER_STATUS.CANCELLED);
    assert.equal(await inventoryRepository.getAvailable('prod_mouse'), 40);
    await assert.rejects(orderService.cancelOrder(customer, order.id), ConflictError);
  });

  it('solo permite ver pedidos propios, salvo administradores', async () => {
    const app = buildTestApp();
    const { orderService } = app.deps;
    const order = await orderService.createOrder(customer, input([{ productId: 'prod_cable', quantity: 1 }]));

    await assert.rejects(orderService.getOrder(stranger, order.id), ForbiddenError);
    assert.equal((await orderService.getOrder(admin, order.id)).id, order.id);
    assert.equal((await orderService.listOrders(stranger)).length, 0);
    assert.equal((await orderService.listOrders(customer)).length, 1);
  });
});
