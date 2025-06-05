/**
 * @jest-environment jsdom
 */

beforeEach(() => {
  jest.resetModules();
  localStorage.clear();
  require('../docs/js/equipamentos.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
});

test('adicionar e listar cilindros e capsulas', () => {
  const eq = window.calculadora.equipamentos;
  eq.adicionarCilindro('1', 2, 3);
  eq.adicionarCapsula('A', 4);
  expect(eq.listarCilindros()).toEqual([{ numero: '1', peso: 2, volume: 3 }]);
  expect(eq.listarCapsulas()).toEqual([{ numero: 'A', peso: 4 }]);
});
