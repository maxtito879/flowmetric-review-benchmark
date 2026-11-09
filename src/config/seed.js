'use strict';

const products = [
  { id: 'prod_keyboard', name: 'Teclado mecánico', priceCents: 129900, active: true },
  { id: 'prod_mouse', name: 'Mouse inalámbrico', priceCents: 45900, active: true },
  { id: 'prod_monitor', name: 'Monitor 27"', priceCents: 389900, active: true },
  { id: 'prod_cable', name: 'Cable USB-C', priceCents: 14900, active: true },
  { id: 'prod_legacy', name: 'Adaptador descontinuado', priceCents: 9900, active: false },
];

const stock = {
  prod_keyboard: 25,
  prod_mouse: 40,
  prod_monitor: 8,
  prod_cable: 100,
  prod_legacy: 3,
};

const coupons = [
  { code: 'PROMO20', type: 'percent', valueBps: 2000, minSubtotalCents: 50000, active: true },
  { code: 'WELCOME10', type: 'percent', valueBps: 1000, minSubtotalCents: 0, active: true },
  { code: 'SAVE500', type: 'fixed', valueCents: 50000, minSubtotalCents: 0, active: true },
  { code: 'EXPIRED5', type: 'percent', valueBps: 500, minSubtotalCents: 0, active: false },
];

module.exports = { products, stock, coupons };
