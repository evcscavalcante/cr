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
      compacidadeRelativa: null,
      status: 'AGUARDANDO DADOS'
    };
    let somaGamaNat = 0;
    let countGamaNat = 0;
    if (dados.determinacoesInSitu && Array.isArray(dados.determinacoesInSitu)) {
      dados.determinacoesInSitu.forEach(det => {
        const solo = isValidNumber(det.moldeSolo) && isValidNumber(det.molde)
          ? det.moldeSolo - det.molde : 0;
        const gamaNat = isValidPositiveNumber(solo) && isValidPositiveNumber(det.volume)
          ? solo / det.volume : 0;
        resultados.determinacoesInSitu.push({ ...det, solo, gamaNat });
        if (isValidPositiveNumber(gamaNat)) {
          somaGamaNat += gamaNat;
          countGamaNat++;
        }
      });
    }
    const gamaNatMedio = countGamaNat > 0 ? somaGamaNat / countGamaNat : 0;

    const umidadesTopo = [];
    if (dados.determinacoesUmidadeTopo && Array.isArray(dados.determinacoesUmidadeTopo)) {
      dados.determinacoesUmidadeTopo.forEach(det => {
        const soloSeco = isValidNumber(det.soloSecoTara) && isValidNumber(det.tara)
          ? det.soloSecoTara - det.tara : 0;
        const agua = isValidNumber(det.soloUmidoTara) && isValidNumber(det.soloSecoTara)
          ? det.soloUmidoTara - det.soloSecoTara : 0;
        const umidade = isValidPositiveNumber(soloSeco) && isValidNumber(agua)
          ? (agua / soloSeco) * 100 : 0;
        resultados.determinacoesUmidadeTopo.push({ ...det, soloSeco, agua, umidade });
        if (isValidNumber(umidade)) umidadesTopo.push(umidade);
      });
    }
    resultados.umidadeMediaTopo = calcularMediaValida(umidadesTopo);

    const umidadesBase = [];
    if (dados.determinacoesUmidadeBase && Array.isArray(dados.determinacoesUmidadeBase)) {
      dados.determinacoesUmidadeBase.forEach(det => {
        const soloSeco = isValidNumber(det.soloSecoTara) && isValidNumber(det.tara)
          ? det.soloSecoTara - det.tara : 0;
        const agua = isValidNumber(det.soloUmidoTara) && isValidNumber(det.soloSecoTara)
          ? det.soloUmidoTara - det.soloSecoTara : 0;
        const umidade = isValidPositiveNumber(soloSeco) && isValidNumber(agua)
          ? (agua / soloSeco) * 100 : 0;
        resultados.determinacoesUmidadeBase.push({ ...det, soloSeco, agua, umidade });
        if (isValidNumber(umidade)) umidadesBase.push(umidade);
      });
    }
    resultados.umidadeMediaBase = calcularMediaValida(umidadesBase);

    // Referências de densidade real, max e min
    const densidadeRealRef = dados.refReal;
    const gamadMaxRef = dados.refMax;
    const gamadMinRef = dados.refMin;

    // Cálculo da densidade úmida (gama_d)
    if (isValidPositiveNumber(gamaNatMedio) && isValidNumber(resultados.umidadeMediaTopo)) {
      resultados.gamadTopo = gamaNatMedio / (1 + resultados.umidadeMediaTopo / 100);
    }
    if (isValidPositiveNumber(gamaNatMedio) && isValidNumber(resultados.umidadeMediaBase)) {
      resultados.gamadBase = gamaNatMedio / (1 + resultados.umidadeMediaBase / 100);
    }

    // Cálculo do índice de vazios e compacidade relativa
    if (isValidPositiveNumber(densidadeRealRef) && isValidPositiveNumber(gamadMaxRef) && isValidPositiveNumber(gamadMinRef)
        && isValidNumber(resultados.gamadTopo) && isValidNumber(resultados.gamadBase)) {
      const eMax = densidadeRealRef / gamadMinRef - 1;
      const eMin = densidadeRealRef / gamadMaxRef - 1;
      resultados.indiceVaziosTopo = densidadeRealRef / resultados.gamadTopo - 1;
      resultados.indiceVaziosBase = densidadeRealRef / resultados.gamadBase - 1;
      resultados.compacidadeRelativa = {
        topo: eMax !== eMin ? ((eMax - resultados.indiceVaziosTopo) / (eMax - eMin)) * 100 : null,
        base: eMax !== eMin ? ((eMax - resultados.indiceVaziosBase) / (eMax - eMin)) * 100 : null
      };
      const crValidos = [resultados.compacidadeRelativa.topo, resultados.compacidadeRelativa.base].filter(isValidNumber);
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
    const resultados = { determinacoesUmidadeReal: [], umidadeMedia: 0, determinacoesPicnometro: [], mediaDensidadeReal: null, diferenca: null };
    const umidades = [];
    if (dados.determinacoesUmidadeReal && Array.isArray(dados.determinacoesUmidadeReal)) {
      dados.determinacoesUmidadeReal.forEach(det => {
        const soloSeco = isValidNumber(det.soloSecoTara) && isValidNumber(det.tara) ? det.soloSecoTara - det.tara : 0;
        const agua = isValidNumber(det.soloUmidoTara) && isValidNumber(det.soloSecoTara) ? det.soloUmidoTara - det.soloSecoTara : 0;
        const umidade = isValidPositiveNumber(soloSeco) && isValidNumber(agua) ? (agua / soloSeco) * 100 : 0;
        resultados.determinacoesUmidadeReal.push({ ...det, soloSeco, agua, umidade });
        if (isValidNumber(umidade)) umidades.push(umidade);
      });
    }
    resultados.umidadeMedia = calcularMediaValida(umidades);
    const densidadesReais = [];
    if (dados.determinacoesPicnometro && Array.isArray(dados.determinacoesPicnometro)) {
      dados.determinacoesPicnometro.forEach(det => {
        const densidadeAgua = calcularDensidadeAgua(det.temperatura);
        const massaSoloSeco = isValidPositiveNumber(det.massaSoloUmido) ? det.massaSoloUmido / (1 + resultados.umidadeMedia / 100) : 0;
        const denom = massaSoloSeco + det.massaPicAgua - det.massaPicAmostraAgua;
        let dr = 0;
        if (isValidNumber(denom) && denom > 0) dr = (massaSoloSeco * densidadeAgua) / denom;
        resultados.determinacoesPicnometro.push({ ...det, densidadeAgua, massaSoloSeco, densidadeReal: dr });
        if (isValidNumber(dr)) densidadesReais.push(dr);
      });
    }
    resultados.mediaDensidadeReal = calcularMediaValida(densidadesReais);
    if (densidadesReais.length >= 2) {
      const [a, b] = densidadesReais;
      resultados.diferenca = Math.abs((a - b) / a) * 100;
    }
    return resultados;
  }

  // --- Calcular Densidade Máx/Min ---
  function calcularDensidadeMaxMin(dados) {
    const resultados = { determinacoesMax: [], determinacoesMin: [], mediaGamadMax: null, mediaGamadMin: null };
    const gamadsMax = [];
    if (dados.determinacoesMax && Array.isArray(dados.determinacoesMax)) {
      dados.determinacoesMax.forEach(det => {
        const solo = isValidNumber(det.moldeSolo) && isValidNumber(det.molde) ? det.moldeSolo - det.molde : 0;
        const gamad = isValidPositiveNumber(solo) && isValidPositiveNumber(det.volume) ? solo / det.volume : 0;
        const gamas = isValidPositiveNumber(gamad) && isValidNumber(det.w) ? gamad * (1 + det.w/100) : gamad;
        resultados.determinacoesMax.push({ ...det, solo, gamad, gamas });
        if (isValidNumber(gamad)) gamadsMax.push(gamad);
      });
    }
    resultados.mediaGamadMax = calcularMediaValida(gamadsMax);
    const gamadsMin = [];
    if (dados.determinacoesMin && Array.isArray(dados.determinacoesMin)) {
      dados.determinacoesMin.forEach(det => {
        const solo = isValidNumber(det.moldeSolo)&&isValidNumber(det.molde)?det.moldeSolo-det.molde:0;
        const gamad = isValidPositiveNumber(solo)&&isValidPositiveNumber(det.volume)?solo/det.volume:0;
        const gamas = isValidPositiveNumber(gamad)&&isValidNumber(det.w)?gamad*(1+det.w/100):gamad;
        resultados.determinacoesMin.push({ ...det, solo, gamad, gamas });
        if (isValidNumber(gamad)) gamadsMin.push(gamad);
      });
    }
    resultados.mediaGamadMin = calcularMediaValida(gamadsMin);
    return resultados;
  }

  /**
   * Centraliza a chamada dos cálculos conforme tipo
   */
  function calcularResultados(tipo, dados) {
    switch (tipo) {
      case 'in-situ': return calcularDensidadeInSitu(dados);
      case 'real':    return calcularDensidadeReal(dados);
      case 'max-min': return calcularDensidadeMaxMin(dados);
      default:
        console.error(`Tipo desconhecido: ${tipo}`);
        return null;
    }
  }

  /**
   * Dispara o cálculo automático para o tipo de ensaio indicado
   */
  function calcularAutomaticamente(tipo) {
    const fi = window.calculadora.formIntegration;
    if (!fi || typeof fi.obterDadosFormulario !== 'function') {
      console.error("formIntegration não disponível para cálculo automático.");
      return;
    }
    const dados = fi.obterDadosFormulario(tipo);
    if (!dados) {
      fi.setUltimosResultados?.(tipo, null);
      fi.preencherResultados?.(tipo, null);
      return;
    }
    const resultados = calcularResultados(tipo, dados);
    fi.setUltimosResultados?.(tipo, resultados);
    fi.preencherResultados?.(tipo, resultados);
  }

  // --- Densidade da Água ---
  function calcularDensidadeAgua(temperatura) {
    const tabela = [
      { temp: 15, dens: 0.9991 }, { temp: 16, dens: 0.9989 },
      { temp: 17, dens: 0.9988 }, { temp: 18, dens: 0.9986 },
      { temp: 19, dens: 0.9984 }, { temp: 20, dens: 0.9982 },
      { temp: 21, dens: 0.9980 }, { temp: 22, dens: 0.9978 },
      { temp: 23, dens: 0.9975 }, { temp: 24, dens: 0.9973 },
      { temp: 25, dens: 0.9970 }, { temp: 26, dens: 0.9968 },
      { temp: 27, dens: 0.9965 }, { temp: 28, dens: 0.9962 },
      { temp: 29, dens: 0.9959 }, { temp: 30, dens: 0.9956 }
    ];
    if (typeof temperatura !== 'number' || isNaN(temperatura)) return 0.9970;
    if (temperatura <= 15) return tabela[0].dens;
    if (temperatura >= 30) return tabela[tabela.length - 1].dens;
    let i = 0;
    while (i < tabela.length - 1 && tabela[i+1].temp < temperatura) i++;
    const t1 = tabela[i], t2 = tabela[i+1];
    return t1.dens + (t2.dens - t1.dens) * (temperatura - t1.temp) / (t2.temp - t1.temp);
  }

  // configuração de listeners para inputs/selects e evento formLoaded
  function configurarCalculosAutomaticos() {
    const container = document.getElementById('calculadora');
    if (!container) return;
    container.addEventListener('input', ev => {
      if (ev.target.tagName === 'INPUT' && !ev.target.readOnly) {
        const texto = container.querySelector('h2')?.textContent.toLowerCase();
        const tipo = texto.includes('in situ')?'in-situ':texto.includes('real')?'real':texto.includes('máx/mín')?'max-min':null;
        if (tipo) calcularAutomaticamente(tipo);
      }
    });
    container.addEventListener('change', ev => {
      if (ev.target.tagName === 'SELECT') {
        const texto = container.querySelector('h2')?.textContent.toLowerCase();
        const tipo = texto.includes('in situ')?'in-situ':texto.includes('real')?'real':texto.includes('máx/mín')?'max-min':null;
        if (tipo) calcularAutomaticamente(tipo);
      }
    });
    document.addEventListener('formLoaded', ev => setTimeout(() => calcularAutomaticamente(ev.detail.tipo), 100));
  }

  function init() {
    configurarCalculosAutomaticos();
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { calcularResultados, calcularAutomaticamente };
})();

// Alias para compatibilidade
window.calculadora.calcularAutomaticamente = window.calculadora.calculos.calcularAutomaticamente;
