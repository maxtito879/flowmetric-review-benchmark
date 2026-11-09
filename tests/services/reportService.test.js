'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { buildTestApp, signUp } = require('../helpers/testApp');

const range = { from: '2026-03-01T00:00:00.000Z', to: '2026-03-31T23:59:59.999Z' };

async function seedSales() {
  let now = new Date('2026-03-10T12:00:00.000Z');
  const app = buildTestApp({ clock: { now: () => now } });
  const { orderService, paymentService } = app.deps;
  const ana = await signUp(app, 'ana@example.com');
  const beto = await signUp(app, 'beto@example.com');

  const buy = async (customer, items, key) => {
    const order = await orderService.createOrder(customer.user, { items, couponCode: null, country: 'MX' });
    await paymentService.charge(customer.user, order.id, { paymentToken: 'tok_visa', idempotencyKey: key });
    return order;
  };

  const first = await buy(ana, [{ productId: 'prod_keyboard', quantity: 1 }], 'sales-key-0001');
  now = new Date('2026-03-11T09:00:00.000Z');
  const second = await buy(beto, [{ productId: 'prod_keyboard', quantity: 2 }, { productId: 'prod_mouse', quantity: 1 }], 'sales-key-0002');
  now = new Date('2026-03-11T15:00:00.000Z');
  await orderService.createOrder(ana.user, { items: [{ productId: 'prod_cable', quantity: 1 }], couponCode: null, country: 'MX' });

  return { app, first, second, ...app.deps };
}

describe('ReportService', () => {
  it('resume ventas excluyendo pedidos pendientes', async () => {
    const { reportService, first, second } = await seedSales();
    const summary = await reportService.salesSummary(range);

    assert.equal(summary.orderCount, 2);
    assert.equal(summary.revenueCents, first.totals.totalCents + second.totals.totalCents);
    assert.equal(summary.averageOrderCents, Math.round(summary.revenueCents / 2));
    assert.deepEqual(summary.ordersByStatus, { PAID: 2, PENDING_PAYMENT: 1 });
  });

  it('descuenta los reembolsos del ingreso neto', async () => {
    const { reportService, paymentRepository, paymentService } = await seedSales();
    const [payment] = await paymentRepository.findAll();
    await paymentService.refund({ id: 'usr_admin', role: 'admin' }, payment.id, { amountCents: 10000 });

    const summary = await reportService.salesSummary(range);
    assert.equal(summary.refundedCents, 10000);
    assert.equal(summary.netRevenueCents, summary.revenueCents - 10000);
  });

  it('calcula los productos más vendidos por ingreso', async () => {
    const { reportService } = await seedSales();
    const [top, second] = await reportService.topProducts({ ...range, limit: 2 });
    assert.equal(top.productId, 'prod_keyboard');
    assert.equal(top.units, 3);
    assert.equal(second.productId, 'prod_mouse');
  });

  it('agrupa el ingreso por día', async () => {
    const { reportService } = await seedSales();
    const days = await reportService.dailyRevenue(range);
    assert.deepEqual(days.map((day) => [day.date, day.orders]), [['2026-03-10', 1], ['2026-03-11', 1]]);
  });

  it('exporta pedidos y clientes en CSV', async () => {
    const { reportService } = await seedSales();
    const orders = await reportService.exportOrdersCsv(range);
    assert.equal(orders.trim().split('\n').length, 4);
    assert.match(orders, /^id,createdAt,userId,status,country,coupon/);

    const customers = await reportService.exportCustomersCsv();
    assert.match(customers, /ana@example.com/);
    assert.match(customers, /beto@example.com/);
  });
});
