'use strict';

const { MAX_ITEMS_PER_ORDER, MAX_QUANTITY_PER_ITEM, SUPPORTED_COUNTRIES } = require('../config/constants');
const { ValidationError } = require('../utils/errors');
const { isNonEmptyString, isPositiveInteger } = require('./common');

const COUPON_PATTERN = /^[A-Z0-9]{3,20}$/;

function validateCreateOrder(body) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Cuerpo de la solicitud inválido');
  }

  const errors = [];
  const { items, couponCode, country } = body;
  const merged = new Map();

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('items debe ser un arreglo no vacío');
  } else if (items.length > MAX_ITEMS_PER_ORDER) {
    errors.push(`items no puede tener más de ${MAX_ITEMS_PER_ORDER} elementos`);
  } else {
    items.forEach((item, index) => {
      if (!item || !isNonEmptyString(item.productId)) {
        errors.push(`items[${index}].productId es obligatorio`);
        return;
      }
      if (!isPositiveInteger(item.quantity)) {
        errors.push(`items[${index}].quantity debe ser un entero positivo`);
        return;
      }
      const productId = item.productId.trim();
      merged.set(productId, (merged.get(productId) || 0) + item.quantity);
    });
  }

  for (const [productId, quantity] of merged) {
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      errors.push(`La cantidad total de ${productId} no puede superar ${MAX_QUANTITY_PER_ITEM}`);
    }
  }

  const normalizedCountry = typeof country === 'string' ? country.trim().toUpperCase() : '';
  if (!SUPPORTED_COUNTRIES.includes(normalizedCountry)) {
    errors.push('country no está soportado');
  }

  if (couponCode !== undefined && couponCode !== null) {
    if (typeof couponCode !== 'string' || !COUPON_PATTERN.test(couponCode)) {
      errors.push('couponCode tiene un formato inválido');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Pedido inválido', errors);
  }

  return {
    items: [...merged].map(([productId, quantity]) => ({ productId, quantity })),
    couponCode: couponCode || null,
    country: normalizedCountry,
  };
}

module.exports = { validateCreateOrder };
