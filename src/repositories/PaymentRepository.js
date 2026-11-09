'use strict';

class PaymentRepository {
  constructor() {
    this.payments = new Map();
  }

  async save(payment) {
    this.payments.set(payment.id, structuredClone(payment));
    return structuredClone(payment);
  }

  async findById(id) {
    const payment = this.payments.get(id);
    return payment ? structuredClone(payment) : null;
  }

  async findByIdempotencyKey(key) {
    for (const payment of this.payments.values()) {
      if (payment.idempotencyKey === key) return structuredClone(payment);
    }
    return null;
  }

  async findByOrderId(orderId) {
    return [...this.payments.values()]
      .filter((payment) => payment.orderId === orderId)
      .map((payment) => structuredClone(payment));
  }

  async update(id, changes) {
    const current = this.payments.get(id);
    if (!current) return null;
    const next = { ...current, ...changes };
    this.payments.set(id, next);
    return structuredClone(next);
  }
}

module.exports = { PaymentRepository };
