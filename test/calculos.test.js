let calculos;
let calcularResultados;
let calcularDensidadeAgua;
beforeAll(() => {
  global.window = {};
  calculos = require('../docs/js/calculos.js');
  ({ calcularResultados, calcularDensidadeAgua } = calculos);
});

describe('calcularDensidadeAgua', () => {
  test('returns table value for exact temperature', () => {
    expect(calcularDensidadeAgua(20)).toBeCloseTo(0.9982, 4);
    expect(calcularDensidadeAgua(25)).toBeCloseTo(0.9970, 4);
  });

  test('interpolates between temperatures', () => {
    const v = calcularDensidadeAgua(21.5); // between 21 and 22
    // linear interpolation between 0.9980 and 0.9978 -> 0.9979
    expect(v).toBeCloseTo(0.9979, 4);
  });
});

describe('calcularResultados', () => {

  test('tipo real', () => {
    const dados = {
      determinacoesUmidadeReal: [{ soloSecoTara: 5, tara: 1, soloUmidoTara: 7 }],
      determinacoesPicnometro: [{
        massaSoloUmido: 8,
        massaPicAgua: 10,
        massaPicAmostraAgua: 9,
        temperatura: 25
      }]
    };
    const res = calcularResultados('real', dados);
    expect(res.umidadeMedia).toBeCloseTo(50.0, 5);
    expect(res.mediaDensidadeReal).toBeCloseTo(0.839579, 5);
  });

  test('tipo max-min', () => {
    const dados = {
      determinacoesMax: [{ moldeSolo: 10, molde: 5, volume: 2, w: 10 }],
      determinacoesMin: [{ moldeSolo: 8, molde: 5, volume: 2, w: 5 }]
    };
    const res = calcularResultados('max-min', dados);
    expect(res.mediaGamadMax).toBeCloseTo(2.272727, 5);
    expect(res.mediaGamadMin).toBeCloseTo(1.428571, 5);
  });

  test('tipo in-situ', () => {
    const dados = {
      determinacoesInSitu: [{ moldeSolo: 10, molde: 2, volume: 2 }],
      determinacoesUmidadeTopo: [{ soloSecoTara: 4, tara: 2, soloUmidoTara: 5 }],
      determinacoesUmidadeBase: [{ soloSecoTara: 4, tara: 2, soloUmidoTara: 6 }],
      refReal: 2.5,
      refMax: 2.7,
      refMin: 1.5
    };
    const res = calcularResultados('in-situ', dados);
    expect(res.gamadMedia).toBeCloseTo(2.333333, 5);
    expect(res.status).toBe('APROVADO');
  });
});
