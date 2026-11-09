'use strict';

const { ConflictError } = require('../utils/errors');

class InventoryService {
  constructor({ inventoryRepository, logger }) {
    this.inventoryRepository = inventoryRepository;
    this.logger = logger;
  }

  /**
   * Reserva todos los artículos o ninguno: si alguno falla, libera lo ya reservado.
   */
  async reserveAll(items) {
    const reserved = [];
    try {
      for (const item of items) {
        const ok = await this.inventoryRepository.reserve(item.productId, item.quantity);
        if (!ok) {
          throw new ConflictError(`Stock insuficiente para ${item.productId}`, {
            productId: item.productId,
          });
        }
        reserved.push(item);
      }
    } catch (error) {
      await this.releaseAll(reserved);
      throw error;
    }
  }

  /**
   * Ajusta las reservas de un pedido existente cuando cambian sus artículos.
   */
  async applyDelta(previousItems, nextItems) {
    const previous = new Map(previousItems.map((item) => [item.productId, item.quantity]));

    for (const item of nextItems) {
      const delta = item.quantity - (previous.get(item.productId) || 0);
      if (delta > 0) {
        const ok = await this.inventoryRepository.reserve(item.productId, delta);
        if (!ok) {
          throw new ConflictError(`Stock insuficiente para ${item.productId}`, {
            productId: item.productId,
          });
        }
      } else if (delta < 0) {
        await this.inventoryRepository.release(item.productId, -delta);
      }
    }
  }

  async releaseAll(items) {
    for (const item of items) {
      await this.inventoryRepository.release(item.productId, item.quantity);
    }
  }

  async commitAll(items) {
    for (const item of items) {
      await this.inventoryRepository.commit(item.productId, item.quantity);
    }
  }
}

module.exports = { InventoryService };
