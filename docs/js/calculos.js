// Módulo de cálculos para a Calculadora de Compacidade
// Implementa os cálculos para os diferentes tipos de ensaio

// Namespace para calculadora
window.calculadora = window.calculadora || {};

// Módulo de cálculos
window.calculadora.calculos = (() => {
    // Calcular densidade in situ
    function calcularDensidadeInSitu(dados) {
        console.log('Calculando densidade in situ:', dados);
        
        // Calcular solo
        const solo = dados.moldeSolo - dados.molde;
        
        // Calcular gama natural
        const gamaNat = solo / dados.volume;
        
        // Calcular umidade - Topo
        const soloSecoTopo = dados.soloSecoTaraTopo - dados.taraTopo;
        const aguaTopo = dados.soloUmidoTaraTopo - dados.soloSecoTaraTopo;
        const umidadeTopo = (aguaTopo / soloSecoTopo) * 100;
        
        // Calcular umidade - Base
        const soloSecoBase = dados.soloSecoTaraBase - dados.taraBase;
        const aguaBase = dados.soloUmidoTaraBase - dados.soloSecoTaraBase;
        const umidadeBase = (aguaBase / soloSecoBase) * 100;
        
        // Calcular gama seco
        const gamadTopo = gamaNat / (1 + (umidadeTopo / 100));
        const gamadBase = gamaNat / (1 + (umidadeBase / 100));
        
        // Calcular índice de vazios e compacidade relativa
        let indiceVaziosTopo = null;
        let indiceVaziosBase = null;
        let crTopo = null;
        let crBase = null;
        let status = 'AGUARDANDO CÁLCULO';
        
        // Verificar se há referências para cálculos adicionais
        if (dados.densidadeReal && dados.gamadMax && dados.gamadMin) {
            // Calcular índice de vazios
            indiceVaziosTopo = (dados.densidadeReal / gamadTopo) - 1;
            indiceVaziosBase = (dados.densidadeReal / gamadBase) - 1;
            
            // Calcular índice de vazios máximo e mínimo
            const eMax = (dados.densidadeReal / dados.gamadMin) - 1;
            const eMin = (dados.densidadeReal / dados.gamadMax) - 1;
            
            // Calcular compacidade relativa
            crTopo = ((eMax - indiceVaziosTopo) / (eMax - eMin)) * 100;
            crBase = ((eMax - indiceVaziosBase) / (eMax - eMin)) * 100;
            
            // Determinar status
            const crMedio = (crTopo + crBase) / 2;
            if (crMedio >= 95) {
                status = 'APROVADO';
            } else {
                status = 'REPROVADO';
            }
        }
        
        return {
            solo,
            gamaNat,
            soloSecoTopo,
            aguaTopo,
            umidadeTopo,
            soloSecoBase,
            aguaBase,
            umidadeBase,
            gamadTopo,
            gamadBase,
            indiceVaziosTopo,
            indiceVaziosBase,
            crTopo,
            crBase,
            status
        };
    }
    
    // Calcular densidade real
    function calcularDensidadeReal(dados) {
        console.log('Calculando densidade real:', dados);
        
        // Calcular umidade
        const soloSeco = [];
        const agua = [];
        const umidade = [];
        
        for (let i = 1; i <= 3; i++) {
            const soloSecoVal = dados[`soloSecoTaraReal${i}`] - dados[`taraReal${i}`];
            const aguaVal = dados[`soloUmidoTaraReal${i}`] - dados[`soloSecoTaraReal${i}`];
            const umidadeVal = (aguaVal / soloSecoVal) * 100;
            
            soloSeco.push(soloSecoVal);
            agua.push(aguaVal);
            umidade.push(umidadeVal);
        }
        
        // Calcular umidade média
        const umidadeMedia = umidade.reduce((sum, val) => sum + val, 0) / umidade.length;
        
        // Calcular densidade da água com base na temperatura
        const densidadeAgua = [];
        for (let i = 1; i <= 2; i++) {
            const temperatura = dados[`temperatura${i}`];
            densidadeAgua.push(calcularDensidadeAgua(temperatura));
        }
        
        // Calcular massa do solo seco
        const massaSoloSeco = [];
        for (let i = 1; i <= 2; i++) {
            const massaSoloUmido = dados[`massaSoloUmido${i}`];
            massaSoloSeco.push(massaSoloUmido / (1 + (umidadeMedia / 100)));
        }
        
        // Calcular densidade real
        const densidadeReal = [];
        for (let i = 1; i <= 2; i++) {
            const ms = massaSoloSeco[i-1];
            const pw = densidadeAgua[i-1];
            const mw = dados[`massaPicAgua${i}`];
            const mws = dados[`massaPicAmostraAgua${i}`];
            
            const dr = (ms * pw) / (ms + mw - mws);
            densidadeReal.push(dr);
        }
        
        // Calcular diferença percentual
        const diferenca = Math.abs((densidadeReal[0] - densidadeReal[1]) / densidadeReal[0]) * 100;
        
        // Calcular média da densidade real
        const mediaDensidadeReal = (densidadeReal[0] + densidadeReal[1]) / 2;
        
        return {
            soloSeco,
            agua,
            umidade,
            umidadeMedia,
            densidadeAgua,
            massaSoloSeco,
            densidadeReal,
            diferenca,
            mediaDensidadeReal
        };
    }
    
    // Calcular densidade máxima e mínima
    function calcularDensidadeMaxMin(dados) {
        console.log('Calculando densidade máxima e mínima:', dados);
        
        // Calcular densidade máxima
        const soloMax = [];
        const gamadMax = [];
        const gamasMax = [];
        
        for (let i = 1; i <= 3; i++) {
            const soloMaxVal = dados[`moldeSoloMax${i}`] - dados[`moldeMax${i}`];
            const gamadMaxVal = soloMaxVal / dados[`volumeMax${i}`];
            const gamasMaxVal = gamadMaxVal * (1 + (dados[`wMax${i}`] / 100));
            
            soloMax.push(soloMaxVal);
            gamadMax.push(gamadMaxVal);
            gamasMax.push(gamasMaxVal);
        }
        
        // Calcular média da densidade máxima
        const mediaGamadMax = gamadMax.reduce((sum, val) => sum + val, 0) / gamadMax.length;
        
        // Calcular densidade mínima
        const soloMin = [];
        const gamadMin = [];
        const gamasMin = [];
        
        for (let i = 1; i <= 3; i++) {
            const soloMinVal = dados[`moldeSoloMin${i}`] - dados[`moldeMin${i}`];
            const gamadMinVal = soloMinVal / dados[`volumeMin${i}`];
            const gamasMinVal = gamadMinVal * (1 + (dados[`wMin${i}`] / 100));
            
            soloMin.push(soloMinVal);
            gamadMin.push(gamadMinVal);
            gamasMin.push(gamasMinVal);
        }
        
        // Calcular média da densidade mínima
        const mediaGamadMin = gamadMin.reduce((sum, val) => sum + val, 0) / gamadMin.length;
        
        return {
            soloMax,
            gamadMax,
            gamasMax,
            mediaGamadMax,
            soloMin,
            gamadMin,
            gamasMin,
            mediaGamadMin
        };
    }
    
    // Calcular densidade da água em função da temperatura
    function calcularDensidadeAgua(temperatura) {
        // Tabela de densidade da água em função da temperatura
        const tabela = [
            { temp: 15, densidade: 0.9991 },
            { temp: 16, densidade: 0.9989 },
            { temp: 17, densidade: 0.9988 },
            { temp: 18, densidade: 0.9986 },
            { temp: 19, densidade: 0.9984 },
            { temp: 20, densidade: 0.9982 },
            { temp: 21, densidade: 0.9980 },
            { temp: 22, densidade: 0.9978 },
            { temp: 23, densidade: 0.9975 },
            { temp: 24, densidade: 0.9973 },
            { temp: 25, densidade: 0.9970 },
            { temp: 26, densidade: 0.9968 },
            { temp: 27, densidade: 0.9965 },
            { temp: 28, densidade: 0.9962 },
            { temp: 29, densidade: 0.9959 },
            { temp: 30, densidade: 0.9956 }
        ];
        
        // Verificar limites
        if (temperatura <= 15) return 0.9991;
        if (temperatura >= 30) return 0.9956;
        
        // Encontrar valores para interpolação
        let i = 0;
        while (i < tabela.length - 1 && tabela[i+1].temp < temperatura) {
            i++;
        }
        
        // Interpolação linear
        const t1 = tabela[i].temp;
        const t2 = tabela[i+1].temp;
        const d1 = tabela[i].densidade;
        const d2 = tabela[i+1].densidade;
        
        return d1 + (d2 - d1) * (temperatura - t1) / (t2 - t1);
    }
    
    // Configurar cálculos automáticos
    function configurarCalculosAutomaticos() {
        console.log('Configurando cálculos automáticos...');
        
        document.addEventListener('formLoaded', (event) => {
            const form = event.detail.form;
            const tipo = event.detail.tipo;
            
            if (!form) return;
            
            console.log(`Configurando cálculos automáticos para ${tipo}`);
            
            // Adicionar event listeners para inputs
            const inputs = form.querySelectorAll('input:not([readonly])');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    console.log(`Input alterado: ${input.id}`);
                    calcularAutomaticamente(tipo);
                });
                
                // Também calcular ao perder o foco
                input.addEventListener('blur', () => {
                    calcularAutomaticamente(tipo);
                });
            });
            
            // Adicionar event listeners para selects
            const selects = form.querySelectorAll('select');
            selects.forEach(select => {
                select.addEventListener('change', () => {
                    console.log(`Select alterado: ${select.id}`);
                    calcularAutomaticamente(tipo);
                });
            });
            
            // Configurar botão de calcular
            const btnCalcular = form.querySelector('.btn-calcular');
            if (btnCalcular) {
                btnCalcular.addEventListener('click', () => {
                    console.log('Botão calcular clicado');
                    calcularAutomaticamente(tipo);
                });
            }
            
            // Calcular inicialmente
            setTimeout(() => {
                calcularAutomaticamente(tipo);
            }, 500);
        });
    }
    
    // Calcular automaticamente
    function calcularAutomaticamente(tipo) {
        console.log(`Calculando automaticamente para ${tipo}`);
        
        if (!window.calculadora.formIntegration) {
            console.error('Módulo de integração de formulários não disponível');
            return;
        }
        
        try {
            // Obter dados do formulário
            const dados = window.calculadora.formIntegration.obterDadosFormulario(tipo);
            if (!dados) {
                console.error('Não foi possível obter dados do formulário');
                return;
            }
            
            console.log('Dados obtidos:', dados);
            
            // Calcular resultados
            let resultados;
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
                    console.error(`Tipo de ensaio inválido: ${tipo}`);
                    return;
            }
            
            console.log('Resultados calculados:', resultados);
            
            // Preencher resultados no formulário
            window.calculadora.formIntegration.preencherResultados(tipo, resultados);
        } catch (error) {
            console.error(`Erro ao calcular automaticamente para ${tipo}:`, error);
        }
    }
    
    // Inicializar módulo
    function init() {
        console.log('Inicializando módulo de cálculos...');
        configurarCalculosAutomaticos();
    }
    
    // Inicializar ao carregar a página
    document.addEventListener('DOMContentLoaded', init);
    
    // API pública
    return {
        calcularDensidadeInSitu,
        calcularDensidadeReal,
        calcularDensidadeMaxMin,
        calcularDensidadeAgua,
        calcularAutomaticamente
    };
})();
