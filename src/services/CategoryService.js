'use strict';

const { NotFoundError } = require('../utils/errors');

class CategoryService {
  constructor({ categoryRepository }) {
    this.categoryRepository = categoryRepository;
  }

  async list() {
    return this.categoryRepository.findAll();
  }

  async get(id) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Categoría no encontrada');
    }
    return category;
  }
}

module.exports = { CategoryService };
