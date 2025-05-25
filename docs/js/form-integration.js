// cr-main/docs/js/form-integration.js
// Módulo de integração de formulários: fornece API para cálculos automáticos
window.calculadora = window.calculadora || {};
window.calculadora.formIntegration = (() => {
    /**
     * Carrega o formulário da calculadora e dispara evento customizado
     * @param {string} tipo - 'in-situ', 'real' ou 'max-min'
     */
    function carregarFormulario(tipo) {
        const container = document.querySelector('.calculadora-container');
        if (!container) {
            console.error(`Container da calculadora não encontrado para tipo '${tipo}'`);
            return;
        }
        container.innerHTML = window.calculadora.templates[tipo] || '';
        const form = container.querySelector('form');
        document.dispatchEvent(new CustomEvent('formLoaded', { detail: { form, tipo } }));
    }

    /**
     * Extrai os dados do formulário para cálculo
     * @param {string} tipo - 'in-situ', 'real' ou 'max-min'
     * @returns {object|null} dados coletados ou null em caso de erro
     */
    function obterDadosFormulario(tipo) {
        const form = document.querySelector('.calculadora-container form');
        if (!form) {
            console.error(`Formulário '${tipo}' não encontrado`);
            return null;
        }
        try {
            const prefix = tipo === 'in-situ' ? '' : `-${tipo}`;
            const dados = {
                registro: form.querySelector(`#registro${prefix}`)?.value.trim() || '',
                data:     form.querySelector(`#data${prefix}`)?.value.trim() || '',
                operador: form.querySelector(`#operador${prefix}`)?.value.trim() || '',
                material: form.querySelector(`#material${prefix}`)?.value.trim() || ''
            };
            if (tipo === 'in-situ') {
                dados.responsavel   = form.querySelector('#responsavel')?.value.trim() || '';
                dados.verificador   = form.querySelector('#verificador')?.value.trim() || '';
                dados.norte         = parseFloat(form.querySelector('#norte')?.value) || 0;
                dados.este          = parseFloat(form.querySelector('#este')?.value) || 0;
                dados.cota          = parseFloat(form.querySelector('#cota')?.value) || 0;
                dados.camada        = parseInt(form.querySelector('#camada')?.value) || 0;
                dados.hora          = form.querySelector('#hora')?.value || '';
                dados.cilindro      = {
                    numero: form.querySelector('#numero-cilindro')?.value.trim() || '',
                    solo:   parseFloat(form.querySelector('#solo')?.value) || 0,
                    volume: parseFloat(form.querySelector('#volume')?.value) || 0
                };
                dados.teorUmidade = {
                    topo: { seco: parseFloat(form.querySelector('#umidade-topo')?.value) || 0 },
                    base: { seco: parseFloat(form.querySelector('#umidade-base')?.value) || 0 }
                };
                dados.refReal = parseFloat(form.dataset.densidadeReal) || null;
                dados.refMax  = parseFloat(form.dataset.densidadeMax) || null;
                dados.refMin  = parseFloat(form.dataset.densidadeMin) || null;
            }
            // TODO: adicionar obtenção de dados para 'real' e 'max-min'
            return dados;
        } catch (err) {
            console.error('Erro ao obter dados do formulário:', err);
            return null;
        }
    }

    /**
     * Armazena os últimos resultados no estado global, para possível reuso
     */
    function setUltimosResultados(tipo, resultados) {
        window.calculadora._ultimosResultados = window.calculadora._ultimosResultados || {};
        window.calculadora._ultimosResultados[tipo] = resultados;
    }

    /**
     * Preenche o formulário com os resultados do cálculo
     * @param {string} tipo
     * @param {object} resultados
     */
    function preencherResultados(tipo, resultados) {
        const form = document.querySelector('.calculadora-container form');
        if (!form) return;
        try {
            const prefix = tipo === 'in-situ' ? '' : `-${tipo}`;
            form.querySelectorAll('.resultado-campo').forEach(el => el.value = '');
            if (!resultados) return;

            if (tipo === 'in-situ') {
                if (resultados.gamad) {
                    form.querySelector('#gamad-topo')?.value = resultados.gamad.topo.toFixed(3);
                    form.querySelector('#gamad-base')?.value = resultados.gamad.base.toFixed(3);
                }
                if (resultados.indiceVazios) {
                    form.querySelector('#indice-vazios-topo')?.value = resultados.indiceVazios.topo.toFixed(3);
                    form.querySelector('#indice-vazios-base')?.value = resultados.indiceVazios.base.toFixed(3);
                }
                if (resultados.compacidadeRelativa) {
                    form.querySelector('#cr-topo')?.value = resultados.compacidadeRelativa.topo.toFixed(1);
                    form.querySelector('#cr-base')?.value = resultados.compacidadeRelativa.base.toFixed(1);
                }
            } else if (tipo === 'real') {
                if (resultados.mediaDensidadeReal !== undefined) {
                    form.querySelector('#media-densidade-real')?.value = resultados.mediaDensidadeReal.toFixed(3);
                }
            } else if (tipo === 'max-min') {
                if (resultados.gamadMax !== undefined) {
                    form.querySelector('#gamad-max')?.value = resultados.gamadMax.toFixed(3);
                }
                if (resultados.gamadMin !== undefined) {
                    form.querySelector('#gamad-min')?.value = resultados.gamadMin.toFixed(3);
                }
            }
        } catch (err) {
            console.error('Erro ao preencher resultados no formulário:', err);
        }
    }

    return {
        carregarFormulario,
        obterDadosFormulario,
        setUltimosResultados,
        preencherResultados
    };
})();
