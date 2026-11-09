'use strict';

const { randomUUID } = require('node:crypto');

function newId(prefix) {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

module.exports = { newId };
