'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ROLES } = require('../../src/config/constants');
const { ConflictError, UnauthorizedError } = require('../../src/utils/errors');
const { buildTestApp, PASSWORD } = require('../helpers/testApp');

const registration = { email: 'Ana@Example.com', password: PASSWORD, name: 'Ana' };

describe('AuthService', () => {
  it('registra clientes con el correo normalizado', async () => {
    const { authService } = buildTestApp().deps;
    const user = await authService.register(registration);
    assert.equal(user.email, 'ana@example.com');
    assert.equal(user.role, ROLES.CUSTOMER);
    assert.equal('passwordHash' in user, false);
  });

  it('rechaza correos duplicados', async () => {
    const { authService } = buildTestApp().deps;
    await authService.register(registration);
    await assert.rejects(authService.register({ ...registration, email: 'ana@example.com' }), ConflictError);
  });

  it('emite tokens que identifican al usuario', async () => {
    const { authService } = buildTestApp().deps;
    await authService.register(registration);
    const { token } = await authService.login({ email: 'ana@example.com', password: PASSWORD });
    const user = await authService.authenticate(token);
    assert.equal(user.email, 'ana@example.com');
  });

  it('rechaza contraseñas incorrectas', async () => {
    const { authService } = buildTestApp().deps;
    await authService.register(registration);
    await assert.rejects(authService.login({ email: 'ana@example.com', password: 'otra-clave-123' }), UnauthorizedError);
    await assert.rejects(authService.login({ email: 'nadie@example.com', password: PASSWORD }), UnauthorizedError);
  });

  it('rechaza tokens manipulados o expirados', async () => {
    let now = new Date('2026-01-01T00:00:00Z');
    const clock = { now: () => now };
    const { authService } = buildTestApp({ clock }).deps;
    await authService.register(registration);
    const { token } = await authService.login({ email: 'ana@example.com', password: PASSWORD });

    await assert.rejects(authService.authenticate(`${token}x`), UnauthorizedError);
    await assert.rejects(authService.authenticate('basura'), UnauthorizedError);

    now = new Date('2026-01-01T02:00:00Z');
    await assert.rejects(authService.authenticate(token), UnauthorizedError);
  });
});
