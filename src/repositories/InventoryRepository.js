'use strict';

class InventoryRepository {
  constructor(initialStock = {}) {
    this.stock = new Map(
      Object.entries(initialStock).map(([productId, quantity]) => [
        productId,
        { available: quantity, reserved: 0 },
      ]),
    );
  }

  async getAvailable(productId) {
    const entry = this.stock.get(productId);
    return entry ? entry.available : 0;
  }

  async getReserved(productId) {
    const entry = this.stock.get(productId);
    return entry ? entry.reserved : 0;
  }

  async reserve(productId, quantity) {
    const entry = this.stock.get(productId);
    if (!entry || entry.available < quantity) return false;
    entry.available -= quantity;
    entry.reserved += quantity;
    return true;
  }

  async release(productId, quantity) {
    const entry = this.stock.get(productId);
    if (!entry) return;
    const amount = Math.min(quantity, entry.reserved);
    entry.reserved -= amount;
    entry.available += amount;
  }

  async commit(productId, quantity) {
    const entry = this.stock.get(productId);
    if (!entry) return;
    entry.reserved = Math.max(0, entry.reserved - quantity);
  }
}

module.exports = { InventoryRepository };
