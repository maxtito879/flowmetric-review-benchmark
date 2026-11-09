'use strict';

class OrderRepository {
  constructor() {
    this.orders = new Map();
  }

  async save(order) {
    this.orders.set(order.id, structuredClone(order));
    return structuredClone(order);
  }

  async findById(id) {
    const order = this.orders.get(id);
    return order ? structuredClone(order) : null;
  }

  async findByUserId(userId) {
    return [...this.orders.values()]
      .filter((order) => order.userId === userId)
      .map((order) => structuredClone(order));
  }

  async update(id, changes) {
    const current = this.orders.get(id);
    if (!current) return null;
    const next = { ...current, ...changes };
    this.orders.set(id, next);
    return structuredClone(next);
  }
}

module.exports = { OrderRepository };
