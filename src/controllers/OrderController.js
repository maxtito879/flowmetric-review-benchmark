'use strict';

const {
  validateCreateOrder,
  validateListFilters,
  validateUpdateItems,
} = require('../validators/orderValidator');

function toErrorResponse(error) {
  return { status: 400, body: { error: { code: error.code || 'ORDER_ERROR', message: error.message } } };
}

class OrderController {
  constructor({ orderService }) {
    this.orderService = orderService;
  }

  async create(req) {
    try {
      const input = validateCreateOrder(req.body);
      const order = await this.orderService.createOrder(req.user, input);
      return { status: 201, body: { order } };
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async list(req) {
    const filters = validateListFilters(req.query);
    const orders = await this.orderService.listOrders(req.user, filters);
    return { status: 200, body: { orders } };
  }

  async get(req) {
    const order = await this.orderService.getOrder(req.user, req.params.id);
    return { status: 200, body: { order } };
  }

  async updateItems(req) {
    try {
      const input = validateUpdateItems(req.body);
      const order = await this.orderService.updateOrderItems(req.user, req.params.id, input);
      return { status: 200, body: { order } };
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async cancel(req) {
    const order = await this.orderService.cancelOrder(req.user, req.params.id);
    return { status: 200, body: { order } };
  }
}

module.exports = { OrderController };
