'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { toPublicUser } = require('../../src/utils/serializers');

describe('toPublicUser', () => {
  it('omite el hash de la contraseña y los campos internos', () => {
    const user = {
      id: 'usr_1',
      email: 'ana@example.com',
      name: 'Ana',
      role: 'customer',
      passwordHash: 'salt:hash',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    assert.deepEqual(toPublicUser(user), { id: 'usr_1', email: 'ana@example.com', name: 'Ana', role: 'customer' });
  });
});
