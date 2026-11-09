'use strict';

const { validateChargeRequest, validateRefundRequest } = require('../validators/paymentValidator');

class PaymentController {
  constructor({ paymentService }) {
    this.paymentService = paymentService;
  }

  async charge(req) {
    const input = validateChargeRequest(req.body, req.headers);
    const payment = await this.paymentService.charge(req.user, req.params.id, input);
    return { status: 201, body: { payment } };
  }

  async get(req) {
    const payment = await this.paymentService.getPayment(req.user, req.params.id);
    return { status: 200, body: { payment } };
  }

  async refund(req) {
    const input = validateRefundRequest(req.body);
    const payment = await this.paymentService.refund(req.user, req.params.id, input);
    return { status: 200, body: { payment } };
  }
}

module.exports = { PaymentController };
