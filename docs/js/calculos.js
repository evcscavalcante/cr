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

  // --- Calcular Densidade In Situ (ATUALIZADO para arrays) ---
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

    // --- Cálculos Densidade In Situ (Array 'determinacoesInSitu') ---
    let gamaNatTotal = 0;
    let countGamaNat = 0;
    if (dados.determinacoesInSitu && Array.isArray(dados.determinacoesInSitu)) {
        dados.determinacoesInSitu.forEach(det => {
            const solo = isValidPositiveNumber(det.moldeSolo) && isValidPositiveNumber(det.molde) ? det.moldeSolo - det.molde : 0;
            const gamaNat = isValidPositiveNumber(solo) && isValidPositiveNumber(det.volume) ? solo / det.volume : 0;

            resultados.determinacoesInSitu.push({
                // Preservar dados de entrada para preenchimento se necessário
                numeroCilindro: det.numeroCilindro,
                moldeSolo: det.moldeSolo,
                molde: det.molde,
                volume: det.volume,
                // Resultados calculados da determinação
                solo: solo,
                gamaNat: gamaNat
            });

            if (isValidPositiveNumber(gamaNat)) {
                gamaNatTotal += gamaNat;
                countGamaNat++;
            }
        });
    }
    const gamaNatMedio = countGamaNat > 0 ? gamaNatTotal / countGamaNat : 0;

    // --- Cálculos Umidade Topo (Array 'determinacoesUmidadeTopo') ---
    const umidadesTopo = [];
    if (dados.determinacoesUmidadeTopo && Array.isArray(dados.determinacoesUmidadeTopo)) {
        dados.determinacoesUmidadeTopo.forEach(det => {
            const soloSeco = isValidPositiveNumber(det.soloSecoTara) && isValidPositiveNumber(det.tara) ? det.soloSecoTara - det.tara : 0;
            const agua = isValidPositiveNumber(det.soloUmidoTara) && isValidPositiveNumber(det.soloSecoTara) ? det.soloUmidoTara - det.soloSecoTara : 0;
            const umidade = isValidPositiveNumber(soloSeco) && isValidPositiveNumber(agua) ? (agua / soloSeco) * 100 : 0;

            resultados.determinacoesUmidadeTopo.push({
                // Preservar dados de entrada
                capsula: det.capsula,
                soloUmidoTara: det.soloUmidoTara,
                soloSecoTara: det.soloSecoTara,
                tara: det.tara,
                // Resultados calculados
                soloSeco: soloSeco,
                agua: agua,
                umidade: umidade
            });
            if (isValidPositiveNumber(umidade)) umidadesTopo.push(umidade);
        });
    }
    resultados.umidadeMediaTopo = calcularMediaValida(umidadesTopo);

    // --- Cálculos Umidade Base (Array 'determinacoesUmidadeBase') ---
    const umidadesBase = [];
    if (dados.determinacoesUmidadeBase && Array.isArray(dados.determinacoesUmidadeBase)) {
        dados.determinacoesUmidadeBase.forEach(det => {
            const soloSeco = isValidPositiveNumber(det.soloSecoTara) && isValidPositiveNumber(det.tara) ? det.soloSecoTara - det.tara : 0;
            const agua = isValidPositiveNumber(det.soloUmidoTara) && isValidPositiveNumber(det.soloSecoTara) ? det.soloUmidoTara - det.soloSecoTara : 0;
            const umidade = isValidPositiveNumber(soloSeco) && isValidPositiveNumber(agua) ? (agua / soloSeco) * 100 : 0;

            resultados.determinacoesUmidadeBase.push({
                // Preservar dados de entrada
                capsula: det.capsula,
                soloUmidoTara: det.soloUmidoTara,
                soloSecoTara: det.soloSecoTara,
                tara: det.tara,
                // Resultados calculados
                soloSeco: soloSeco,
                agua: agua,
                umidade: umidade
            });
            if (isValidPositiveNumber(umidade)) umidadesBase.push(umidade);
        });
    }
    resultados.umidadeMediaBase = calcularMediaValida(umidadesBase);

    // --- Cálculos Finais (usando médias e referências) ---
    const densidadeRealRef = dados.densidadeRealRef;
    const gamadMaxRef = dados.gamadMaxRef;
    const gamadMinRef = dados.gamadMinRef;

    if (isValidPositiveNumber(gamaNatMedio) && isValidPositiveNumber(resultados.umidadeMediaTopo)) {
        resultados.gamadTopo = gamaNatMedio / (1 + resultados.umidadeMediaTopo / 100);
    }
    if (isValidPositiveNumber(gamaNatMedio) && isValidPositiveNumber(resultados.umidadeMediaBase)) {
        resultados.gamadBase = gamaNatMedio / (1 + resultados.umidadeMediaBase / 100);
    }

    // Cálculo do Índice de Vazios e CR (Compacidade Relativa)
    if (isValidPositiveNumber(densidadeRealRef) && isValidPositiveNumber(gamadMaxRef) && isValidPositiveNumber(gamadMinRef)) {
      const eMax = (densidadeRealRef / gamadMinRef) - 1;
      const eMin = (densidadeRealRef / gamadMaxRef) - 1;

      if (isValidPositiveNumber(resultados.gamadTopo)) {
        resultados.indiceVaziosTopo = (densidadeRealRef / resultados.gamadTopo) - 1;
        if (eMax !== eMin && isValidPositiveNumber(resultados.indiceVaziosTopo)) { // Evitar divisão por zero e IV inválido
             resultados.crTopo = ((eMax - resultados.indiceVaziosTopo) / (eMax - eMin)) * 100;
        }
      }

      if (isValidPositiveNumber(resultados.gamadBase)) {
        resultados.indiceVaziosBase = (densidadeRealRef / resultados.gamadBase) - 1;
         if (eMax !== eMin && isValidPositiveNumber(resultados.indiceVaziosBase)) { // Evitar divisão por zero e IV inválido
            resultados.crBase = ((eMax - resultados.indiceVaziosBase) / (eMax - eMin)) * 100;
         }
      }

      // Determinar Status com base na média do CR ou no menor valor (usando média aqui)
      const crValidos = [resultados.crTopo, resultados.crBase].filter(isValidPositiveNumber);
      if (crValidos.length > 0) {
          const crMedio = calcularMediaValida(crValidos);
          // A lógica de aprovação/reprovação pode variar. Usando 95% como exemplo.
          // Considerar validação do Índice de Vazios (>= 0.74) se aplicável
          const ivValidos = [resultados.indiceVaziosTopo, resultados.indiceVaziosBase].filter(iv => isValidPositiveNumber(iv) && iv >= 0.74);
          // Status depende dos critérios: CR >= 95% E IV >= 0.74 ?
          resultados.status = crMedio >= 95 ? 'APROVADO' : 'REPROVADO';
      } else {
          resultados.status = 'DADOS INSUFICIENTES';
      }
    } else {
        resultados.status = 'FALTAM REFERÊNCIAS';
    }

    return resultados;
  }

  // --- Calcular Densidade Real (ATUALIZADO para arrays) ---
  function calcularDensidadeReal(dados) {
    const resultados = {
        determinacoesUmidadeReal: [],
        umidadeMedia: 0,
        determinacoesPicnometro: [],
        diferenca: null,
        mediaDensidadeReal: null
    };

    // Cálculos Umidade (Array 'determinacoesUmidadeReal')
    const umidades = [];
    if (dados.determinacoesUmidadeReal && Array.isArray(dados.determinacoesUmidadeReal)) {
        dados.determinacoesUmidadeReal.forEach(det => {
            const soloSeco = isValidPositiveNumber(det.soloSecoTara) && isValidPositiveNumber(det.tara) ? det.soloSecoTara - det.tara : 0;
            const agua = isValidPositiveNumber(det.soloUmidoTara) && isValidPositiveNumber(det.soloSecoTara) ? det.soloUmidoTara - det.soloSecoTara : 0;
            const umidade = isValidPositiveNumber(soloSeco) && isValidPositiveNumber(agua) ? (agua / soloSeco) * 100 : 0;
            resultados.determinacoesUmidadeReal.push({ ...det, soloSeco, agua, umidade });
            if (isValidPositiveNumber(umidade)) umidades.push(umidade);
        });
    }
    resultados.umidadeMedia = calcularMediaValida(umidades);

    // Cálculos Picnômetro (Array 'determinacoesPicnometro')
    const densidadesReais = [];
    if (dados.determinacoesPicnometro && Array.isArray(dados.determinacoesPicnometro)) {
        dados.determinacoesPicnometro.forEach(det => {
            const densidadeAgua = calcularDensidadeAgua(det.temperatura);
            const massaSoloSeco = isValidPositiveNumber(det.massaSoloUmido) && isValidPositiveNumber(resultados.umidadeMedia) ? det.massaSoloUmido / (1 + resultados.umidadeMedia / 100) : 0;
            let densidadeReal = 0;
            if (isValidPositiveNumber(massaSoloSeco) && isValidPositiveNumber(densidadeAgua) && isValidPositiveNumber(det.massaPicAgua) && isValidPositiveNumber(det.massaPicAmostraAgua)) {
                const denominador = massaSoloSeco + det.massaPicAgua - det.massaPicAmostraAgua;
                if (isValidPositiveNumber(denominador)) {
                    densidadeReal = (massaSoloSeco * densidadeAgua) / denominador;
                }
            }
            resultados.determinacoesPicnometro.push({ ...det, densidadeAgua, massaSoloSeco, densidadeReal });
            if (isValidPositiveNumber(densidadeReal)) densidadesReais.push(densidadeReal);
        });
    }

    // Resultados Finais
    resultados.mediaDensidadeReal = calcularMediaValida(densidadesReais);
    if (densidadesReais.length === 2) {
        const dr1 = densidadesReais[0];
        const dr2 = densidadesReais[1];
        if (isValidPositiveNumber(dr1)) { // Evitar divisão por zero
             resultados.diferenca = Math.abs((dr1 - dr2) / dr1) * 100;
        }
    }

    return resultados;
  }

  // --- Calcular Densidade Max/Min (ATUALIZADO para arrays) ---
  function calcularDensidadeMaxMin(dados) {
     const resultados = {
        determinacoesMax: [],
        mediaGamadMax: null,
        determinacoesMin: [],
        mediaGamadMin: null
    };

    // Densidade Máxima (Array 'determinacoesMax')
    const gamadsMax = [];
    if (dados.determinacoesMax && Array.isArray(dados.determinacoesMax)) {
        dados.determinacoesMax.forEach(det => {
            const solo = isValidPositiveNumber(det.moldeSolo) && isValidPositiveNumber(det.molde) ? det.moldeSolo - det.molde : 0;
            const gamad = isValidPositiveNumber(solo) && isValidPositiveNumber(det.volume) ? solo / det.volume : 0;
            const gamas = isValidPositiveNumber(gamad) && isValidPositiveNumber(det.w) ? gamad * (1 + det.w / 100) : 0;
            resultados.determinacoesMax.push({ ...det, solo, gamad, gamas });
            if (isValidPositiveNumber(gamad)) gamadsMax.push(gamad);
        });
    }
    resultados.mediaGamadMax = calcularMediaValida(gamadsMax);

    // Densidade Mínima (Array 'determinacoesMin')
    const gamadsMin = [];
    if (dados.determinacoesMin && Array.isArray(dados.determinacoesMin)) {
        dados.determinacoesMin.forEach(det => {
            const solo = isValidPositiveNumber(det.moldeSolo) && isValidPositiveNumber(det.molde) ? det.moldeSolo - det.molde : 0;
            const gamad = isValidPositiveNumber(solo) && isValidPositiveNumber(det.volume) ? solo / det.volume : 0;
            const gamas = isValidPositiveNumber(gamad) && isValidPositiveNumber(det.w) ? gamad * (1 + det.w / 100) : 0;
            resultados.determinacoesMin.push({ ...det, solo, gamad, gamas });
            if (isValidPositiveNumber(gamad)) gamadsMin.push(gamad);
        });
    }
    resultados.mediaGamadMin = calcularMediaValida(gamadsMin);

    return resultados;
  }

  // --- Função calcularDensidadeAgua permanece a mesma ---
   function calcularDensidadeAgua(temperatura) {
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
    // Usar delegação de eventos no container da calculadora para performance
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
      return resultados;
  }

  // Função chamada pelos eventos ou ao carregar
  function calcularAutomaticamente(tipo) {
    if (!window.calculadora.formIntegration) {
        console.error("Módulo formIntegration não encontrado para cálculo automático.");
        return;
    }
    const dados = window.calculadora.formIntegration.obterDadosFormulario(tipo);
    if (!dados) {
        // Se dados for null, obterDadosFormulario já deve ter notificado o erro
        // Podemos limpar os resultados ou mostrar um estado de erro
        window.calculadora.formIntegration.preencherResultados(tipo, null); // Limpa resultados
        return;
    }

    try {
        const resultados = calcularResultados(tipo, dados);
        window.calculadora.formIntegration.preencherResultados(tipo, resultados);
    } catch (error) {
        console.error(`Erro no cálculo automático para ${tipo}:`, error);
        window.calculadora.formIntegration.exibirNotificacao(`Erro durante o cálculo: ${error.message}`, 'error');
        // Limpar resultados em caso de erro no cálculo
        window.calculadora.formIntegration.preencherResultados(tipo, null);
    }
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
      // Não precisa expor as funções específicas de cálculo (InSitu, Real, MaxMin)
  };
})();

