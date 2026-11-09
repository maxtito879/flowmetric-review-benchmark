'use strict';

const { ValidationError } = require('../utils/errors');
const { applyBasisPoints, sumCents } = require('../utils/money');

class PricingService {
  constructor({ couponRepository, taxService, shippingService }) {
    this.couponRepository = couponRepository;
    this.taxService = taxService;
    this.shippingService = shippingService;
  }

  /**
   * Calcula los importes de un pedido. Todos los valores están en centavos.
   * El impuesto y el envío se calculan sobre el importe ya descontado.
   */
  async quote(lines, { couponCode, country }) {
    const subtotalCents = sumCents(lines.map((line) => line.unitPriceCents * line.quantity));
    const { coupon, discountCents } = await this.resolveDiscount(subtotalCents, couponCode);
    const taxableCents = subtotalCents - discountCents;
    const taxCents = this.taxService.calculate(taxableCents, country);
    const shippingCents = this.shippingService.calculate(taxableCents, country);

    return {
      couponCode: coupon ? coupon.code : null,
      subtotalCents,
      discountCents,
      taxCents,
      shippingCents,
      totalCents: taxableCents + taxCents + shippingCents,
    };
  }

  async resolveDiscount(subtotalCents, couponCode) {
    if (!couponCode) {
      return { coupon: null, discountCents: 0 };
    }

    const coupon = await this.couponRepository.findByCode(couponCode);
    if (!coupon || !coupon.active) {
      throw new ValidationError('Cupón inválido o inactivo');
    }
    if (subtotalCents < coupon.minSubtotalCents) {
      throw new ValidationError('El pedido no alcanza el mínimo para este cupón');
    }

    const discountCents =
      coupon.type === 'percent' ? applyBasisPoints(subtotalCents, coupon.valueBps) : coupon.valueCents;
    return { coupon, discountCents };
  }
}

module.exports = { PricingService };
