'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { InventoryRepository } = require('../../src/repositories/InventoryRepository');
const { InventoryService } = require('../../src/services/InventoryService');
const { ConflictError } = require('../../src/utils/errors');

function build() {
  const inventoryRepository = new InventoryRepository({ a: 5, b: 1 });
  return { inventoryRepository, service: new InventoryService({ inventoryRepository }) };
}

describe('InventoryService', () => {
  it('reserva todos los artículos', async () => {
    const { inventoryRepository, service } = build();
    await service.reserveAll([{ productId: 'a', quantity: 2 }, { productId: 'b', quantity: 1 }]);
    assert.equal(await inventoryRepository.getAvailable('a'), 3);
    assert.equal(await inventoryRepository.getReserved('b'), 1);
  });

  it('libera lo ya reservado cuando un artículo falla', async () => {
    const { inventoryRepository, service } = build();
    await assert.rejects(
      service.reserveAll([{ productId: 'a', quantity: 2 }, { productId: 'b', quantity: 2 }]),
      ConflictError,
    );
    assert.equal(await inventoryRepository.getAvailable('a'), 5);
    assert.equal(await inventoryRepository.getReserved('a'), 0);
  });

  it('libera y confirma reservas', async () => {
    const { inventoryRepository, service } = build();
    const items = [{ productId: 'a', quantity: 3 }];
    await service.reserveAll(items);
    await service.releaseAll(items);
    assert.equal(await inventoryRepository.getAvailable('a'), 5);

    await service.reserveAll(items);
    await service.commitAll(items);
    assert.equal(await inventoryRepository.getReserved('a'), 0);
    assert.equal(await inventoryRepository.getAvailable('a'), 2);
  });
});
