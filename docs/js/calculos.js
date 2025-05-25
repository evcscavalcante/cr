// Módulo de cálculos para a Calculadora de Compacidade
// Implementa os cálculos para os diferentes tipos de ensaio

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

  // --- Calcular Densidade In Situ (Sem alterações nesta função) ---
  function calcularDensidadeInSitu(dados) {
    // ... (código inalterado) ...
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

    // --- Cálculos Densidade In Situ ---
    let gamaNatTotal = 0;
    let countGamaNat = 0;
    if (dados.determinacoesInSitu && Array.isArray(dados.determinacoesInSitu)) {
        dados.determinacoesInSitu.forEach(det => {
            const solo = isValidNumber(det.moldeSolo) && isValidNumber(det.molde) ? det.moldeSolo - det.molde : 0;
            const gamaNat = isValidPositiveNumber(solo) && isValidPositiveNumber(det.volume) ? solo / det.volume : 0;
            resultados.determinacoesInSitu.push({ ...det, solo, gamaNat });
            if (isValidPositiveNumber(gamaNat)) {
                gamaNatTotal += gamaNat;
                countGamaNat++;
            }
        });
    }
    const gamaNatMedio = countGamaNat > 0 ? gamaNatTotal / countGamaNat : 0;

    // --- Cálculos Umidade Topo ---
    const umidadesTopo = [];
    if (dados.determinacoesUmidadeTopo && Array.isArray(dados.determinacoesUmidadeTopo)) {
        dados.determinacoesUmidadeTopo.forEach(det => {
            const soloSeco = isValidNumber(det.soloSecoTara) && isValidNumber(det.tara) ? det.soloSecoTara - det.tara : 0;
            const agua = isValidNumber(det.soloUmidoTara) && isValidNumber(det.soloSecoTara) ? det.soloUmidoTara - det.soloSecoTara : 0;
            const umidade = isValidPositiveNumber(soloSeco) && isValidNumber(agua) ? (agua / soloSeco) * 100 : 0;
            resultados.determinacoesUmidadeTopo.push({ ...det, soloSeco, agua, umidade });
            if (isValidNumber(umidade)) umidadesTopo.push(umidade); // Usar isValidNumber para média
        });
    }
    resultados.umidadeMediaTopo = calcularMediaValida(umidadesTopo); // Média ainda ignora zero

    // --- Cálculos Umidade Base ---
    const umidadesBase = [];
    if (dados.determinacoesUmidadeBase && Array.isArray(dados.determinacoesUmidadeBase)) {
        dados.determinacoesUmidadeBase.forEach(det => {
            const soloSeco = isValidNumber(det.soloSecoTara) && isValidNumber(det.tara) ? det.soloSecoTara - det.tara : 0;
            const agua = isValidNumber(det.soloUmidoTara) && isValidNumber(det.soloSecoTara) ? det.soloUmidoTara - det.soloSecoTara : 0;
            const umidade = isValidPositiveNumber(soloSeco) && isValidNumber(agua) ? (agua / soloSeco) * 100 : 0;
            resultados.determinacoesUmidadeBase.push({ ...det, soloSeco, agua, umidade });
            if (isValidNumber(umidade)) umidadesBase.push(umidade); // Usar isValidNumber para média
        });
    }
    resultados.umidadeMediaBase = calcularMediaValida(umidadesBase); // Média ainda ignora zero

    // --- Cálculos Finais (usando médias e referências) ---
    const densidadeRealRef = dados.densidadeRealRef;
    const gamadMaxRef = dados.gamadMaxRef;
    const gamadMinRef = dados.gamadMinRef;

    if (isValidPositiveNumber(gamaNatMedio) && isValidNumber(resultados.umidadeMediaTopo)) {
        resultados.gamadTopo = gamaNatMedio / (1 + resultados.umidadeMediaTopo / 100);
    }
    if (isValidPositiveNumber(gamaNatMedio) && isValidNumber(resultados.umidadeMediaBase)) {
        resultados.gamadBase = gamaNatMedio / (1 + resultados.umidadeMediaBase / 100);
    }

    // Cálculo do Índice de Vazios e CR (Compacidade Relativa)
    if (isValidPositiveNumber(densidadeRealRef) && isValidPositiveNumber(gamadMaxRef) && isValidPositiveNumber(gamadMinRef)) {
      const eMax = (densidadeRealRef / gamadMinRef) - 1;
      const eMin = (densidadeRealRef / gamadMaxRef) - 1;

      if (isValidPositiveNumber(resultados.gamadTopo)) {
        resultados.indiceVaziosTopo = (densidadeRealRef / resultados.gamadTopo) - 1;
        if (eMax !== eMin && isValidNumber(resultados.indiceVaziosTopo)) { // Permitir IV >= 0
             resultados.crTopo = ((eMax - resultados.indiceVaziosTopo) / (eMax - eMin)) * 100;
        }
      }

      if (isValidPositiveNumber(resultados.gamadBase)) {
        resultados.indiceVaziosBase = (densidadeRealRef / resultados.gamadBase) - 1;
         if (eMax !== eMin && isValidNumber(resultados.indiceVaziosBase)) { // Permitir IV >= 0
            resultados.crBase = ((eMax - resultados.indiceVaziosBase) / (eMax - eMin)) * 100;
         }
      }

      // Determinar Status
      const crValidos = [resultados.crTopo, resultados.crBase].filter(isValidNumber);
      if (crValidos.length > 0) {
          const crMedio = calcularMediaValida(crValidos);
          resultados.status = crMedio >= 95 ? 'APROVADO' : 'REPROVADO'; // Exemplo de critério
      } else {
          resultados.status = 'DADOS INSUFICIENTES';
      }
    } else {
        resultados.status = 'FALTAM REFERÊNCIAS';
    }

    return resultados;
  }

  // --- Calcular Densidade Real (COM LOGS DETALHADOS) ---
  function calcularDensidadeReal(dados) {
    console.log('[LOG][calcularDensidadeReal] Iniciando cálculo. Dados recebidos:', JSON.stringify(dados));
    const resultados = {
        determinacoesUmidadeReal: [],
        umidadeMedia: 0,
        determinacoesPicnometro: [],
        diferenca: null,
        mediaDensidadeReal: null
    };

    // Cálculos Umidade
    const umidades = [];
    if (dados.determinacoesUmidadeReal && Array.isArray(dados.determinacoesUmidadeReal)) {
        dados.determinacoesUmidadeReal.forEach((det, index) => {
            console.log(`[LOG][calcularDensidadeReal] Umidade Det ${index + 1}:`, JSON.stringify(det));
            const soloSeco = isValidNumber(det.soloSecoTara) && isValidNumber(det.tara) ? det.soloSecoTara - det.tara : 0;
            const agua = isValidNumber(det.soloUmidoTara) && isValidNumber(det.soloSecoTara) ? det.soloUmidoTara - det.soloSecoTara : 0;
            const umidade = isValidPositiveNumber(soloSeco) && isValidNumber(agua) ? (agua / soloSeco) * 100 : 0;
            console.log(`[LOG][calcularDensidadeReal] Umidade Det ${index + 1} - Calculado: soloSeco=${soloSeco}, agua=${agua}, umidade=${umidade}`);
            resultados.determinacoesUmidadeReal.push({ ...det, soloSeco, agua, umidade });
            if (isValidNumber(umidade)) umidades.push(umidade);
        });
    }
    resultados.umidadeMedia = calcularMediaValida(umidades);
    console.log(`[LOG][calcularDensidadeReal] Umidade Média Calculada: ${resultados.umidadeMedia}`);

    // Cálculos Picnômetro
    const densidadesReais = [];
    if (dados.determinacoesPicnometro && Array.isArray(dados.determinacoesPicnometro)) {
        dados.determinacoesPicnometro.forEach((det, index) => {
            console.log(`[LOG][calcularDensidadeReal] Picnômetro Det ${index + 1}:`, JSON.stringify(det));
            const densidadeAgua = calcularDensidadeAgua(det.temperatura);
            console.log(`[LOG][calcularDensidadeReal] Picnômetro Det ${index + 1} - Densidade Água (T=${det.temperatura}): ${densidadeAgua}`);
            const massaSoloSeco = isValidPositiveNumber(det.massaSoloUmido) && isValidNumber(resultados.umidadeMedia)
                                  ? det.massaSoloUmido / (1 + resultados.umidadeMedia / 100)
                                  : 0;
            console.log(`[LOG][calcularDensidadeReal] Picnômetro Det ${index + 1} - Massa Solo Seco Calculada: ${massaSoloSeco} (massaSoloUmido=${det.massaSoloUmido}, umidadeMedia=${resultados.umidadeMedia})`);
            let densidadeReal = 0;
            if (isValidNumber(massaSoloSeco) && isValidPositiveNumber(densidadeAgua) && isValidNumber(det.massaPicAgua) && isValidNumber(det.massaPicAmostraAgua)) {
                const denominador = massaSoloSeco + det.massaPicAgua - det.massaPicAmostraAgua;
                console.log(`[LOG][calcularDensidadeReal] Picnômetro Det ${index + 1} - Denominador Dens. Real: ${denominador} (massaSoloSeco=${massaSoloSeco}, massaPicAgua=${det.massaPicAgua}, massaPicAmostraAgua=${det.massaPicAmostraAgua})`);
                if (isValidPositiveNumber(denominador)) {
                    densidadeReal = (massaSoloSeco * densidadeAgua) / denominador;
                }
            }
            console.log(`[LOG][calcularDensidadeReal] Picnômetro Det ${index + 1} - Densidade Real Calculada: ${densidadeReal}`);
            resultados.determinacoesPicnometro.push({ ...det, densidadeAgua, massaSoloSeco, densidadeReal });
            if (isValidNumber(densidadeReal)) densidadesReais.push(densidadeReal);
        });
    }

    // Resultados Finais
    resultados.mediaDensidadeReal = calcularMediaValida(densidadesReais);
    console.log(`[LOG][calcularDensidadeReal] Média Densidade Real Calculada: ${resultados.mediaDensidadeReal}`);
    if (densidadesReais.length >= 2) {
        const dr1 = densidadesReais[0];
        const dr2 = densidadesReais[1];
        if (isValidPositiveNumber(dr1)) {
             resultados.diferenca = Math.abs((dr1 - dr2) / dr1) * 100;
        }
    }
    console.log(`[LOG][calcularDensidadeReal] Diferença Calculada: ${resultados.diferenca}`);
    console.log('[LOG][calcularDensidadeReal] Cálculo finalizado. Resultados:', JSON.stringify(resultados));
    return resultados;
  }

  // --- Calcular Densidade Max/Min (COM LOGS DETALHADOS) ---
  function calcularDensidadeMaxMin(dados) {
    console.log('[LOG][calcularDensidadeMaxMin] Iniciando cálculo. Dados recebidos:', JSON.stringify(dados));
     const resultados = {
        determinacoesMax: [],
        mediaGamadMax: null,
        determinacoesMin: [],
        mediaGamadMin: null
    };

    // Densidade Máxima
    const gamadsMax = [];
    if (dados.determinacoesMax && Array.isArray(dados.determinacoesMax)) {
        dados.determinacoesMax.forEach((det, index) => {
            console.log(`[LOG][calcularDensidadeMaxMin] Max Det ${index + 1}:`, JSON.stringify(det));
            const solo = isValidNumber(det.moldeSolo) && isValidNumber(det.molde) ? det.moldeSolo - det.molde : 0;
            const gamad = isValidPositiveNumber(solo) && isValidPositiveNumber(det.volume) ? solo / det.volume : 0;
            const gamas = isValidPositiveNumber(gamad) && isValidNumber(det.w)
                          ? gamad * (1 + det.w / 100)
                          : 0;
            console.log(`[LOG][calcularDensidadeMaxMin] Max Det ${index + 1} - Calculado: solo=${solo}, gamad=${gamad}, gamas=${gamas}`);
            resultados.determinacoesMax.push({ ...det, solo, gamad, gamas });
            if (isValidNumber(gamad)) gamadsMax.push(gamad);
        });
    }
    resultados.mediaGamadMax = calcularMediaValida(gamadsMax);
    console.log(`[LOG][calcularDensidadeMaxMin] Média Gama_d Máx Calculada: ${resultados.mediaGamadMax}`);

    // Densidade Mínima
    const gamadsMin = [];
    if (dados.determinacoesMin && Array.isArray(dados.determinacoesMin)) {
        dados.determinacoesMin.forEach((det, index) => {
            console.log(`[LOG][calcularDensidadeMaxMin] Min Det ${index + 1}:`, JSON.stringify(det));
            const solo = isValidNumber(det.moldeSolo) && isValidNumber(det.molde) ? det.moldeSolo - det.molde : 0;
            const gamad = isValidPositiveNumber(solo) && isValidPositiveNumber(det.volume) ? solo / det.volume : 0;
            const gamas = isValidPositiveNumber(gamad) && isValidNumber(det.w)
                          ? gamad * (1 + det.w / 100)
                          : 0;
            console.log(`[LOG][calcularDensidadeMaxMin] Min Det ${index + 1} - Calculado: solo=${solo}, gamad=${gamad}, gamas=${gamas}`);
            resultados.determinacoesMin.push({ ...det, solo, gamad, gamas });
            if (isValidNumber(gamad)) gamadsMin.push(gamad);
        });
    }
    resultados.mediaGamadMin = calcularMediaValida(gamadsMin);
    console.log(`[LOG][calcularDensidadeMaxMin] Média Gama_d Mín Calculada: ${resultados.mediaGamadMin}`);
    console.log('[LOG][calcularDensidadeMaxMin] Cálculo finalizado. Resultados:', JSON.stringify(resultados));
    return resultados;
  }

  // --- Função calcularDensidadeAgua permanece a mesma ---
   function calcularDensidadeAgua(temperatura) {
    // ... (código inalterado) ...
    if (typeof temperatura !== 'number' || isNaN(temperatura)) return 0.9970; // Default a 25°C se inválido
    const tabela = [
      { temp:15, dens:0.9991 },{ temp:16, dens:0.9989 },
      { temp:17, dens:0.9988 },{ temp:18, dens:0.9986 },
      { temp:19, dens:0.9984 },{ temp:20, dens:0.9982 },
      { temp:21, dens:0.9980 },{ temp:22, dens:0.9978 },
      { temp:23, dens:0.9975 },{ temp:24, dens:0.9973 },
      { temp:25, dens:0.9970 },{ temp:26, dens:0.9968 },
      { temp:27, dens:0.9965 },{ temp:28, dens:0.9962 },
      { temp:29, dens:0.9959 },{ temp:30, dens:0.9956 }
    ];
    if (temperatura<=15) return tabela[0].dens;
    if (temperatura>=30) return tabela[tabela.length - 1].dens;
    let i=0;
    while (i < tabela.length - 2 && tabela[i+1].temp < temperatura) i++;
    const t1=tabela[i], t2=tabela[i+1];
    // Interpolação linear
    return t1.dens + (t2.dens - t1.dens)*(temperatura-t1.temp)/(t2.temp-t1.temp);
  }

  // --- Funções de configuração e cálculo automático ---
  function configurarCalculosAutomaticos() {
    // ... (código inalterado) ...
    const calculadoraContainer = document.getElementById('calculadora');
    if (!calculadoraContainer) return;

    calculadoraContainer.addEventListener('input', ev => {
        if (ev.target.tagName === 'INPUT' && !ev.target.readOnly) {
            const tipo = document.querySelector('#calculadora > div > h2').textContent.toLowerCase().includes('in situ') ? 'in-situ' :
                         document.querySelector('#calculadora > div > h2').textContent.toLowerCase().includes('real') ? 'real' :
                         document.querySelector('#calculadora > div > h2').textContent.toLowerCase().includes('máx/mín') ? 'max-min' : null;
            if (tipo) {
                calcularAutomaticamente(tipo);
            }
        }
    });

     calculadoraContainer.addEventListener('change', ev => {
        if (ev.target.tagName === 'SELECT') {
             const tipo = document.querySelector('#calculadora > div > h2').textContent.toLowerCase().includes('in situ') ? 'in-situ' :
                         document.querySelector('#calculadora > div > h2').textContent.toLowerCase().includes('real') ? 'real' :
                         document.querySelector('#calculadora > div > h2').textContent.toLowerCase().includes('máx/mín') ? 'max-min' : null;
            if (tipo) {
                calcularAutomaticamente(tipo);
            }
        }
    });

    // Calcular ao carregar formulário (evento disparado por form-integration)
    document.addEventListener('formLoaded', ev => {
        const tipo = ev.detail.tipo;
        // Calcular após um pequeno delay para garantir que tudo esteja pronto
        setTimeout(() => calcularAutomaticamente(tipo), 100);
    });
  }

  // Função que centraliza a chamada aos cálculos específicos
  function calcularResultados(tipo, dados) {
      if (!dados) return null;
      let resultados = null;
      try {
          switch (tipo) {
              case 'in-situ':
                  resultados = calcularDensidadeInSitu(dados);
                  break;
              case 'real':
                  resultados = calcularDensidadeReal(dados);
                  break;
              case 'max-min':
                  resultados = calcularDensidadeMaxMin(dados);
                  break;
              default:
                  console.error(`Tipo de cálculo desconhecido: ${tipo}`);
          }
      } catch (error) {
          console.error(`Erro ao executar cálculo para ${tipo}:`, error);
          // Retornar null ou um objeto de erro para indicar falha
          return null;
      }
      return resultados;
  }

  // Função chamada pelos eventos ou ao carregar
  function calcularAutomaticamente(tipo) {
    if (!window.calculadora.formIntegration) {
        console.error("Módulo formIntegration não encontrado para cálculo automático.");
        return;
    }
    const dados = window.calculadora.formIntegration.obterDadosFormulario(tipo);
    // Não calcular se obterDadosFormulario retornar null (erro já notificado)
    if (!dados) {
        window.calculadora.formIntegration.setUltimosResultados(tipo, null); // Limpa estado
        window.calculadora.formIntegration.preencherResultados(tipo, null); // Limpa resultados na UI
        return;
    }

    // O bloco try...catch foi movido para dentro de calcularResultados
    const resultados = calcularResultados(tipo, dados);

    // Armazenar e preencher mesmo se resultados for null (indicando erro no cálculo)
    window.calculadora.formIntegration.setUltimosResultados(tipo, resultados);
    window.calculadora.formIntegration.preencherResultados(tipo, resultados);

    // Não precisamos mais do try...catch aqui, pois ele está em calcularResultados
  }

  function init() {
    configurarCalculosAutomaticos();
  }
  // Garante que a inicialização ocorra após o carregamento completo do DOM
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
  } else {
      init(); // Chamar init imediatamente se o DOM já estiver carregado
  }

  // Exportar funções públicas
  return {
      calcularResultados, // Expor a função centralizada
      calcularAutomaticamente // Manter se for chamada externamente
  };
})();

