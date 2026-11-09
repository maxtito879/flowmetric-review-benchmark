'use strict';

const { validateProductQuery } = require('../validators/catalogValidator');

class ProductController {
  constructor({ productService }) {
    this.productService = productService;
  }

  async list(req) {
    const filters = validateProductQuery(req.query);
    const { items, ...pagination } = await this.productService.list(filters);
    return { status: 200, body: { products: items, pagination } };
  }

  async get(req) {
    const product = await this.productService.get(req.params.id);
    return { status: 200, body: { product } };
  }
}

module.exports = { ProductController };
