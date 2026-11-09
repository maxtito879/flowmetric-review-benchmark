'use strict';

const { NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/pagination');

const SORTERS = {
  name: (a, b) => a.name.localeCompare(b.name),
  price_asc: (a, b) => a.priceCents - b.priceCents,
  price_desc: (a, b) => b.priceCents - a.priceCents,
};

class ProductService {
  constructor({ productRepository, inventoryRepository }) {
    this.productRepository = productRepository;
    this.inventoryRepository = inventoryRepository;
  }

  async list({ sort = 'name', pagination = { page: 1, pageSize: 10 }, ...criteria } = {}) {
    const products = await this.productRepository.search(criteria);
    const page = paginate(products.sort(SORTERS[sort] || SORTERS.name), pagination);
    return { ...page, items: await Promise.all(page.items.map((product) => this.withStock(product))) };
  }

  async get(id) {
    const product = await this.productRepository.findById(id);
    if (!product || !product.active) {
      throw new NotFoundError('Producto no encontrado');
    }
    return this.withStock(product);
  }

  async withStock(product) {
    return { ...product, available: await this.inventoryRepository.getAvailable(product.id) };
  }
}

module.exports = { ProductService };
