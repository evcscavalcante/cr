window.calculadora.formIntegration = (function() {
    // Se você definiu window.calculadora.templates = { 'in-situ': '...', 'real': '...', 'max-min': '...' }
    // ele será usado. Caso contrário, procuramos um <template id="template-in-situ">, etc.
    function getTemplateHTML(tipo) {
        // 1) tentar objeto JS
        if (window.calculadora.templates && window.calculadora.templates[tipo]) {
            return window.calculadora.templates[tipo];
        }
        // 2) tentar <template> no HTML
        const tpl = document.getElementById(template - $, { tipo });
        if (tpl && tpl.innerHTML) {
            return tpl.innerHTML;
        }
        return null;
    }

    /**
     * Carrega o formulário da calculadora e dispara evento customizado
     * @param {'in-situ'|'real'|'max-min'} tipo
     */
    function carregarFormulario(tipo) {
        const container = document.getElementById('calculadora');
        if (!container) {
            console.error(Container, da, calculadora, não, encontrado, para, tipo, '${tipo}');
            return;
        }

        const html = getTemplateHTML(tipo);
        if (!html) {
            console.error(Template, para, tipo, '${tipo}', não, encontrado +
                Defina, window.calculadora.templates['${tipo}'], ou, adicione < template, id = "template-${tipo}" > no, HTML);
            return;
        }

        container.innerHTML = html;

        const form = container.querySelector('form');
        if (!form) {
            console.error(Formulário, não, encontrado, após, injeção, de, template, para, tipo, '${tipo}');
            return;
        }

        document.dispatchEvent(new CustomEvent('formLoaded', { detail: { form, tipo } }));
    }

    /**
     * Extrai os dados do formulário para cálculo
     * @param {'in-situ'|'real'|'max-min'} tipo
     * @returns {object|null}
     */
    function obterDadosFormulario(tipo) {
        const form = document.querySelector('#calculadora form');
        if (!form) {
            console.error(Formulário, '${tipo}', não, encontrado);
            return null;
        }
        try {
            const prefix = tipo === 'in-situ' ? '' : -$, { tipo };
            const dados = {
                registro: (form.querySelector(#registro$, { prefix }) || {}).value?.trim() || '',
                data: (form.querySelector(#data$, { prefix }) || {}).value?.trim() || '',
                operador: (form.querySelector(#operador$, { prefix }) || {}).value?.trim() || '',
                material: (form.querySelector(#material$, { prefix }) || {}).value?.trim() || ''
            };

            if (tipo === 'in-situ') {
                dados.responsavel = (form.querySelector('#responsavel') || {}).value?.trim() || '';
                dados.verificador = (form.querySelector('#verificador') || {}).value?.trim() || '';
                dados.norte = parseFloat((form.querySelector('#norte') || {}).value) || 0;
                dados.este = parseFloat((form.querySelector('#este') || {}).value) || 0;
                dados.cota = parseFloat((form.querySelector('#cota') || {}).value) || 0;
                dados.camada = parseInt((form.querySelector('#camada') || {}).value) || 0;
                dados.hora = (form.querySelector('#hora') || {}).value || '';
                dados.cilindro = {
                    numero: (form.querySelector('#numero-cilindro') || {}).value?.trim() || '',
                    solo: parseFloat((form.querySelector('#solo') || {}).value) || 0,
                    volume: parseFloat((form.querySelector('#volume') || {}).value) || 0
                };
                dados.teorUmidade = {
                    topo: { seco: parseFloat((form.querySelector('#umidade-topo') || {}).value) || 0 },
                    base: { seco: parseFloat((form.querySelector('#umidade-base') || {}).value) || 0 }
                };
                dados.refReal = parseFloat(form.dataset.densidadeReal) || null;
                dados.refMax = parseFloat(form.dataset.densidadeMax) || null;
                dados.refMin = parseFloat(form.dataset.densidadeMin) || null;

            } else if (tipo === 'real') {
                // TODO: implementar extração para densidade real
                dados.determinacoesUmidadeReal = [];
                dados.determinacoesPicnometro = [];

            } else if (tipo === 'max-min') {
                // TODO: implementar extração para densidade máx/min
                dados.determinacoesMax = [];
                dados.determinacoesMin = [];
            }

            return dados;

        } catch (err) {
            console.error('Erro ao obter dados do formulário:', err);
            return null;
        }
    }

    function limparFormulario() {
        const form = document.querySelector('#calculadora form');
        if (!form) {
            console.warn('Formulário não encontrado para limpeza');
            return;
        }

        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });

        console.log('Formulário limpo');
    }


    /**
     * Armazena os últimos resultados no estado global
     */
    function setUltimosResultados(tipo, resultados) {
        window.calculadora._ultimosResultados = window.calculadora._ultimosResultados || {};
        window.calculadora._ultimosResultados[tipo] = resultados;
    }

    /**
     * Preenche o formulário com os resultados do cálculo
     * @param {'in-situ'|'real'|'max-min'} tipo
     * @param {object} resultados
     */
  function preencherResultados(tipo, resultados) {
    const form = document.querySelector('#calculadora form');
    if (!form) return;

    form.querySelectorAll('.resultado-campo').forEach(el => el.value = '');

    if (!resultados) return;

    if (tipo === 'in-situ') {
        const topoEl = form.querySelector('#gamad-topo');
        if (topoEl && resultados.gamad) topoEl.value = resultados.gamad.topo.toFixed(3);

        const baseEl = form.querySelector('#gamad-base');
        if (baseEl && resultados.gamad) baseEl.value = resultados.gamad.base.toFixed(3);

        const ivTopo = form.querySelector('#indice-vazios-topo');
        if (ivTopo && resultados.indiceVazios) ivTopo.value = resultados.indiceVazios.topo.toFixed(3);

        const ivBase = form.querySelector('#indice-vazios-base');
        if (ivBase && resultados.indiceVazios) ivBase.value = resultados.indiceVazios.base.toFixed(3);

        const crTopo = form.querySelector('#cr-topo');
        if (crTopo && resultados.compacidadeRelativa) crTopo.value = resultados.compacidadeRelativa.topo.toFixed(1);

        const crBase = form.querySelector('#cr-base');
        if (crBase && resultados.compacidadeRelativa) crBase.value = resultados.compacidadeRelativa.base.toFixed(1);

    } else if (tipo === 'real') {
        const mdrEl = form.querySelector('#media-densidade-real');
        if (mdrEl && resultados.mediaDensidadeReal != null) {
            mdrEl.value = resultados.mediaDensidadeReal.toFixed(3);
        }

    } else if (tipo === 'max-min') {
        const maxEl = form.querySelector('#gamad-max');
        if (maxEl && resultados.mediaGamadMax != null) {
            maxEl.value = resultados.mediaGamadMax.toFixed(3);
        }
        const minEl = form.querySelector('#gamad-min');
        if (minEl && resultados.mediaGamadMin != null) {
            minEl.value = resultados.mediaGamadMin.toFixed(3);
        }
    }
}

// ✅ Adicione logo abaixo:
function limparFormulario() {
    const form = document.querySelector('#calculadora form');
    if (!form) {
        console.warn('Formulário não encontrado para limpeza');
        return;
    }

    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });

    console.log('Formulário limpo');
}


      
    function getTipoFormularioAtual() {
        const form = document.querySelector('#calculadora form');
        if (!form) return null;

        if (form.querySelector('#registro')) return 'in-situ';
        if (form.querySelector('#registro-real')) return 'real';
        if (form.querySelector('#registro-max-min')) return 'max-min';

        return null;
    }

   return {
    carregarFormulario,
    obterDadosFormulario,
    setUltimosResultados,
    preencherResultados,
    getTipoFormularioAtual,
    limparFormulario
};



})();
