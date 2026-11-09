'use strict';

const { ORDER_STATUS, ROLES } = require('../config/constants');
const { ConflictError, ForbiddenError, NotFoundError } = require('../utils/errors');
const { newId } = require('../utils/ids');
const { systemClock } = require('../utils/clock');

class OrderService {
  constructor({
    orderRepository,
    productRepository,
    inventoryService,
    pricingService,
    notificationService,
    clock = systemClock,
  }) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.inventoryService = inventoryService;
    this.pricingService = pricingService;
    this.notificationService = notificationService;
    this.clock = clock;
  }

  async createOrder(user, input) {
    const lines = await this.loadLines(input.items);
    const { couponCode, ...totals } = await this.pricingService.quote(lines, {
      couponCode: input.couponCode,
      country: input.country,
    });
    await this.inventoryService.reserveAll(input.items);

    const timestamp = this.clock.now().toISOString();
    const order = {
      id: newId('ord'),
      userId: user.id,
      items: lines,
      country: input.country,
      couponCode,
      totals,
      status: ORDER_STATUS.PENDING_PAYMENT,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      await this.orderRepository.save(order);
    } catch (error) {
      await this.inventoryService.releaseAll(input.items);
      throw error;
    }

    await this.notificationService.notify('order.created', { orderId: order.id, userId: user.id });
    return order;
  }

  async loadLines(items) {
    const products = await this.productRepository.findByIds(items.map((item) => item.productId));
    const byId = new Map(products.map((product) => [product.id, product]));

    return items.map((item) => {
      const product = byId.get(item.productId);
      if (!product || !product.active) {
        throw new NotFoundError(`Producto no disponible: ${item.productId}`);
      }
      return {
        productId: product.id,
        name: product.name,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
      };
    });
  }

  async getOrder(user, orderId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Pedido no encontrado');
    }
    if (order.userId !== user.id && user.role !== ROLES.ADMIN) {
      throw new ForbiddenError('No tienes acceso a este pedido');
    }
    return order;
  }

  async listOrders(user) {
    return this.orderRepository.findByUserId(user.id);
  }

  async cancelOrder(user, orderId) {
    const order = await this.getOrder(user, orderId);
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      throw new ConflictError('Solo se pueden cancelar pedidos pendientes de pago');
    }

    await this.inventoryService.releaseAll(order.items);
    const updated = await this.orderRepository.update(order.id, {
      status: ORDER_STATUS.CANCELLED,
      updatedAt: this.clock.now().toISOString(),
    });
    await this.notificationService.notify('order.cancelled', { orderId: order.id, userId: order.userId });
    return updated;
  }

  async markPaid(orderId) {
    const order = await this.orderRepository.findById(orderId);
    await this.inventoryService.commitAll(order.items);
    return this.orderRepository.update(orderId, {
      status: ORDER_STATUS.PAID,
      updatedAt: this.clock.now().toISOString(),
    });
  }

  async markRefunded(orderId) {
    return this.orderRepository.update(orderId, {
      status: ORDER_STATUS.REFUNDED,
      updatedAt: this.clock.now().toISOString(),
    });
  }
}

module.exports = { OrderService };
