'use strict';

const {
  MAX_ITEMS_PER_ORDER,
  MAX_NOTES_LENGTH,
  MAX_QUANTITY_PER_ITEM,
  ORDER_STATUS,
  SUPPORTED_COUNTRIES,
} = require('../config/constants');
const { ValidationError } = require('../utils/errors');

const COUPON_PATTERN = /^[A-Z0-9]{3,20}$/;

function validateCreateOrder(body) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Cuerpo de la solicitud inválido');
  }

  const errors = [];
  const { items, couponCode, country, notes } = body;
  const merged = new Map();

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('items debe ser un arreglo no vacío');
  } else if (items.length > MAX_ITEMS_PER_ORDER) {
    errors.push(`items no puede tener más de ${MAX_ITEMS_PER_ORDER} elementos`);
  } else {
    items.forEach((item, index) => {
      if (!item || typeof item.productId !== 'string' || item.productId.trim() === '') {
        errors.push(`items[${index}].productId es obligatorio`);
        return;
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
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

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string' || notes.trim().length > MAX_NOTES_LENGTH) {
      errors.push(`notes debe ser un texto de hasta ${MAX_NOTES_LENGTH} caracteres`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Pedido inválido', errors);
  }

  return {
    items: [...merged].map(([productId, quantity]) => ({ productId, quantity })),
    couponCode: couponCode || null,
    country: normalizedCountry,
    notes: typeof notes === 'string' && notes.trim() !== '' ? notes.trim() : null,
  };
}

function validateUpdateItems(body) {
  if (!body || !Array.isArray(body.items)) {
    throw new ValidationError('items debe ser un arreglo');
  }
  if (body.items.length > MAX_ITEMS_PER_ORDER) {
    throw new ValidationError(`items no puede tener más de ${MAX_ITEMS_PER_ORDER} elementos`);
  }

  const errors = [];
  body.items.forEach((item, index) => {
    if (!item || typeof item.productId !== 'string' || item.productId.trim() === '') {
      errors.push(`items[${index}].productId es obligatorio`);
    }
    if (typeof item.quantity !== 'number' || item.quantity < 0 || item.quantity > MAX_QUANTITY_PER_ITEM) {
      errors.push(`items[${index}].quantity debe estar entre 0 y ${MAX_QUANTITY_PER_ITEM}`);
    }
  });

  if (errors.length > 0) {
    throw new ValidationError('Actualización inválida', errors);
  }

  return {
    items: body.items.map((item) => ({ productId: item.productId.trim(), quantity: item.quantity })),
  };
}

function validateListFilters(query = {}) {
  const { status } = query;
  if (status === undefined) {
    return {};
  }
  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw new ValidationError('status inválido');
  }
  return { status };
}

module.exports = { validateCreateOrder, validateUpdateItems, validateListFilters };
