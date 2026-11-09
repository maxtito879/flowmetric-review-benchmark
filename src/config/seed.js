'use strict';

const categories = [
  { id: 'perifericos', name: 'Periféricos' },
  { id: 'monitores', name: 'Monitores' },
  { id: 'accesorios', name: 'Accesorios' },
];

const products = [
  { id: 'prod_keyboard', name: 'Teclado mecánico', category: 'perifericos', priceCents: 129900, active: true },
  { id: 'prod_mouse', name: 'Mouse inalámbrico', category: 'perifericos', priceCents: 45900, active: true },
  { id: 'prod_monitor', name: 'Monitor 27"', category: 'monitores', priceCents: 389900, active: true },
  { id: 'prod_cable', name: 'Cable USB-C', category: 'accesorios', priceCents: 14900, active: true },
  { id: 'prod_legacy', name: 'Adaptador descontinuado', category: 'accesorios', priceCents: 9900, active: false },
  { id: 'prod_webcam', name: 'Cámara web HD', category: 'perifericos', priceCents: 79900, active: true },
  { id: 'prod_headset', name: 'Audífonos con micrófono', category: 'perifericos', priceCents: 89900, active: true },
  { id: 'prod_hub', name: 'Hub USB de 7 puertos', category: 'accesorios', priceCents: 34900, active: true },
  { id: 'prod_stand', name: 'Soporte para monitor', category: 'accesorios', priceCents: 59900, active: true },
  { id: 'prod_ultrawide', name: 'Monitor ultrawide 34"', category: 'monitores', priceCents: 699900, active: true },
  { id: 'prod_pad', name: 'Tapete de escritorio', category: 'accesorios', priceCents: 19900, active: true },
  { id: 'prod_dock', name: 'Base de carga inalámbrica', category: 'accesorios', priceCents: 49900, active: true },
  { id: 'prod_ssd', name: 'SSD externo de 1 TB', category: 'accesorios', priceCents: 159900, active: true },
];

const stock = {
  prod_keyboard: 25,
  prod_mouse: 40,
  prod_monitor: 8,
  prod_cable: 100,
  prod_legacy: 3,
  prod_webcam: 30,
  prod_headset: 22,
  prod_hub: 60,
  prod_stand: 18,
  prod_ultrawide: 5,
  prod_pad: 75,
  prod_dock: 33,
  prod_ssd: 14,
};

const coupons = [
  { code: 'PROMO20', type: 'percent', valueBps: 2000, minSubtotalCents: 50000, active: true },
  { code: 'WELCOME10', type: 'percent', valueBps: 1000, minSubtotalCents: 0, active: true },
  { code: 'SAVE500', type: 'fixed', valueCents: 50000, minSubtotalCents: 0, active: true },
  { code: 'EXPIRED5', type: 'percent', valueBps: 500, minSubtotalCents: 0, active: false },
];

module.exports = { categories, products, stock, coupons };
