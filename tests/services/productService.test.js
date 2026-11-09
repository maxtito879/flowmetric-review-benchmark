'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { NotFoundError } = require('../../src/utils/errors');
const { buildTestApp } = require('../helpers/testApp');

const defaults = { pagination: { page: 1, pageSize: 50 } };

describe('ProductService', () => {
  it('solo lista productos activos e incluye el stock disponible', async () => {
    const { productService } = buildTestApp().deps;
    const result = await productService.list(defaults);
    assert.equal(result.total, 12);
    assert.equal(result.items.some((product) => product.id === 'prod_legacy'), false);
    assert.equal(result.items.find((product) => product.id === 'prod_monitor').available, 8);
  });

  it('filtra por texto, categoría y rango de precio', async () => {
    const { productService } = buildTestApp().deps;
    const byText = await productService.list({ ...defaults, query: 'monitor' });
    assert.deepEqual(byText.items.map((product) => product.id).sort(), ['prod_monitor', 'prod_stand', 'prod_ultrawide']);

    const byCategory = await productService.list({ ...defaults, category: 'monitores' });
    assert.equal(byCategory.total, 2);

    const byPrice = await productService.list({ ...defaults, minPriceCents: 40000, maxPriceCents: 60000 });
    assert.deepEqual(byPrice.items.map((product) => product.id).sort(), ['prod_dock', 'prod_mouse', 'prod_stand']);
  });

  it('ordena por precio', async () => {
    const { productService } = buildTestApp().deps;
    const result = await productService.list({ ...defaults, sort: 'price_desc' });
    assert.equal(result.items[0].id, 'prod_ultrawide');
    assert.equal(result.items.at(-1).id, 'prod_cable');
  });

  it('pagina los resultados', async () => {
    const { productService } = buildTestApp().deps;
    const second = await productService.list({ pagination: { page: 2, pageSize: 5 } });
    assert.equal(second.items.length, 5);
    assert.equal(second.page, 2);
    assert.equal(second.totalPages, 3);
  });

  it('devuelve un producto por id y rechaza los inactivos', async () => {
    const { productService } = buildTestApp().deps;
    assert.equal((await productService.get('prod_cable')).name, 'Cable USB-C');
    await assert.rejects(productService.get('prod_legacy'), NotFoundError);
  });
});
