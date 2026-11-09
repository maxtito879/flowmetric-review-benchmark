'use strict';

class CategoryController {
  constructor({ categoryService }) {
    this.categoryService = categoryService;
  }

  async list() {
    const categories = await this.categoryService.list();
    return { status: 200, body: { categories } };
  }

  async get(req) {
    const category = await this.categoryService.get(req.params.id);
    return { status: 200, body: { category } };
  }
}

module.exports = { CategoryController };
