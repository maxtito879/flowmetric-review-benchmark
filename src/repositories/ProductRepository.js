'use strict';

class ProductRepository {
  constructor(products = []) {
    this.products = new Map(products.map((product) => [product.id, { ...product }]));
  }

  async findById(id) {
    const product = this.products.get(id);
    return product ? { ...product } : null;
  }

  async findByIds(ids) {
    return ids
      .map((id) => this.products.get(id))
      .filter(Boolean)
      .map((product) => ({ ...product }));
  }

  async search({ query, category, minPriceCents, maxPriceCents } = {}) {
    const needle = query ? query.trim().toLowerCase() : null;
    return [...this.products.values()]
      .filter((product) => product.active)
      .filter((product) => !needle || product.name.toLowerCase().includes(needle))
      .filter((product) => !category || product.category === category)
      .filter((product) => minPriceCents === undefined || product.priceCents >= minPriceCents)
      .filter((product) => maxPriceCents === undefined || product.priceCents <= maxPriceCents)
      .map((product) => ({ ...product }));
  }

  async findAll() {
    return [...this.products.values()].map((product) => ({ ...product }));
  }
}

module.exports = { ProductRepository };
