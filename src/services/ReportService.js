'use strict';

const { ORDER_STATUS } = require('../config/constants');
const { toCsv } = require('../utils/csv');
const { dayKey } = require('../utils/dates');
const { percentage, sumCents } = require('../utils/money');

function countBy(items, keyOf) {
  const counts = {};
  for (const item of items) {
    const key = keyOf(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

class ReportService {
  constructor({ orderRepository, paymentRepository, userRepository }) {
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
    this.userRepository = userRepository;
  }

  async salesSummary({ from, to }) {
    const orders = await this.orderRepository.findBetween(from, to);
    const sold = orders.filter((order) => order.status !== ORDER_STATUS.PENDING_PAYMENT);
    const payments = (await this.paymentRepository.findAll()).filter(
      (payment) => payment.createdAt >= from && payment.createdAt <= to,
    );

    const revenueCents = sumCents(sold.map((order) => order.totals.totalCents));
    const refundedCents = sumCents(payments.map((payment) => payment.refundedCents));

    return {
      from,
      to,
      orderCount: sold.length,
      revenueCents,
      refundedCents,
      netRevenueCents: revenueCents - refundedCents,
      refundRatePercent: percentage(refundedCents, revenueCents),
      averageOrderCents: sold.length > 0 ? Math.round(revenueCents / sold.length) : 0,
      ordersByStatus: countBy(orders, (order) => order.status),
    };
  }

  async topProducts({ from, to, limit }) {
    const orders = await this.orderRepository.findBetween(from, to);
    const totals = new Map();

    for (const order of orders.filter((item) => item.status === ORDER_STATUS.PAID)) {
      for (const line of order.items) {
        const current = totals.get(line.productId) || { productId: line.productId, name: line.name, units: 0, revenueCents: 0 };
        current.units += line.quantity;
        current.revenueCents += line.unitPriceCents * line.quantity;
        totals.set(line.productId, current);
      }
    }

    return [...totals.values()].sort((a, b) => b.revenueCents - a.revenueCents).slice(0, limit);
  }

  async dailyRevenue({ from, to }) {
    const orders = await this.orderRepository.findBetween(from, to);
    const days = new Map();

    for (const order of orders.filter((item) => item.status === ORDER_STATUS.PAID)) {
      const key = dayKey(order.createdAt);
      const current = days.get(key) || { date: key, orders: 0, revenueCents: 0 };
      current.orders += 1;
      current.revenueCents += order.totals.totalCents;
      days.set(key, current);
    }

    return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  async exportOrdersCsv({ from, to }) {
    const orders = await this.orderRepository.findBetween(from, to);
    const rows = orders.map((order) => [
      order.id,
      order.createdAt,
      order.userId,
      order.status,
      order.country,
      order.couponCode,
      order.totals.subtotalCents,
      order.totals.discountCents,
      order.totals.taxCents,
      order.totals.shippingCents,
      order.totals.totalCents,
    ]);
    return toCsv(
      ['id', 'createdAt', 'userId', 'status', 'country', 'coupon', 'subtotalCents', 'discountCents', 'taxCents', 'shippingCents', 'totalCents'],
      rows,
    );
  }

  async exportCustomersCsv() {
    const users = await this.userRepository.findAll();
    const rows = users.map((user) => [user.id, user.email, user.name, user.role, user.createdAt]);
    return toCsv(['id', 'email', 'name', 'role', 'createdAt'], rows);
  }
}

module.exports = { ReportService };
