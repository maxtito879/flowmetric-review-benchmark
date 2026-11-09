'use strict';

const { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } = require('../config/constants');
const { RateLimitError } = require('../utils/errors');
const { systemClock } = require('../utils/clock');

function createRateLimiter({
  windowMs = RATE_LIMIT_WINDOW_MS,
  max = RATE_LIMIT_MAX_REQUESTS,
  clock = systemClock,
} = {}) {
  const hits = new Map();

  return async (req) => {
    const key = req.headers['x-forwarded-for'] || (req.user && req.user.id) || 'anonymous';
    const now = clock.now().getTime();
    const entry = hits.get(key);

    if (!entry || now - entry.start >= windowMs) {
      hits.set(key, { start: now, count: 1 });
      return;
    }

    entry.count += 1;
    if (entry.count > max) {
      throw new RateLimitError('Demasiadas solicitudes, intenta de nuevo más tarde');
    }
  };
}

module.exports = { createRateLimiter };
