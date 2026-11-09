'use strict';

const { NotFoundError } = require('../utils/errors');

class ProductService {
  constructor({ productRepository, inventoryRepository }) {
    this.productRepository = productRepository;
    this.inventoryRepository = inventoryRepository;
  }

  async list() {
    const products = await this.productRepository.findAll();
    return Promise.all(products.filter((product) => product.active).map((product) => this.withStock(product)));
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
