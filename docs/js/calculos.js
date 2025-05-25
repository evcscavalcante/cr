// Módulo de cálculos para a Calculadora de Compacidade
// Implementa os cálculos para os diferentes tipos de ensaio

window.calculadora = window.calculadora || {};

window.calculadora.calculos = (() => {

  // Função auxiliar para calcular média ignorando valores não numéricos ou zero
  function calcularMediaValida(valores) {
    const validos = valores.filter(v => typeof v === 'number' && !isNaN(v) && v !== 0);
    return validos.length > 0 ? validos.reduce((a, b) => a + b, 0) / validos.length : 0;
  }

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
      status: 'AGUARDANDO CÁLCULO'
    };

    // --- Cálculos Densidade In Situ (2 Determinações) ---
    let gamaNatTotal = 0;
    let countGamaNat = 0;
    for (let i = 1; i <= 2; i++) {
      const moldeSolo = dados[`moldeSolo-${i}`] || 0;
      const molde = dados[`molde-${i}`] || 0;
      const volume = dados[`volume-${i}`] || 0;
      const solo = moldeSolo - molde;
      const gamaNat = volume > 0 ? solo / volume : 0;

      resultados.determinacoesInSitu.push({
        numeroCilindro: dados[`numeroCilindro-${i}`],
        moldeSolo: moldeSolo,
        molde: molde,
        solo: solo,
        volume: volume,
        gamaNat: gamaNat
      });

      if (gamaNat > 0) {
          gamaNatTotal += gamaNat;
          countGamaNat++;
      }
    }
    // Usar a média das densidades naturais válidas
    const gamaNatMedio = countGamaNat > 0 ? gamaNatTotal / countGamaNat : 0;

    // --- Cálculos Umidade Topo (3 Determinações) ---
    const umidadesTopo = [];
    for (let i = 1; i <= 3; i++) {
      const soloUmidoTara = dados[`soloUmidoTaraTopo-${i}`] || 0;
      const soloSecoTara = dados[`soloSecoTaraTopo-${i}`] || 0;
      const tara = dados[`taraTopo-${i}`] || 0;
      const soloSeco = soloSecoTara - tara;
      const agua = soloUmidoTara - soloSecoTara;
      const umidade = soloSeco > 0 ? (agua / soloSeco) * 100 : 0;

      resultados.determinacoesUmidadeTopo.push({
        capsula: dados[`capsulaTopo-${i}`],
        soloUmidoTara: soloUmidoTara,
        soloSecoTara: soloSecoTara,
        tara: tara,
        soloSeco: soloSeco,
        agua: agua,
        umidade: umidade
      });
      if (umidade > 0) umidadesTopo.push(umidade); // Considera apenas umidades válidas para a média
    }
    resultados.umidadeMediaTopo = calcularMediaValida(umidadesTopo);

    // --- Cálculos Umidade Base (3 Determinações) ---
    const umidadesBase = [];
    for (let i = 1; i <= 3; i++) {
      const soloUmidoTara = dados[`soloUmidoTaraBase-${i}`] || 0;
      const soloSecoTara = dados[`soloSecoTaraBase-${i}`] || 0;
      const tara = dados[`taraBase-${i}`] || 0;
      const soloSeco = soloSecoTara - tara;
      const agua = soloUmidoTara - soloSecoTara;
      const umidade = soloSeco > 0 ? (agua / soloSeco) * 100 : 0;

      resultados.determinacoesUmidadeBase.push({
        capsula: dados[`capsulaBase-${i}`],
        soloUmidoTara: soloUmidoTara,
        soloSecoTara: soloSecoTara,
        tara: tara,
        soloSeco: soloSeco,
        agua: agua,
        umidade: umidade
      });
       if (umidade > 0) umidadesBase.push(umidade); // Considera apenas umidades válidas para a média
    }
    resultados.umidadeMediaBase = calcularMediaValida(umidadesBase);

    // --- Cálculos Finais (usando médias) ---
    if (gamaNatMedio > 0 && resultados.umidadeMediaTopo > 0) {
        resultados.gamadTopo = gamaNatMedio / (1 + resultados.umidadeMediaTopo / 100);
    }
    if (gamaNatMedio > 0 && resultados.umidadeMediaBase > 0) {
        resultados.gamadBase = gamaNatMedio / (1 + resultados.umidadeMediaBase / 100);
    }

    // Cálculo do CR (Compacidade Relativa)
    if (dados.densidadeReal && dados.gamadMax && dados.gamadMin && dados.densidadeReal > 0 && dados.gamadMax > 0 && dados.gamadMin > 0) {
      const eMax = (dados.densidadeReal / dados.gamadMin) - 1;
      const eMin = (dados.densidadeReal / dados.gamadMax) - 1;

      if (resultados.gamadTopo > 0) {
        resultados.indiceVaziosTopo = (dados.densidadeReal / resultados.gamadTopo) - 1;
        if (eMax !== eMin) { // Evitar divisão por zero
             resultados.crTopo = ((eMax - resultados.indiceVaziosTopo) / (eMax - eMin)) * 100;
        }
      }

      if (resultados.gamadBase > 0) {
        resultados.indiceVaziosBase = (dados.densidadeReal / resultados.gamadBase) - 1;
         if (eMax !== eMin) { // Evitar divisão por zero
            resultados.crBase = ((eMax - resultados.indiceVaziosBase) / (eMax - eMin)) * 100;
         }
      }

      // Determinar Status com base na média do CR ou no menor valor, dependendo da norma (usando média aqui)
      if (resultados.crTopo !== null && resultados.crBase !== null) {
          const crMedio = (resultados.crTopo + resultados.crBase) / 2;
          // A lógica de aprovação/reprovação pode variar. Usando 95% como exemplo.
          resultados.status = crMedio >= 95 ? 'APROVADO' : 'REPROVADO';
      } else if (resultados.crTopo !== null) {
          resultados.status = resultados.crTopo >= 95 ? 'APROVADO' : 'REPROVADO';
      } else if (resultados.crBase !== null) {
           resultados.status = resultados.crBase >= 95 ? 'APROVADO' : 'REPROVADO';
      }
    }

    return resultados;
  }

  // --- Funções calcularDensidadeReal e calcularDensidadeMaxMin permanecem as mesmas ---
  // (Assumindo que essas seções não foram alteradas conforme a descrição)
  function calcularDensidadeReal(dados) {
    const soloSeco = [], agua = [], umidade = [];
    for (let i=1; i<=3; i++) {
      const ss = dados[`soloSecoTaraReal${i}`] - dados[`taraReal${i}`];
      const ag = dados[`soloUmidoTaraReal${i}`] - dados[`soloSecoTaraReal${i}`];
      soloSeco.push(ss);
      agua.push(ag);
      umidade.push((ag/ss)*100);
    }
    const umidadeMedia = calcularMediaValida(umidade); // Usando função auxiliar

    const densidadeAgua = [];
    for (let i=1; i<=2; i++) {
      densidadeAgua.push( calcularDensidadeAgua(dados[`temperatura${i}`]) );
    }

    const massaSoloSeco = [];
    for (let i=1; i<=2; i++) {
      massaSoloSeco.push( dados[`massaSoloUmido${i}`] / (1 + umidadeMedia/100) );
    }

    const densidadeReal = [];
    for (let i=1; i<=2; i++) {
      const ms = massaSoloSeco[i-1],
            pw = densidadeAgua[i-1],
            mw = dados[`massaPicAgua${i}`],
            mws= dados[`massaPicAmostraAgua${i}`];
      densidadeReal.push( (ms*pw)/(ms + mw - mws) );
    }

    const diferenca = Math.abs((densidadeReal[0] - densidadeReal[1]) / densidadeReal[0]) * 100;
    const mediaDensidadeReal = calcularMediaValida(densidadeReal); // Usando função auxiliar

    return { soloSeco, agua, umidade, umidadeMedia, densidadeAgua, massaSoloSeco, densidadeReal, diferenca, mediaDensidadeReal };
  }

  function calcularDensidadeMaxMin(dados) {
    const soloMax=[] , gamadMax=[], gamasMax=[];
    for (let i=1; i<=3; i++) {
      const sm = dados[`moldeSoloMax${i}`] - dados[`moldeMax${i}`];
      soloMax.push(sm);
      gamadMax.push( sm / dados[`volumeMax${i}`] );
      gamasMax.push( gamadMax[i-1] * (1 + dados[`wMax${i}`]/100) );
    }
    const mediaGamadMax = calcularMediaValida(gamadMax); // Usando função auxiliar

    const soloMin=[] , gamadMin=[], gamasMin=[];
    for (let i=1; i<=3; i++) {
      const sm = dados[`moldeSoloMin${i}`] - dados[`moldeMin${i}`];
      soloMin.push(sm);
      gamadMin.push( sm / dados[`volumeMin${i}`] );
      gamasMin.push( gamadMin[i-1] * (1 + dados[`wMin${i}`]/100) );
    }
    const mediaGamadMin = calcularMediaValida(gamadMin); // Usando função auxiliar

    return { soloMax, gamadMax, gamasMax, mediaGamadMax, soloMin, gamadMin, gamasMin, mediaGamadMin };
  }

  // --- Função calcularDensidadeAgua permanece a mesma ---
   function calcularDensidadeAgua(temperatura) {
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
    if (temperatura>=30) return tabela[15].dens;
    let i=0;
    while (tabela[i+1].temp < temperatura) i++;
    const t1=tabela[i], t2=tabela[i+1];
    return t1.dens + (t2.dens - t1.dens)*(temperatura-t1.temp)/(t2.temp-t1.temp);
  }

  // --- Funções de configuração e cálculo automático ---
  function configurarCalculosAutomaticos() {
    document.addEventListener('formLoaded', ev => {
      const form = ev.detail.form, tipo = ev.detail.tipo;
      const inputs = form.querySelectorAll('input:not([readonly])');
      inputs.forEach(i=>{
        // Usar 'input' para cálculo em tempo real, 'blur' pode ser redundante ou causar chamadas extras
        i.addEventListener('input', ()=>window.calculadora.calculos.calcularAutomaticamente(tipo));
      });
      form.querySelectorAll('select').forEach(s=>{
        s.addEventListener('change', ()=>window.calculadora.calculos.calcularAutomaticamente(tipo));
      });
      // Remover listener do botão calcular se o cálculo é automático
      // const btn = form.querySelector('.btn-calcular');
      // if(btn) btn.addEventListener('click', ()=>window.calculadora.calculos.calcularAutomaticamente(tipo));
      
      // Calcular ao carregar o formulário (após um pequeno delay para garantir que tudo esteja pronto)
      setTimeout(()=>window.calculadora.calculos.calcularAutomaticamente(tipo), 500);
    });
  }

  function calcularAutomaticamente(tipo) {
    if(!window.calculadora.formIntegration) return;
    const dados = window.calculadora.formIntegration.obterDadosFormulario(tipo);
    if(!dados) return;
    let resultados;
    try {
        if(tipo==='in-situ')   resultados=calcularDensidadeInSitu(dados);
        if(tipo==='real')      resultados=calcularDensidadeReal(dados);
        if(tipo==='max-min')   resultados=calcularDensidadeMaxMin(dados);
        window.calculadora.formIntegration.preencherResultados(tipo, resultados);
    } catch (error) {
        console.error(`Erro no cálculo automático para ${tipo}:`, error);
        // Opcional: notificar usuário sobre erro no cálculo automático
    }
  }

  function init() {
    configurarCalculosAutomaticos();
  }
  document.addEventListener('DOMContentLoaded', init);

  // Exportar funções públicas
  return { 
      calcularDensidadeInSitu, 
      calcularDensidadeReal, 
      calcularDensidadeMaxMin, 
      calcularDensidadeAgua, 
      calcularAutomaticamente 
  };
})();

