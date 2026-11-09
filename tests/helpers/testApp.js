'use strict';

const { createApp } = require('../../src/app');
const { ROLES } = require('../../src/config/constants');
const { createLogger } = require('../../src/utils/logger');

const PASSWORD = 'correct-horse-battery';

function buildTestApp(options = {}) {
  return createApp({
    tokenSecret: 'test-secret',
    logger: createLogger({ level: 'silent' }),
    ...options,
  });
}

async function signUp(app, email, { role = ROLES.CUSTOMER } = {}) {
  if (role === ROLES.CUSTOMER) {
    await app.handle('POST', '/auth/register', { body: { email, password: PASSWORD, name: 'Usuario de prueba' } });
  } else {
    await app.deps.authService.createUser({ email, password: PASSWORD, name: 'Usuario de prueba', role });
  }
  const login = await app.handle('POST', '/auth/login', { body: { email, password: PASSWORD } });
  return {
    user: login.body.user,
    token: login.body.token,
    headers: { authorization: `Bearer ${login.body.token}` },
  };
}

module.exports = { buildTestApp, signUp, PASSWORD };
