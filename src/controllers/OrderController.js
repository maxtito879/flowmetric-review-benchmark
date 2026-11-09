'use strict';

const { validateCreateOrder } = require('../validators/orderValidator');

class OrderController {
  constructor({ orderService }) {
    this.orderService = orderService;
  }

  async create(req) {
    const input = validateCreateOrder(req.body);
    const order = await this.orderService.createOrder(req.user, input);
    return { status: 201, body: { order } };
  }

  async list(req) {
    const orders = await this.orderService.listOrders(req.user, { userId: req.query.userId });
    return { status: 200, body: { orders } };
  }

  async get(req) {
    const order = await this.orderService.getOrder(req.user, req.params.id);
    return { status: 200, body: { order } };
  }

  async cancel(req) {
    const order = await this.orderService.cancelOrder(req.user, req.params.id);
    return { status: 200, body: { order } };
  }
}

module.exports = { OrderController };
