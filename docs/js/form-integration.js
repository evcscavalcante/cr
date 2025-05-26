window.calculadora.formIntegration = (function() {
    // Se você definiu window.calculadora.templates = { 'in-situ': '...', 'real': '...', 'max-min': '...' }
    // ele será usado. Caso contrário, procuramos um <template id="template-in-situ">, etc.
   function getTemplateHTML(tipo) {
    // 1) se o usuário definiu window.calculadora.templates, usa isso
    if (window.calculadora.templates && window.calculadora.templates[tipo]) {
        return window.calculadora.templates[tipo];
    }
    // 2) procura pelo <template id="template-densidade-<tipo>">
    // mapeia 'in-situ' → 'template-densidade-in-situ', 'real' → 'template-densidade-real', 'max-min' → 'template-densidade-max-min'
    const templateId = `template-densidade-${tipo}`;
    const tpl = document.getElementById(templateId);
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
        console.error(`Formulário '${tipo}' não encontrado`);
        return null;
    }

    try {
        const dados = {
            registro: form.querySelector('#registro')?.value.trim() || '',
            data: form.querySelector('#data')?.value || '',
            operador: form.querySelector('#operador')?.value.trim() || '',
            responsavel: form.querySelector('#responsavel')?.value.trim() || '',
            verificador: form.querySelector('#verificador')?.value.trim() || '',
            material: form.querySelector('#material')?.value.trim() || '',
            origem: form.querySelector('#origem')?.value.trim() || '',
            norte: parseFloat(form.querySelector('#norte')?.value) || 0,
            este: parseFloat(form.querySelector('#este')?.value) || 0,
            cota: parseFloat(form.querySelector('#cota')?.value) || 0,
            camada: form.querySelector('#camada')?.value.trim() || '',
            hora: form.querySelector('#hora')?.value || '',
            determinacoesInSitu: [
                {
                    moldeSolo: parseFloat(form.querySelector('#molde-solo-1')?.value) || 0,
                    molde: parseFloat(form.querySelector('#molde-1')?.value) || 0,
                    volume: parseFloat(form.querySelector('#volume-1')?.value) || 0
                },
                {
                    moldeSolo: parseFloat(form.querySelector('#molde-solo-2')?.value) || 0,
                    molde: parseFloat(form.querySelector('#molde-2')?.value) || 0,
                    volume: parseFloat(form.querySelector('#volume-2')?.value) || 0
                }
            ],
            determinacoesUmidadeTopo: [1, 2, 3].map(i => ({
                soloUmidoTara: parseFloat(form.querySelector(`#solo-umido-tara-topo-${i}`)?.value) || 0,
                soloSecoTara: parseFloat(form.querySelector(`#solo-seco-tara-topo-${i}`)?.value) || 0,
                tara: parseFloat(form.querySelector(`#tara-topo-${i}`)?.value) || 0
            })),
            determinacoesUmidadeBase: [1, 2, 3].map(i => ({
                soloUmidoTara: parseFloat(form.querySelector(`#solo-umido-tara-base-${i}`)?.value) || 0,
                soloSecoTara: parseFloat(form.querySelector(`#solo-seco-tara-base-${i}`)?.value) || 0,
                tara: parseFloat(form.querySelector(`#tara-base-${i}`)?.value) || 0
            })),
            refReal: parseFloat(form.dataset.densidadeReal) || null,
            refMax: parseFloat(form.dataset.densidadeMax) || null,
            refMin: parseFloat(form.dataset.densidadeMin) || null
        };

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
