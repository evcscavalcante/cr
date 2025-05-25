// Módulo de cálculos para a Calculadora de Compacidade
// Implementa os cálculos para os diferentes tipos de ensaio

window.calculadora = window.calculadora || {};

window.calculadora.calculos = (() => {
  function calcularDensidadeInSitu(dados) {
    const solo = dados.moldeSolo - dados.molde;
    const gamaNat = solo / dados.volume;

    const soloSecoTopo = dados.soloSecoTaraTopo - dados.taraTopo;
    const aguaTopo     = dados.soloUmidoTaraTopo - dados.soloSecoTaraTopo;
    const umidadeTopo  = (aguaTopo / soloSecoTopo) * 100;

    const soloSecoBase = dados.soloSecoTaraBase - dados.taraBase;
    const aguaBase     = dados.soloUmidoTaraBase - dados.soloSecoTaraBase;
    const umidadeBase  = (aguaBase / soloSecoBase) * 100;

    const gamadTopo = gamaNat / (1 + umidadeTopo/100);
    const gamadBase = gamaNat / (1 + umidadeBase/100);
    const indiceVazios-Topo = (dados.densidadeReal / gamadTopo) - 1;
    const indiceVazios-Base = (dados.densidadeReal / gamadBase) - 1;
  

    let indiceVaziosTopo = null,
        indiceVaziosBase = null,
        crTopo = null,
        crBase = null,
        status = 'AGUARDANDO CÁLCULO';

    if (dados.densidadeReal && dados.gamadMax && dados.gamadMin) {
      indiceVaziosTopo = (dados.densidadeReal / gamadTopo) - 1;
      indiceVaziosBase = (dados.densidadeReal / gamadBase) - 1;

      const eMax = (dados.densidadeReal / dados.gamadMin) - 1;
      const eMin = (dados.densidadeReal / dados.gamadMax) - 1;

      crTopo = ((eMax - indiceVaziosTopo)/(eMax - eMin))*100;
      crBase = ((eMax - indiceVaziosBase)/(eMax - eMin))*100;

      const crMedio = (crTopo + crBase)/2;
      status = crMedio >= 95 ? 'APROVADO' : 'REPROVADO';
    }

    return {
      solo, gamaNat,
      soloSecoTopo, aguaTopo, umidadeTopo,
      soloSecoBase, aguaBase, umidadeBase,
      gamadTopo, gamadBase,
      indiceVaziosTopo, indiceVaziosBase,
      crTopo, crBase, status
    };
  }

  function calcularDensidadeReal(dados) {
    const soloSeco = [], agua = [], umidade = [];
    for (let i=1; i<=3; i++) {
      const ss = dados[`soloSecoTaraReal${i}`] - dados[`taraReal${i}`];
      const ag = dados[`soloUmidoTaraReal${i}`] - dados[`soloSecoTaraReal${i}`];
      soloSeco.push(ss);
      agua.push(ag);
      umidade.push((ag/ss)*100);
    }
    const umidadeMedia = umidade.reduce((a,b)=>a+b,0)/3;

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
    const mediaDensidadeReal = (densidadeReal[0] + densidadeReal[1]) / 2;

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
    const mediaGamadMax = gamadMax.reduce((a,b)=>a+b,0)/3;

    const soloMin=[] , gamadMin=[], gamasMin=[];
    for (let i=1; i<=3; i++) {
      const sm = dados[`moldeSoloMin${i}`] - dados[`moldeMin${i}`];
      soloMin.push(sm);
      gamadMin.push( sm / dados[`volumeMin${i}`] );
      gamasMin.push( gamadMin[i-1] * (1 + dados[`wMin${i}`]/100) );
    }
    const mediaGamadMin = gamadMin.reduce((a,b)=>a+b,0)/3;

    return { soloMax, gamadMax, gamasMax, mediaGamadMax, soloMin, gamadMin, gamasMin, mediaGamadMin };
  }

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

  function configurarCalculosAutomaticos() {
    document.addEventListener('formLoaded', ev => {
      const form = ev.detail.form, tipo = ev.detail.tipo;
      const inputs = form.querySelectorAll('input:not([readonly])');
      inputs.forEach(i=>{
        i.addEventListener('input', ()=>window.calculadora.calculos.calcularAutomaticamente(tipo));
        i.addEventListener('blur', ()=>window.calculadora.calculos.calcularAutomaticamente(tipo));
      });
      form.querySelectorAll('select').forEach(s=>{
        s.addEventListener('change', ()=>window.calculadora.calculos.calcularAutomaticamente(tipo));
      });
      const btn = form.querySelector('.btn-calcular');
      if(btn) btn.addEventListener('click', ()=>window.calculadora.calculos.calcularAutomaticamente(tipo));
      setTimeout(()=>window.calculadora.calculos.calcularAutomaticamente(tipo),500);
    });
  }

  function calcularAutomaticamente(tipo) {
    if(!window.calculadora.formIntegration) return;
    const dados = window.calculadora.formIntegration.obterDadosFormulario(tipo);
    if(!dados) return;
    let resultados;
    if(tipo==='in-situ')   resultados=calcularDensidadeInSitu(dados);
    if(tipo==='real')      resultados=calcularDensidadeReal(dados);
    if(tipo==='max-min')   resultados=calcularDensidadeMaxMin(dados);
    window.calculadora.formIntegration.preencherResultados(tipo, resultados);
  }

  function init() {
    configurarCalculosAutomaticos();
  }
  document.addEventListener('DOMContentLoaded', init);

  return { calcularDensidadeInSitu, calcularDensidadeReal, calcularDensidadeMaxMin, calcularDensidadeAgua, calcularAutomaticamente };
})();
