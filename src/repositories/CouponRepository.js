'use strict';

class CouponRepository {
  constructor(coupons = []) {
    this.coupons = new Map(coupons.map((coupon) => [coupon.code, { ...coupon }]));
  }

  async findByCode(code) {
    const coupon = this.coupons.get(code);
    return coupon ? { ...coupon } : null;
  }
}

module.exports = { CouponRepository };
