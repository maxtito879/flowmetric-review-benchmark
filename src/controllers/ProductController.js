'use strict';

class ProductController {
  constructor({ productService }) {
    this.productService = productService;
  }

  async list() {
    const products = await this.productService.list();
    return { status: 200, body: { products } };
  }

  async get(req) {
    const product = await this.productService.get(req.params.id);
    return { status: 200, body: { product } };
  }
}

module.exports = { ProductController };
