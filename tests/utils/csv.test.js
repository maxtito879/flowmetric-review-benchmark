'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { toCsv } = require('../../src/utils/csv');

describe('toCsv', () => {
  it('genera encabezados, filas y salto de línea final', () => {
    assert.equal(toCsv(['a', 'b'], [[1, 'x'], [2, 'y']]), 'a,b\n1,x\n2,y\n');
  });

  it('escapa comas, comillas y saltos de línea', () => {
    const csv = toCsv(['nombre'], [['Pérez, Ana'], ['Dijo "hola"'], ['línea 1\nlínea 2']]);
    assert.equal(csv, 'nombre\n"Pérez, Ana"\n"Dijo ""hola"""\n"línea 1\nlínea 2"\n');
  });

  it('deja vacíos los valores nulos', () => {
    assert.equal(toCsv(['a', 'b'], [[null, undefined]]), 'a,b\n,\n');
  });
});
