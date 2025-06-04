/**
 * @jest-environment jsdom
 */

const realSetInterval = global.setInterval;

if (typeof global.structuredClone !== 'function') {
  global.structuredClone = val => JSON.parse(JSON.stringify(val));
}

beforeEach(async () => {
  jest.resetModules();
  global.setInterval = jest.fn(); // avoid real intervals
  require('fake-indexeddb/auto');
  require('../docs/js/db.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
  global.db = window.calculadora.db;
  await global.db.init();
});

afterEach(async () => {
  global.setInterval = realSetInterval;
  const conn = await db.init();
  conn.close();
  const req = indexedDB.deleteDatabase('CalculadoraCompacidadeDB');
  return new Promise(resolve => {
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
});

describe('IndexedDB operations', () => {
  test('salvarRegistro e carregarRegistro', async () => {
    const rec = { registro: 1, data: '2024-01-01', operador: 'A', material: 'X' };
    await db.salvarRegistro('real', { ...rec });
    const loaded = await db.carregarRegistro('real', 1);
    expect(loaded).toEqual(expect.objectContaining(rec));
  });

  test('listarRegistros retorna todos registros', async () => {
    const r1 = { registro: 1, data: '2024-01-01', operador: 'A', material: 'M1' };
    const r2 = { registro: 2, data: '2024-01-02', operador: 'B', material: 'M2' };
    await db.salvarRegistro('real', { ...r1 });
    await db.salvarRegistro('real', { ...r2 });
    const lista = await db.listarRegistros('real');
    const registros = lista.map(r => r.registro).sort();
    expect(registros).toEqual([1, 2]);
  });

  test('excluirRegistro remove registro', async () => {
    const r = { registro: 3, data: '2024-01-03', operador: 'C', material: 'M3' };
    await db.salvarRegistro('real', { ...r });
    await db.excluirRegistro('real', 3);
    const res = await db.carregarRegistro('real', 3);
    expect(res).toBeNull();
  });
});
