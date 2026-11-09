'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ValidationError } = require('../../src/utils/errors');
const { validateLogin, validateRegister } = require('../../src/validators/authValidator');

const valid = { email: ' ana@example.com ', password: 'una-clave-larga', name: ' Ana ' };

describe('validateRegister', () => {
  it('normaliza los campos de texto', () => {
    assert.deepEqual(validateRegister(valid), {
      email: 'ana@example.com',
      password: 'una-clave-larga',
      name: 'Ana',
      role: undefined,
    });
  });

  it('rechaza correos mal formados y contraseñas cortas', () => {
    assert.throws(() => validateRegister({ ...valid, email: 'sin-arroba' }), ValidationError);
    assert.throws(() => validateRegister({ ...valid, password: 'corta' }), ValidationError);
  });

  it('rechaza contraseñas iguales al correo', () => {
    assert.throws(() => validateRegister({ ...valid, email: 'ana@example.com', password: 'ANA@example.com' }), ValidationError);
  });

  it('rechaza roles desconocidos', () => {
    assert.throws(() => validateRegister({ ...valid, role: 'superuser' }), ValidationError);
  });
});

describe('validateLogin', () => {
  it('exige correo y contraseña', () => {
    assert.deepEqual(validateLogin({ email: 'a@b.co', password: 'x' }), { email: 'a@b.co', password: 'x' });
    assert.throws(() => validateLogin({ email: 'a@b.co' }), ValidationError);
  });
});
