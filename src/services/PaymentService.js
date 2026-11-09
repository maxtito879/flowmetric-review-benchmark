'use strict';

const { CURRENCY, ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');
const { ConflictError, ForbiddenError, NotFoundError, PaymentError, ValidationError } = require('../utils/errors');
const { newId } = require('../utils/ids');
const { systemClock } = require('../utils/clock');

class PaymentService {
  constructor({ paymentRepository, orderService, paymentGateway, notificationService, clock = systemClock }) {
    this.paymentRepository = paymentRepository;
    this.orderService = orderService;
    this.paymentGateway = paymentGateway;
    this.notificationService = notificationService;
    this.clock = clock;
  }

  async charge(user, orderId, { paymentToken, idempotencyKey }) {
    const existing = await this.paymentRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return this.replay(existing, user, orderId);
    }

    const order = await this.orderService.getOrder(user, orderId);
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      throw new ConflictError('El pedido no está pendiente de pago');
    }

    const payment = await this.paymentRepository.save({
      id: newId('pay'),
      orderId: order.id,
      userId: user.id,
      amountCents: order.totals.totalCents,
      refundedCents: 0,
      currency: CURRENCY,
      status: PAYMENT_STATUS.PENDING,
      idempotencyKey,
      createdAt: this.clock.now().toISOString(),
    });

    let result;
    try {
      result = await this.paymentGateway.charge({
        amountCents: payment.amountCents,
        currency: payment.currency,
        token: paymentToken,
        reference: payment.id,
      });
    } catch (error) {
      await this.paymentRepository.update(payment.id, {
        status: PAYMENT_STATUS.FAILED,
        failureReason: 'gateway_error',
      });
      throw new PaymentError('El proveedor de pagos no está disponible');
    }

    if (result.status !== 'succeeded') {
      await this.paymentRepository.update(payment.id, {
        status: PAYMENT_STATUS.FAILED,
        failureReason: result.declineCode || 'declined',
      });
      throw new PaymentError('El pago fue rechazado');
    }

    const succeeded = await this.paymentRepository.update(payment.id, {
      status: PAYMENT_STATUS.SUCCEEDED,
      gatewayChargeId: result.id,
    });
    await this.orderService.markPaid(order.id);
    await this.notificationService.notify('payment.succeeded', { paymentId: payment.id, orderId: order.id });
    return succeeded;
  }

  replay(existing, user, orderId) {
    if (existing.userId !== user.id || existing.orderId !== orderId) {
      throw new ConflictError('La clave de idempotencia ya se usó en otra operación');
    }
    if (existing.status === PAYMENT_STATUS.PENDING) {
      throw new ConflictError('El pago sigue en proceso');
    }
    if (existing.status === PAYMENT_STATUS.FAILED) {
      throw new PaymentError('El pago fue rechazado');
    }
    return existing;
  }

  async getPayment(user, paymentId) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Pago no encontrado');
    }
    await this.orderService.getOrder(user, payment.orderId);
    return payment;
  }

  async refund(user, paymentId, { amountCents, reason }) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Pago no encontrado');
    }
    if (![PAYMENT_STATUS.SUCCEEDED, PAYMENT_STATUS.PARTIALLY_REFUNDED].includes(payment.status)) {
      throw new ConflictError('El pago no admite reembolsos');
    }

    const refundable = payment.amountCents - payment.refundedCents;
    const amount = amountCents === undefined ? refundable : amountCents;
    if (amount <= 0 || amount > refundable) {
      throw new ValidationError('Importe de reembolso inválido');
    }

    await this.paymentGateway.refund({ chargeId: payment.gatewayChargeId, amountCents: amount });

    const refundedCents = payment.refundedCents + amount;
    const status =
      refundedCents === payment.amountCents ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PARTIALLY_REFUNDED;
    const updated = await this.paymentRepository.update(payment.id, { refundedCents, status, lastRefundReason: reason || null });

    if (status === PAYMENT_STATUS.REFUNDED) {
      await this.orderService.markRefunded(payment.orderId);
    }
    await this.notificationService.notify('payment.refunded', {
      paymentId: payment.id,
      amountCents: amount,
      requestedBy: user.id,
    });
    return updated;
  }
}

module.exports = { PaymentService };
