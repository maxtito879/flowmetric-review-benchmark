'use strict';

const { TAX_RATES_BPS } = require('../config/constants');
const { ValidationError } = require('../utils/errors');
const { applyBasisPoints } = require('../utils/money');

class TaxService {
  constructor(rates = TAX_RATES_BPS) {
    this.rates = rates;
  }

  rateFor(countryCode) {
    const rate = this.rates[countryCode];
    if (rate === undefined) {
      throw new ValidationError(`País no soportado: ${countryCode}`);
    }
    return rate;
  }

  calculate(taxableCents, countryCode) {
    return applyBasisPoints(taxableCents, this.rateFor(countryCode));
  }
}

module.exports = { TaxService };
