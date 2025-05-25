// cr-main/docs/js/calculos.js
// Módulo de cálculos automáticos para os diferentes tipos de ensaio
window.calculadora = window.calculadora || {};
window.calculadora.calculos = (() => {
  // Função auxiliar para calcular média ignorando valores não numéricos ou zero
  function calcularMediaValida(valores) {
    const validos = valores.filter(v => typeof v === 'number' && !isNaN(v) && v !== 0);
    return validos.length > 0 ? validos.reduce((a, b) => a + b, 0) / validos.length : 0;
  }

  // Função auxiliar para validar se um valor é numérico e maior que zero
  function isValidPositiveNumber(value) {
    return typeof value === 'number' && !isNaN(value) && value > 0;
  }

  // Função auxiliar para validar se um valor é numérico (incluindo zero)
  function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  }

  // --- Calcular Densidade In Situ ---
  function calcularDensidadeInSitu(dados) {
    const resultados = {
      determinacoesInSitu: [],
      determinacoesUmidadeTopo: [],
      determinacoesUmidadeBase: [],
      umidadeMediaTopo: 0,
      umidadeMediaBase: 0,
      gamadTopo: null,
      gamadBase: null,
      indiceVaziosTopo: null,
      indiceVaziosBase: null,
      crTopo: null,
      crBase: null,
      status: 'AGUARDANDO DADOS'
    };

    let gamaNatTotal = 0;
    let countGamaNat = 0;
    if (dados.determinacoesInSitu && Array.isArray(dados.determinacoesInSitu)) {
      dados.determinacoesInSitu.forEach(det => {
        const solo = isValidNumber(det.moldeSolo) && isValidNumber(det.molde)
          ? det.moldeSolo - det.molde
          : 0;
        const gamaNat = isValidPositiveNumber(solo) && isValidPositiveNumber(det.volume)
          ? solo / det.volume
          : 0;
        resultados.determinacoesInSitu.push({ ...det, solo, gamaNat });
        if (isValidPositiveNumber(gamaNat)) {
          gamaNatTotal += gamaNat;
          countGamaNat++;
        }
      });
    }
    const gamaNatMedio = countGamaNat > 0 ? gamaNatTotal / countGamaNat : 0;

    const umidadesTopo = [];
    if (dados.determinacoesUmidadeTopo && Array.isArray(dados.determinacoesUmidadeTopo)) {
      dados.determinacoesUmidadeTopo.forEach(det => {
        const soloSeco = isValidNumber(det.soloSecoTara) && isValidNumber(det.tara)
          ? det.soloSecoTara - det.tara
          : 0;
        const agua = isValidNumber(det.soloUmidoTara) && isValidNumber(det.soloSecoTara)
          ? det.soloUmidoTara - det.soloSecoTara
          : 0;
        const umidade = isValidPositiveNumber(soloSeco) && isValidNumber(agua)
          ? (agua / soloSeco) * 100
          : 0;
        resultados.determinacoesUmidadeTopo.push({ ...det, soloSeco, agua, umidade });
        if (isValidNumber(umidade)) umidadesTopo.push(umidade);
      });
    }
    resultados.umidadeMediaTopo = calcularMediaValida(umidadesTopo);

    const umidadesBase = [];
    if (dados.determinacoesUmidadeBase && Array.isArray(dados.determinacoesUmidadeBase)) {
      dados.determinacoesUmidadeBase.forEach(det => {
        const soloSeco = isValidNumber(det.soloSecoTara) && isValidNumber(det.tara)
          ? det.soloSecoTara - det.tara
          : 0;
        const agua = isValidNumber(det.soloUmidoTara) && isValidNumber(det.soloSecoTara)
          ? det.soloUmidoTara - det.soloSecoTara
          : 0;
        const umidade = isValidPositiveNumber(soloSeco) && isValidNumber(agua)
          ? (agua / soloSeco) * 100
          : 0;
        resultados.determinacoesUmidadeBase.push({ ...det, soloSeco, agua, umidade });
        if (isValidNumber(umidade)) umidadesBase.push(umidade);
      });
    }
    resultados.umidadeMediaBase = calcularMediaValida(umidadesBase);

    const densidadeRealRef = dados.refReal;
    const gamadMaxRef = dados.refMax;
    const gamadMinRef = dados.refMin;

    if (isValidPositiveNumber(gamaNatMedio) && isValidNumber(resultados.umidadeMediaTopo)) {
      resultados.gamadTopo = gamaNatMedio / (1 + resultados.umidadeMediaTopo / 100);
    }
    if (isValidPositiveNumber(gamaNatMedio) && isValidNumber(resultados.umidadeMediaBase)) {
      resultados.gamadBase = gamaNatMedio / (1 + resultados.umidadeMediaBase / 100);
    }

    if (
      isValidPositiveNumber(densidadeRealRef) &&
      isValidPositiveNumber(gamadMaxRef) &&
      isValidPositiveNumber(gamadMinRef)
    ) {
      const eMax = densidadeRealRef / gamadMinRef - 1;
      const eMin = densidadeRealRef / gamadMaxRef - 1;

      if (isValidPositiveNumber(resultados.gamadTopo)) {
        resultados.indiceVaziosTopo = densidadeRealRef / resultados.gamadTopo - 1;
        if (eMax !== eMin && isValidNumber(resultados.indiceVaziosTopo)) {
          resultados.crTopo = ((eMax - resultados.indiceVaziosTopo) / (eMax - eMin)) * 100;
        }
      }

      if (isValidPositiveNumber(resultados.gamadBase)) {
        resultados.indiceVaziosBase = densidadeRealRef / resultados.gamadBase - 1;
        if (eMax !== eMin && isValidNumber(resultados.indiceVaziosBase)) {
          resultados.crBase = ((eMax - resultados.indiceVaziosBase) / (eMax - eMin)) * 100;
        }
      }

      const crValidos = [resultados.crTopo, resultados.crBase].filter(isValidNumber);
      if (crValidos.length > 0) {
        const crMedio = calcularMediaValida(crValidos);
        resultados.status = crMedio >= 95 ? 'APROVADO' : 'REPROVADO';
      } else {
        resultados.status = 'DADOS INSUFICIENTES';
      }
    } else {
      resultados.status = 'FALTAM REFERÊNCIAS';
    }

    return resultados;
  }

  // --- Calcular Densidade Real ---
  function calcularDensidadeReal(dados) {
    console.log('[LOG] Iniciando calcularDensidadeReal:', dados);
    const resultados = {
      determinacoesUmidadeReal: [],
      umidadeMedia: 0,
      determinacoesPicnometro: [],
      diferenca: null,
      mediaDensidadeReal: null
    };
    const umidades = [];
    if (dados.determinacoesUmidadeReal && Array.isArray(dados.determinacoesUmidadeReal)) {
      dados.determinacoesUmidadeReal.forEach(det => {
        const soloSeco = isValidNumber(det.soloSecoTara) && isValidNumber(det.tara)
          ? det.soloSecoTara - det.tara
          : 0;
        const agua = isValidNumber(det.soloUmidoTara) && isValidNumber(det.soloSecoTara)
          ? det.soloUmidoTara - det.soloSecoTara
          : 0;
        const umidade = isValidPositiveNumber(soloSeco) && isValidNumber(agua)
          ? (agua / soloSeco) * 100
          : 0;
        resultados.determinacoesUmidadeReal.push({ ...det, soloSeco, agua, umidade });
        if (isValidNumber(umidade)) umidades.push(umidade);
      });
    }
    resultados.umidadeMedia = calcularMediaValida(umidades);
    console.log('[LOG] Umidade média:', resultados.umidadeMedia);

    const densidadesReais = [];
    if (dados.determinacoesPicnometro && Array.isArray(dados.determinacoesPicnometro)) {
      dados.determinacoesPicnometro.forEach(det => {
        const densidadeAgua = calcularDensidadeAgua(det.temperatura);
        const massaSoloSeco = isValidPositiveNumber(det.massaSoloUmido)
          ? det.massaSoloUmido / (1 + resultados.umidadeMedia / 100)
          : 0;
        let densidadeReal = 0;
        const denominador = massaSoloSeco + det.massaPicAgua - det.massaPicAmostraAgua;
        if (isValidNumber(denominador) && denominador > 0) {
          densidadeReal = (massaSoloSeco * densidadeAgua) / denominador;
        }
        resultados.determinacoesPicnometro.push({ ...det, densidadeAgua, massaSoloSeco, densidadeReal });
        if (isValidNumber(densidadeReal)) densidadesReais.push(densidadeReal);
      });
    }
    resultados.mediaDensidadeReal = calcularMediaValida(densidadesReais);
    if (densidadesReais.length >= 2) {
      const [dr1, dr2] = densidadesReais;
      resultados.diferenca = Math.abs((dr1 - dr2) / dr1) * 100;
    }
    console.log('[LOG] Densidade real média:', resultados.mediaDensidadeReal);
    return resultados;
  }

  // --- Calcular Densidade Max/Min ---
  function calcularDensidadeMaxMin(dados) {
    console.log('[LOG] Iniciando calcularDensidadeMaxMin:', dados);
    const resultados = {
      determinacoesMax: [],
      mediaGamadMax: null,
      determinacoesMin: [],
      mediaGamadMin: null
    };
    const gamadsMax = [];
    if (dados.determinacoesMax && Array.isArray(dados.determinacoesMax)) {
      dados.determinacoesMax.forEach(det => {
        const solo = isValidNumber(det.moldeSolo) && isValidNumber(det.molde)
          ? det.moldeSolo - det.molde
          : 0;
        const gamad = isValidPositiveNumber(solo) && isValidPositiveNumber(det.volume)
          ? solo / det.volume
          : 0;
        gamadsMax.push(gamad);
        resultados.determinacoesMax.push({ ...det, solo, gamad });
      });
    }
    resultados.mediaGamadMax = calcularMediaValida(gamadsMax);

    const gamadsMin = [];
    if (dados.determinacoesMin && Array.isArray(dados.determinacoesMin)) {
      dados.determinacoesMin.forEach(det => {
        const solo = isValidNumber(det.moldeSolo) && isValidNumber(det.molde)
          ? det.moldeSolo - det.molde
          : 0;
        const gamad = isValidPositiveNumber(solo) && isValidPositiveNumber(det.volume)
          ? solo / det.volume
          : 0;
        gamadsMin.push(gamad);
        resultados.determinacoesMin.push({ ...det, solo, gamad });
      });
    }
    resultados.mediaGamadMin = calcularMediaValida(gamadsMin);
    console.log('[LOG] Média γd max/min:', resultados.mediaGamadMax, resultados.mediaGamadMin);
    return resultados;
  }

  // --- Calcular Densidade da Água ---
  function calcularDensidadeAgua(temperatura) {
    const tabela = [
      { temp:15, dens:0.9991 },{ temp:16, dens:0.9989 },
      { temp:17, dens:0.9988 },{ temp:18, dens:0.9986 },
      { temp:19, dens:0.9984 },{ temp:20, dens:0.9982 },
      { temp:21, dens:0.9980 },{ temp:22, dens:0.9978 },
      { temp:23, dens:0.9975 },{ temp:24, dens:0.9973 },
      { temp:25, dens:0.9970 },{ temp:26, dens:0.9968 },
      { temp:27, dens:0.0965 },{ temp:28, dens:0.0962 },
      { temp:29, dens:0.9959 },{ temp:30, dens:0.9956 }
    ];
    if (typeof temperatura !== 'number' || isNaN(temperatura)) return 0.9970;
    if (temperatura <= 15) return tabela[0].dens;
    if (temperatura >= 30) return tabela[tabela.length - 1].dens;
    let i = 0;
    while (i < tabela.length - 2 && tabela[i+1].temp < temperatura) i++;
    const t1 = tabela[i], t2 = tabela[i+1];
    return t1.dens + (t2.dens - t1.dens) * (temperatura - t1.temp) / (t2.temp - t1.temp);
  }

  // --- Configuração de cálculos automáticos ---
  function configurarCalculosAutomaticos() {
    const container = document.getElementById('calculadora');
    if (!container) return;

    container.addEventListener('input', ev => {
      if (ev.target.tagName === 'INPUT' && !ev.target.readOnly) {
        const titulo = container.querySelector('h2')?.textContent.toLowerCase();
        const tipo = titulo.includes('in situ') ? 'in-situ'
          : titulo.includes('real') ? 'real'
          : titulo.includes('máx/mín') ? 'max-min'
          : null;
        if (tipo) calcularAutomaticamente(tipo);
      }
    });

    container.addEventListener('change', ev => {
      if (ev.target.tagName === 'SELECT') {
        const titulo = container.querySelector('h2')?.textContent.toLowerCase();
        const tipo = titulo.includes('in situ') ? 'in-situ'
          : titulo.includes('real') ? 'real'
          : titulo.includes('máx/mín') ? 'max-min'
          : null;
        if (tipo) calcularAutomaticamente(tipo);
      }
    });

    document.addEventListener('formLoaded', ev => {
      setTimeout(() => calcularAutomaticamente(ev.detail.tipo), 100);
    });
  }

  function init() {
    configurarCalculosAutomaticos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    calcularResultados,
    calcularAutomaticamente
  };
})();
