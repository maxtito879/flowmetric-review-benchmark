'use strict';

/**
 * Pasarela de pagos simulada. Tokens especiales:
 *  - tok_declined: el cargo es rechazado.
 *  - tok_unavailable: la pasarela lanza un error de red.
 */
class FakePaymentGateway {
  constructor() {
    this.charges = [];
    this.refunds = [];
  }

  async charge({ amountCents, currency, token, reference }) {
    if (token === 'tok_unavailable') {
      throw new Error('Gateway unavailable');
    }
    this.charges.push({ amountCents, currency, token, reference });
    if (token === 'tok_declined') {
      return { id: null, status: 'declined', declineCode: 'card_declined' };
    }
    return { id: `ch_${this.charges.length}`, status: 'succeeded' };
  }

  async refund({ chargeId, amountCents }) {
    this.refunds.push({ chargeId, amountCents });
    return { id: `re_${this.refunds.length}`, status: 'succeeded' };
  }
}

module.exports = { FakePaymentGateway };
