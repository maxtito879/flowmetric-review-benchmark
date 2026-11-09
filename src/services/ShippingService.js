'use strict';

const { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } = require('../config/constants');

class ShippingService {
  calculate(merchandiseCents, countryCode) {
    if (merchandiseCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
      return 0;
    }
    return countryCode === 'MX' ? FLAT_SHIPPING_CENTS : FLAT_SHIPPING_CENTS * 2;
  }
}

module.exports = { ShippingService };
