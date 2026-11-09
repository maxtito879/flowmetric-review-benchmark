'use strict';

class CategoryRepository {
  constructor(categories = []) {
    this.categories = new Map(categories.map((category) => [category.id, { ...category }]));
  }

  async findAll() {
    return [...this.categories.values()].map((category) => ({ ...category }));
  }

  async findById(id) {
    const category = this.categories.get(id);
    return category ? { ...category } : null;
  }
}

module.exports = { CategoryRepository };
