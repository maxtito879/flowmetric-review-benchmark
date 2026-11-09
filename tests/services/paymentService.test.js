'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ORDER_STATUS, PAYMENT_STATUS, ROLES } = require('../../src/config/constants');
const { ConflictError, PaymentError } = require('../../src/utils/errors');
const { buildTestApp } = require('../helpers/testApp');

const customer = { id: 'usr_a', role: ROLES.CUSTOMER };
const admin = { id: 'usr_admin', role: ROLES.ADMIN };

async function setup() {
  const app = buildTestApp();
  const order = await app.deps.orderService.createOrder(customer, {
    items: [{ productId: 'prod_keyboard', quantity: 1 }],
    couponCode: null,
    country: 'MX',
  });
  return { app, order, ...app.deps };
}

const pay = (paymentService, order, overrides = {}) =>
  paymentService.charge(customer, order.id, { paymentToken: 'tok_visa', idempotencyKey: 'key-0001-abcd', ...overrides });

describe('PaymentService', () => {
  it('cobra el pedido, lo marca como pagado y confirma el inventario', async () => {
    const { order, paymentService, orderRepository, inventoryRepository, paymentGateway } = await setup();

    const payment = await pay(paymentService, order);

    assert.equal(payment.status, PAYMENT_STATUS.SUCCEEDED);
    assert.equal(payment.amountCents, order.totals.totalCents);
    assert.equal((await orderRepository.findById(order.id)).status, ORDER_STATUS.PAID);
    assert.equal(await inventoryRepository.getReserved('prod_keyboard'), 0);
    assert.equal(paymentGateway.charges.length, 1);
  });

  it('repite la respuesta con la misma clave de idempotencia sin volver a cobrar', async () => {
    const { order, paymentService, paymentGateway } = await setup();

    const first = await pay(paymentService, order);
    const second = await pay(paymentService, order);

    assert.equal(second.id, first.id);
    assert.equal(paymentGateway.charges.length, 1);
  });

  it('rechaza reutilizar la clave en otra operación', async () => {
    const { order, paymentService } = await setup();
    await pay(paymentService, order);
    await assert.rejects(
      paymentService.charge({ id: 'usr_other', role: ROLES.CUSTOMER }, order.id, {
        paymentToken: 'tok_visa',
        idempotencyKey: 'key-0001-abcd',
      }),
      ConflictError,
    );
  });

  it('deja el pedido pendiente cuando el pago es rechazado', async () => {
    const { order, paymentService, orderRepository, paymentRepository } = await setup();

    await assert.rejects(pay(paymentService, order, { paymentToken: 'tok_declined' }), PaymentError);

    assert.equal((await orderRepository.findById(order.id)).status, ORDER_STATUS.PENDING_PAYMENT);
    const [failed] = await paymentRepository.findByOrderId(order.id);
    assert.equal(failed.status, PAYMENT_STATUS.FAILED);
  });

  it('registra el fallo cuando la pasarela no responde', async () => {
    const { order, paymentService, paymentRepository } = await setup();
    await assert.rejects(pay(paymentService, order, { paymentToken: 'tok_unavailable' }), PaymentError);
    const [failed] = await paymentRepository.findByOrderId(order.id);
    assert.equal(failed.failureReason, 'gateway_error');
  });

  it('no cobra pedidos que ya no están pendientes', async () => {
    const { order, paymentService } = await setup();
    await pay(paymentService, order);
    await assert.rejects(pay(paymentService, order, { idempotencyKey: 'key-0002-abcd' }), ConflictError);
  });

  it('lista los pagos de un pedido y conserva el historial de reembolsos', async () => {
    const { order, paymentService } = await setup();
    const payment = await pay(paymentService, order);
    await paymentService.refund(admin, payment.id, { amountCents: 20000, reason: 'Producto dañado' });

    const [listed] = await paymentService.listForOrder(customer, order.id);
    assert.equal(listed.id, payment.id);
    assert.equal(listed.refunds.length, 1);
    assert.equal(listed.refunds[0].reason, 'Producto dañado');
    assert.equal(listed.refunds[0].requestedBy, admin.id);
  });

  it('permite reembolsos parciales y completos', async () => {
    const { order, paymentService, orderRepository } = await setup();
    const payment = await pay(paymentService, order);

    const partial = await paymentService.refund(admin, payment.id, { amountCents: 50000 });
    assert.equal(partial.status, PAYMENT_STATUS.PARTIALLY_REFUNDED);
    assert.equal(partial.refundedCents, 50000);

    const rest = await paymentService.refund(admin, payment.id, {});
    assert.equal(rest.status, PAYMENT_STATUS.REFUNDED);
    assert.equal(rest.refundedCents, payment.amountCents);
    assert.equal((await orderRepository.findById(order.id)).status, ORDER_STATUS.REFUNDED);
    assert.equal(rest.refunds.length, 2);
  });
});
