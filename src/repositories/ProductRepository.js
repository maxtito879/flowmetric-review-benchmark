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

  async findAll() {
    return [...this.products.values()].map((product) => ({ ...product }));
  }
}

module.exports = { ProductRepository };
