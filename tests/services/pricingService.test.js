'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const seed = require('../../src/config/seed');
const { CouponRepository } = require('../../src/repositories/CouponRepository');
const { PricingService } = require('../../src/services/PricingService');
const { ShippingService } = require('../../src/services/ShippingService');
const { TaxService } = require('../../src/services/TaxService');
const { ValidationError } = require('../../src/utils/errors');

function buildPricing() {
  return new PricingService({
    couponRepository: new CouponRepository(seed.coupons),
    taxService: new TaxService(),
    shippingService: new ShippingService(),
  });
}

const keyboard = { productId: 'prod_keyboard', name: 'Teclado', unitPriceCents: 129900, quantity: 1 };
const mouse = { productId: 'prod_mouse', name: 'Mouse', unitPriceCents: 45900, quantity: 1 };

describe('PricingService', () => {
  it('calcula impuesto y envío gratis sobre el importe de la compra', async () => {
    const quote = await buildPricing().quote([keyboard], { country: 'MX' });
    assert.deepEqual(quote, {
      couponCode: null,
      subtotalCents: 129900,
      discountCents: 0,
      taxCents: 20784,
      shippingCents: 0,
      totalCents: 150684,
    });
  });

  it('cobra envío cuando el importe no llega al umbral', async () => {
    const quote = await buildPricing().quote([mouse], { country: 'MX' });
    assert.equal(quote.shippingCents, 15000);
    assert.equal(quote.taxCents, 7344);
    assert.equal(quote.totalCents, 45900 + 7344 + 15000);
  });

  it('aplica cupones porcentuales antes del impuesto', async () => {
    const quote = await buildPricing().quote([keyboard], { couponCode: 'PROMO20', country: 'MX' });
    assert.equal(quote.discountCents, 25980);
    assert.equal(quote.taxCents, 16627);
    assert.equal(quote.shippingCents, 0);
    assert.equal(quote.totalCents, 103920 + 16627);
  });

  it('aplica cupones de importe fijo', async () => {
    const quote = await buildPricing().quote([keyboard], { couponCode: 'SAVE500', country: 'US' });
    assert.equal(quote.discountCents, 50000);
  });

  it('rechaza cupones inactivos, inexistentes o bajo el mínimo', async () => {
    const pricing = buildPricing();
    await assert.rejects(pricing.quote([keyboard], { couponCode: 'EXPIRED5', country: 'MX' }), ValidationError);
    await assert.rejects(pricing.quote([keyboard], { couponCode: 'NOPE', country: 'MX' }), ValidationError);
    await assert.rejects(pricing.quote([{ ...mouse, unitPriceCents: 10000 }], { couponCode: 'PROMO20', country: 'MX' }), ValidationError);
  });

  it('usa la tasa del país', async () => {
    const quote = await buildPricing().quote([keyboard], { country: 'ES' });
    assert.equal(quote.taxCents, 27279);
  });
});
