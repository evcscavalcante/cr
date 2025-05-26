window.calculadora = window.calculadora || {};
window.calculadora.formIntegration = (function () {
    function getTemplateHTML(tipo) {
        if (window.calculadora.templates && window.calculadora.templates[tipo]) {
            return window.calculadora.templates[tipo];
        }
        const tpl = document.getElementById(`template-${tipo}`);
        return tpl?.innerHTML || null;
    }

    function carregarFormulario(tipo) {
        const container = document.getElementById('calculadora');
        if (!container) return;

        const html = getTemplateHTML(tipo);
        if (!html) return;

        container.innerHTML = html;

        const form = container.querySelector('form');
        if (!form) return;

        document.dispatchEvent(new CustomEvent('formLoaded', { detail: { form, tipo } }));
    }

    function obterDadosFormulario(tipo) {
        const form = document.querySelector('#calculadora form');
        if (!form) return null;

        const prefix = tipo === 'in-situ' ? '' : `-${tipo}`;
        const dados = {
            registro: (form.querySelector(`#registro${prefix}`) || {}).value?.trim() || '',
            data: (form.querySelector(`#data${prefix}`) || {}).value?.trim() || '',
            operador: (form.querySelector(`#operador${prefix}`) || {}).value?.trim() || '',
            material: (form.querySelector(`#material${prefix}`) || {}).value?.trim() || ''
        };

        if (tipo === 'in-situ') {
            dados.responsavel = form.querySelector('#responsavel')?.value?.trim() || '';
            dados.verificador = form.querySelector('#verificador')?.value?.trim() || '';
            dados.norte = parseFloat(form.querySelector('#norte')?.value) || 0;
            dados.este = parseFloat(form.querySelector('#este')?.value) || 0;
            dados.cota = parseFloat(form.querySelector('#cota')?.value) || 0;
            dados.camada = parseInt(form.querySelector('#camada')?.value) || 0;
            dados.hora = form.querySelector('#hora')?.value || '';

            dados.determinacoesInSitu = [1, 2].map(i => ({
                moldeSolo: parseFloat(form.querySelector(`#molde-solo-${i}`)?.value) || 0,
                molde: parseFloat(form.querySelector(`#molde-${i}`)?.value) || 0,
                volume: parseFloat(form.querySelector(`#volume-${i}`)?.value) || 0
            }));

            dados.determinacoesUmidadeTopo = [1, 2, 3].map(i => ({
                soloUmidoTara: parseFloat(form.querySelector(`#solo-umido-tara-topo-${i}`)?.value) || 0,
                soloSecoTara: parseFloat(form.querySelector(`#solo-seco-tara-topo-${i}`)?.value) || 0,
                tara: parseFloat(form.querySelector(`#tara-topo-${i}`)?.value) || 0
            }));

            dados.determinacoesUmidadeBase = [1, 2, 3].map(i => ({
                soloUmidoTara: parseFloat(form.querySelector(`#solo-umido-tara-base-${i}`)?.value) || 0,
                soloSecoTara: parseFloat(form.querySelector(`#solo-seco-tara-base-${i}`)?.value) || 0,
                tara: parseFloat(form.querySelector(`#tara-base-${i}`)?.value) || 0
            }));

            // IMPORTANTE: deve ser atribuído dinamicamente ao carregar o form
            dados.refReal = parseFloat(form.dataset.densidadeReal) || null;
            dados.refMax = parseFloat(form.dataset.densidadeMax) || null;
            dados.refMin = parseFloat(form.dataset.densidadeMin) || null;
        }

        return dados;
    }

    function limparFormulario() {
        const form = document.querySelector('#calculadora form');
        if (!form) return;
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
        window.calculadora?.exibirNotificacao?.('Formulário limpo com sucesso!', 'success');
    }

    function preencherResultados(tipo, resultados) {
        const form = document.querySelector('#calculadora form');
        if (!form || !resultados) return;

        if (tipo === 'in-situ') {
            form.querySelector('#gamad-topo')!.value = resultados.gamadTopo?.toFixed(3) || '';
            form.querySelector('#gamad-base')!.value = resultados.gamadBase?.toFixed(3) || '';
            form.querySelector('#indice-vazios-topo')!.value = resultados.indiceVaziosTopo?.toFixed(2) || '';
            form.querySelector('#indice-vazios-base')!.value = resultados.indiceVaziosBase?.toFixed(2) || '';
            form.querySelector('#cr-topo')!.value = resultados.compacidadeRelativa?.topo?.toFixed(1) || '';
            form.querySelector('#cr-base')!.value = resultados.compacidadeRelativa?.base?.toFixed(1) || '';
            const statusDiv = form.querySelector('#status-ensaio');
            if (statusDiv) {
                statusDiv.textContent = resultados.status;
                statusDiv.classList.remove('status-aprovado', 'status-reprovado');
                if (resultados.status === 'APROVADO') {
                    statusDiv.classList.add('status-aprovado');
                } else if (resultados.status === 'REPROVADO') {
                    statusDiv.classList.add('status-reprovado');
                }
            }
        }
    }

    function getTipoFormularioAtual() {
        const form = document.querySelector('#calculadora form');
        if (!form) return null;
        if (form.querySelector('#registro')) return 'in-situ';
        if (form.querySelector('#registro-real')) return 'real';
        if (form.querySelector('#registro-max-min')) return 'max-min';
        return null;
    }

    function setUltimosResultados(tipo, resultados) {
        window.calculadora._ultimosResultados = window.calculadora._ultimosResultados || {};
        window.calculadora._ultimosResultados[tipo] = resultados;
    }

    return {
        carregarFormulario,
        obterDadosFormulario,
        limparFormulario,
        preencherResultados,
        getTipoFormularioAtual,
        setUltimosResultados
    };
})();
