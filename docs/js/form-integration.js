// cr-main/docs/js/form-integration.js
// Módulo de integração de formulários: fornece API para cálculos automáticos e coleta de dados
window.calculadora = window.calculadora || {};
window.calculadora.formIntegration = (function() {

    // Função auxiliar para obter valor de input, tratando erros
    function getInputValue(form, selector, type = 'string') {
        try {
            const element = form.querySelector(selector);
            if (!element) return type === 'number' ? null : '';
            const value = element.value?.trim();
            if (type === 'number') {
                // Tenta converter para número, retorna null se inválido ou vazio
                if (value === null || value === undefined || value === '') return null;
                const num = parseFloat(value);
                return isNaN(num) ? null : num;
            } else if (type === 'integer') {
                if (value === null || value === undefined || value === '') return null;
                const num = parseInt(value, 10);
                return isNaN(num) ? null : num;
            }
            return value || '';
        } catch (e) {
            console.error(`Erro ao obter valor para ${selector}:`, e);
            return type === 'number' ? null : '';
        }
    }

    // Função auxiliar para obter valores de uma tabela (linha específica)
    function getTableData(form, tableSelector, rowSelectors) {
        const data = {};
        for (const key in rowSelectors) {
            data[key] = getInputValue(form, `${tableSelector} ${rowSelectors[key]}`, 'number');
        }
        return data;
    }

    // Função auxiliar para obter valores de múltiplas determinações em tabelas
    function getMultipleDeterminations(form, baseId, count, fields, type = 'number') {
        const determinations = [];
        for (let i = 1; i <= count; i++) {
            const detData = {};
            let hasValue = false;
            for (const field in fields) {
                const value = getInputValue(form, `#${fields[field]}-${i}`, type);
                detData[field] = value;
                if (value !== null && value !== '') {
                    hasValue = true; // Marca se a determinação tem algum valor preenchido
                }
            }
            // Adiciona a determinação apenas se houver algum valor preenchido nela
            if (hasValue) {
                determinations.push(detData);
            }
        }
        return determinations;
    }

    // Se você definiu window.calculadora.templates = { 'in-situ': '...', 'real': '...', 'max-min': '...' }
    // ele será usado. Caso contrário, procuramos um <template id="template-in-situ">, etc.
    function getTemplateHTML(tipo) {
        if (window.calculadora.templates && window.calculadora.templates[tipo]) {
            return window.calculadora.templates[tipo];
        }
        const tpl = document.getElementById(`template-${tipo}`);
        return (tpl && tpl.innerHTML) ? tpl.innerHTML : null;
    }

    /**
     * Carrega o formulário da calculadora e dispara evento customizado
     * @param {'in-situ'|'real'|'max-min'} tipo
     */
    function carregarFormulario(tipo) {
        const container = document.getElementById('calculadora');
        if (!container) {
            console.error(`Container da calculadora não encontrado para tipo '${tipo}'`);
            return;
        }

        const html = getTemplateHTML(tipo);
        if (!html) {
            console.error(`Template para tipo '${tipo}' não encontrado.`);
            return;
        }

        container.innerHTML = html;
        const form = container.querySelector('form');
        if (!form) {
            console.error(`Formulário não encontrado após injeção de template para tipo '${tipo}'`);
            return;
        }

        // Adiciona um botão de voltar se não existir
        if (!form.querySelector('.btn-voltar')) {
            const btnVoltar = document.createElement('button');
            btnVoltar.type = 'button';
            btnVoltar.className = 'btn-voltar';
            btnVoltar.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar para Lista';
            // Adiciona o botão antes das ações
            const acoesDiv = form.querySelector('.acoes');
            if (acoesDiv) {
                form.insertBefore(btnVoltar, acoesDiv);
            }
        }

        // Carrega dados de referência se for 'in-situ'
        if (tipo === 'in-situ') {
            carregarReferenciasInSitu(form);
        }

        document.dispatchEvent(new CustomEvent('formLoaded', { detail: { form, tipo } }));
    }

    /**
     * Carrega opções para selects de referência no form 'in-situ'
     * Otimização: Considerar cache ou carregamento sob demanda se houver muitos registros.
     */
    async function carregarReferenciasInSitu(form) {
        const selectReal = form.querySelector('#registro-densidade-real');
        const selectMaxMin = form.querySelector('#registro-densidade-max-min');

        if (!selectReal || !selectMaxMin || !window.calculadora.db) return;

        // Adiciona indicador de carregamento
        selectReal.disabled = true;
        selectMaxMin.disabled = true;
        const loadingOption = new Option('Carregando...', '');
        loadingOption.disabled = true;
        selectReal.add(loadingOption.cloneNode(true));
        selectMaxMin.add(loadingOption.cloneNode(true));

        try {
            // Potencial ponto de lentidão se houver muitos registros
            const [registrosReal, registrosMaxMin] = await Promise.all([
                window.calculadora.db.listarRegistros('real'),
                window.calculadora.db.listarRegistros('max-min')
            ]);

            // Limpa selects existentes, exceto a opção padrão "Selecione"
            selectReal.length = 1;
            selectMaxMin.length = 1;

            registrosReal.forEach(reg => {
                if (reg.registro && reg.mediaDensidadeReal) {
                    const option = new Option(`${reg.registro} (Gs=${reg.mediaDensidadeReal.toFixed(3)})`, reg.registro);
                    option.dataset.gs = reg.mediaDensidadeReal;
                    selectReal.add(option);
                }
            });

            registrosMaxMin.forEach(reg => {
                if (reg.registro && reg.mediaGamadMax && reg.mediaGamadMin) {
                    const option = new Option(`${reg.registro} (γdmax=${reg.mediaGamadMax.toFixed(3)}, γdmin=${reg.mediaGamadMin.toFixed(3)})`, reg.registro);
                    option.dataset.gamadMax = reg.mediaGamadMax;
                    option.dataset.gamadMin = reg.mediaGamadMin;
                    selectMaxMin.add(option);
                }
            });

            // Adiciona listeners para atualizar dataset do form quando selecionado
            selectReal.addEventListener('change', (e) => {
                const selectedOption = e.target.selectedOptions[0];
                form.dataset.densidadeReal = selectedOption.dataset.gs || '';
                form.dataset.registroDensidadeReal = e.target.value;
                // Dispara cálculo automático se necessário
                window.calculadora.eventIntegration?.calcularAutomaticamente('in-situ');
            });
            selectMaxMin.addEventListener('change', (e) => {
                const selectedOption = e.target.selectedOptions[0];
                form.dataset.densidadeMax = selectedOption.dataset.gamadMax || '';
                form.dataset.densidadeMin = selectedOption.dataset.gamadMin || '';
                form.dataset.registroDensidadeMaxMin = e.target.value;
                // Dispara cálculo automático se necessário
                window.calculadora.eventIntegration?.calcularAutomaticamente('in-situ');
            });

        } catch (error) {
            console.error("Erro ao carregar referências:", error);
            exibirNotificacao('Erro ao carregar ensaios de referência.', 'error');
        } finally {
            // Remove indicador de carregamento e reabilita selects
            selectReal.disabled = false;
            selectMaxMin.disabled = false;
            if (selectReal.options[1]?.text === 'Carregando...') selectReal.remove(1);
            if (selectMaxMin.options[1]?.text === 'Carregando...') selectMaxMin.remove(1);
        }
    }

    /**
     * Extrai TODOS os dados do formulário para cálculo, salvamento ou PDF
     * @param {'in-situ'|'real'|'max-min'} tipo
     * @returns {object|null}
     */
    function obterDadosFormulario(tipo) {
        const form = document.querySelector('#calculadora form');
        if (!form) {
            console.error(`Formulário '${tipo}' não encontrado para obter dados.`);
            return null;
        }
        try {
            const dados = {};
            const prefix = tipo === 'in-situ' ? '' : `-${tipo}`;

            // Informações Gerais Comuns
            dados.registro = getInputValue(form, `#registro${prefix}`);
            dados.data = getInputValue(form, `#data${prefix}`);
            dados.operador = getInputValue(form, `#operador${prefix}`);
            dados.material = getInputValue(form, `#material${prefix}`);
            dados.origem = getInputValue(form, `#origem${prefix}`);

            if (tipo === 'in-situ') {
                // Informações Gerais Específicas In Situ
                dados.responsavel = getInputValue(form, '#responsavel');
                dados.verificador = getInputValue(form, '#verificador');
                dados.norte = getInputValue(form, '#norte', 'number');
                dados.este = getInputValue(form, '#este', 'number');
                dados.cota = getInputValue(form, '#cota', 'number');
                dados.quadrante = getInputValue(form, '#quadrante');
                dados.camada = getInputValue(form, '#camada');
                dados.hora = getInputValue(form, '#hora');

                // Dispositivos
                dados.balanca = getInputValue(form, '#balanca');
                dados.estufa = getInputValue(form, '#estufa');

                // Referências (obtidas do dataset do form, preenchido pelos selects)
                dados.registroDensidadeReal = form.dataset.registroDensidadeReal || '';
                dados.registroDensidadeMaxMin = form.dataset.registroDensidadeMaxMin || '';
                dados.refReal = parseFloat(form.dataset.densidadeReal) || null;
                dados.refMax  = parseFloat(form.dataset.densidadeMax) || null;
                dados.refMin = parseFloat(form.dataset.densidadeMin) || null;

                // Densidade In Situ - Determinações
                dados.determinacoesInSitu = getMultipleDeterminations(form, 'in-situ-det', 2, {
                    numeroCilindro: 'numero-cilindro', // Tipo string
                    moldeSolo: 'molde-solo', // Tipo number
                    molde: 'molde', // Tipo number
                    volume: 'volume' // Tipo number
                }, 'any'); // 'any' para tratar string e number
                // Ajusta tipos após leitura
                dados.determinacoesInSitu.forEach(det => {
                    det.numeroCilindro = String(det.numeroCilindro || '');
                    det.moldeSolo = parseFloat(det.moldeSolo) || null;
                    det.molde = parseFloat(det.molde) || null;
                    det.volume = parseFloat(det.volume) || null;
                });


                // Teor de Umidade Topo
                dados.determinacoesUmidadeTopo = getMultipleDeterminations(form, 'umidade-topo-det', 3, {
                    capsula: 'capsula-topo', // Tipo string
                    soloUmidoTara: 'solo-umido-tara-topo',
                    soloSecoTara: 'solo-seco-tara-topo',
                    tara: 'tara-topo'
                }, 'any'); // 'any' para tratar string e number
                 // Ajusta tipos após leitura
                 dados.determinacoesUmidadeTopo.forEach(det => {
                    det.capsula = String(det.capsula || '');
                    det.soloUmidoTara = parseFloat(det.soloUmidoTara) || null;
                    det.soloSecoTara = parseFloat(det.soloSecoTara) || null;
                    det.tara = parseFloat(det.tara) || null;
                });

                // Teor de Umidade Base
                dados.determinacoesUmidadeBase = getMultipleDeterminations(form, 'umidade-base-det', 3, {
                    capsula: 'capsula-base', // Tipo string
                    soloUmidoTara: 'solo-umido-tara-base',
                    soloSecoTara: 'solo-seco-tara-base',
                    tara: 'tara-base'
                }, 'any'); // 'any' para tratar string e number
                 // Ajusta tipos após leitura
                 dados.determinacoesUmidadeBase.forEach(det => {
                    det.capsula = String(det.capsula || '');
                    det.soloUmidoTara = parseFloat(det.soloUmidoTara) || null;
                    det.soloSecoTara = parseFloat(det.soloSecoTara) || null;
                    det.tara = parseFloat(det.tara) || null;
                });

            } else if (tipo === 'real') {
                // Teor de Umidade
                dados.determinacoesUmidadeReal = getMultipleDeterminations(form, 'umidade-real-det', 3, {
                    capsula: 'capsula-real', // Tipo string
                    soloUmidoTara: 'solo-umido-tara-real',
                    soloSecoTara: 'solo-seco-tara-real',
                    tara: 'tara-real'
                }, 'any');
                 // Ajusta tipos após leitura
                 dados.determinacoesUmidadeReal.forEach(det => {
                    det.capsula = String(det.capsula || '');
                    det.soloUmidoTara = parseFloat(det.soloUmidoTara) || null;
                    det.soloSecoTara = parseFloat(det.soloSecoTara) || null;
                    det.tara = parseFloat(det.tara) || null;
                });

                // Picnômetro
                dados.determinacoesPicnometro = getMultipleDeterminations(form, 'picnometro-det', 2, {
                    picnometro: 'picnometro', // Tipo string
                    massaPic: 'massa-pic',
                    massaPicAmostraAgua: 'massa-pic-amostra-agua',
                    temperatura: 'temperatura',
                    massaPicAgua: 'massa-pic-agua',
                    massaSoloUmido: 'massa-solo-umido'
                }, 'any');
                 // Ajusta tipos após leitura
                 dados.determinacoesPicnometro.forEach(det => {
                    det.picnometro = String(det.picnometro || '');
                    det.massaPic = parseFloat(det.massaPic) || null;
                    det.massaPicAmostraAgua = parseFloat(det.massaPicAmostraAgua) || null;
                    det.temperatura = parseFloat(det.temperatura) || null;
                    det.massaPicAgua = parseFloat(det.massaPicAgua) || null;
                    det.massaSoloUmido = parseFloat(det.massaSoloUmido) || null;
                });

            } else if (tipo === 'max-min') {
                // Densidade Máxima
                dados.determinacoesMax = getMultipleDeterminations(form, 'densidade-max-det', 3, {
                    numeroCilindro: 'numero-cilindro-max', // Tipo string
                    moldeSolo: 'molde-solo-max',
                    molde: 'molde-max',
                    volume: 'volume-max',
                    w: 'w-max' // Umidade
                }, 'any');
                 // Ajusta tipos após leitura
                 dados.determinacoesMax.forEach(det => {
                    det.numeroCilindro = String(det.numeroCilindro || '');
                    det.moldeSolo = parseFloat(det.moldeSolo) || null;
                    det.molde = parseFloat(det.molde) || null;
                    det.volume = parseFloat(det.volume) || null;
                    det.w = parseFloat(det.w) || null;
                });

                // Densidade Mínima
                dados.determinacoesMin = getMultipleDeterminations(form, 'densidade-min-det', 3, {
                    numeroCilindro: 'numero-cilindro-min', // Tipo string
                    moldeSolo: 'molde-solo-min',
                    molde: 'molde-min',
                    volume: 'volume-min',
                    w: 'w-min' // Umidade
                }, 'any');
                 // Ajusta tipos após leitura
                 dados.determinacoesMin.forEach(det => {
                    det.numeroCilindro = String(det.numeroCilindro || '');
                    det.moldeSolo = parseFloat(det.moldeSolo) || null;
                    det.molde = parseFloat(det.molde) || null;
                    det.volume = parseFloat(det.volume) || null;
                    det.w = parseFloat(det.w) || null;
                });
            }

            // Adiciona os resultados calculados (se existirem)
            const ultimosResultados = window.calculadora._ultimosResultados?.[tipo];
            if (ultimosResultados) {
                // Copia apenas as propriedades de resultado relevantes para evitar redundância
                const resultadosChaves = Object.keys(ultimosResultados).filter(k => 
                    !k.startsWith('determinacoes') && // Exclui arrays de determinações
                    k !== 'status' // Exclui status que pode ser recalculado
                );
                resultadosChaves.forEach(key => {
                    dados[key] = ultimosResultados[key];
                });
            }

            return dados;

        } catch (err) {
            console.error('Erro ao obter dados completos do formulário:', err);
            exibirNotificacao('Erro ao ler dados do formulário. Verifique o console.', 'error');
            return null;
        }
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

        // Função auxiliar para preencher input
        const fillInput = (selector, value, precision) => {
            const el = form.querySelector(selector);
            if (el) {
                if (typeof value === 'number' && !isNaN(value)) {
                    el.value = value.toFixed(precision);
                } else if (value !== null && value !== undefined) {
                    el.value = value; // Para strings ou outros tipos
                } else {
                    el.value = ''; // Limpa se for null, undefined ou NaN
                }
            }
        };

        // Limpa campos de resultado antes de preencher
        form.querySelectorAll('input[readonly]').forEach(el => {
             // Verifica se o ID contém 'resultado' ou é um campo calculado comum
             const id = el.id.toLowerCase();
             const isCalculatedField = id.includes('solo-') || id.includes('agua-') || id.includes('umidade-') || id.includes('gama-') || id.includes('gamad-') || id.includes('gamas-') || id.includes('indice-vazios') || id.includes('cr-') || id.includes('media-') || id.includes('diferenca-') || id.includes('densidade-agua') || id.includes('massa-solo-seco') || id.includes('densidade-real');
             if (isCalculatedField) {
                 el.value = '';
             }
        });
        const statusEl = form.querySelector('#status-ensaio');
        if (statusEl) statusEl.textContent = 'AGUARDANDO CÁLCULO';

        if (!resultados) {
            setUltimosResultados(tipo, null); // Limpa resultados armazenados se não houver novos
            return;
        }

        // Armazena os resultados para uso posterior (ex: salvar, gerar PDF)
        setUltimosResultados(tipo, resultados);

        // Preenche campos calculados nas tabelas
        if (tipo === 'in-situ') {
            resultados.determinacoesInSitu?.forEach((det, i) => {
                const index = i + 1;
                fillInput(`#solo-${index}`, det.solo, 1);
                fillInput(`#gama-nat-um-${index}`, det.gamaNat, 3);
                fillInput(`#gama-nat-${index}`, det.gammaS, 3);
            });

            resultados.determinacoesUmidadeTopo?.forEach((det, i) => {
                const index = i + 1;
                fillInput(`#solo-seco-topo-${index}`, det.soloSeco, 1);
                fillInput(`#agua-topo-${index}`, det.agua, 1);
                fillInput(`#umidade-topo-${index}`, det.umidade, 1);
            });

            resultados.determinacoesUmidadeBase?.forEach((det, i) => {
                const index = i + 1;
                fillInput(`#solo-seco-base-${index}`, det.soloSeco, 1);
                fillInput(`#agua-base-${index}`, det.agua, 1);
                fillInput(`#umidade-base-${index}`, det.umidade, 1);
            });

            fillInput('#umidade-media-topo', resultados.umidadeMediaTopo, 1);
            fillInput('#umidade-media-base', resultados.umidadeMediaBase, 1);
            fillInput('#gama-nat-m', resultados.gammaSMedia, 3);

            // Resultados Finais In Situ
            fillInput('#gamad-topo', resultados.gamadTopo, 3);
            fillInput('#gamad-base', resultados.gamadBase, 3);
            fillInput('#indice-vazios-topo', resultados.indiceVaziosTopo ?? '', 2);
            fillInput('#indice-vazios-base', resultados.indiceVaziosBase ?? '', 2);

            if (resultados.compacidadeRelativa && typeof resultados.compacidadeRelativa.topo === 'number') {
                fillInput('#cr-topo', resultados.compacidadeRelativa.topo, 1);
            } else {
                fillInput('#cr-topo', '', 1);
            }
            if (resultados.compacidadeRelativa && typeof resultados.compacidadeRelativa.base === 'number') {
                fillInput('#cr-base', resultados.compacidadeRelativa.base, 1);
            } else {
                fillInput('#cr-base', '', 1);
            }

            if (statusEl) statusEl.textContent = resultados.status || 'CALCULADO';

        } else if (tipo === 'real') {
            resultados.determinacoesUmidadeReal?.forEach((det, i) => {
                const index = i + 1;
                fillInput(`#solo-seco-real-${index}`, det.soloSeco, 1);
                fillInput(`#agua-real-${index}`, det.agua, 1);
                fillInput(`#umidade-real-${index}`, det.umidade, 1);
            });
            fillInput('#umidade-media-real', resultados.umidadeMedia, 1);

            resultados.determinacoesPicnometro?.forEach((det, i) => {
                const index = i + 1;
                fillInput(`#densidade-agua-${index}`, det.densidadeAgua, 4);
                fillInput(`#massa-solo-seco-${index}`, det.massaSoloSeco, 1);
                fillInput(`#densidade-real-${index}`, det.densidadeReal, 3);
            });

            // Resultados Finais Real
            fillInput('#diferenca-real', resultados.diferenca, 1);
            fillInput('#media-densidade-real', resultados.mediaDensidadeReal, 3);

        } else if (tipo === 'max-min') {
            resultados.determinacoesMax?.forEach((det, i) => {
                const index = i + 1;
                fillInput(`#solo-max-${index}`, det.solo, 1);
                fillInput(`#gamaNat-max-${index}`, det.gamaNat, 3);
                fillInput(`#gamad-max-${index}`, det.gamad, 3);
            });
            resultados.determinacoesMin?.forEach((det, i) => {
                const index = i + 1;
                fillInput(`#solo-min-${index}`, det.solo, 1);
                fillInput(`#gamaNat-min-${index}`, det.gamaNat, 3);
                fillInput(`#gamad-min-${index}`, det.gamad, 3);
            });

            // Resultados Finais Max/Min
            fillInput('#gamad-max', resultados.mediaGamadMax, 3);
            fillInput('#gamad-min', resultados.mediaGamadMin, 3);
        }
    }

    /**
     * Limpa todos os campos do formulário atual
     */
    function limparFormulario() {
        const form = document.querySelector('#calculadora form');
        if (form) {
            const tipo = getTipoFormularioAtual();
            const registroInput = form.querySelector(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`);
            
            form.reset(); // Reseta o formulário para valores padrão
            // Limpa campos readonly que não são resetados
            form.querySelectorAll('input[readonly]').forEach(el => el.value = '');
            // Limpa selects de referência e dataset
            const selectReal = form.querySelector('#registro-densidade-real');
            const selectMaxMin = form.querySelector('#registro-densidade-max-min');
            if(selectReal) selectReal.selectedIndex = 0;
            if(selectMaxMin) selectMaxMin.selectedIndex = 0;
            delete form.dataset.densidadeReal;
            delete form.dataset.registroDensidadeReal;
            delete form.dataset.densidadeMax;
            delete form.dataset.densidadeMin;
            delete form.dataset.registroDensidadeMaxMin;
            // Limpa resultados armazenados
            if (tipo) {
                setUltimosResultados(tipo, null);
            }
            // Limpa status
            const statusEl = form.querySelector('#status-ensaio');
            if (statusEl) statusEl.textContent = 'AGUARDANDO CÁLCULO';
            
            // Reabilita campo registro se estava readonly
            if (registroInput) {
                registroInput.readOnly = false;
                registroInput.title = '';
                registroInput.style.backgroundColor = '';
            }
            
            // Foca no primeiro campo editável
            const firstInput = form.querySelector('input:not([readonly]):not([type="hidden"]):not([type="button"]):not([type="submit"])');
            firstInput?.focus();
            exibirNotificacao('Formulário limpo.', 'info');
        }
    }

    /**
     * Obtém o tipo do formulário atualmente carregado na aba 'calculadora'
     * @returns {'in-situ'|'real'|'max-min'|null}
     */
    function getTipoFormularioAtual() {
        const form = document.querySelector('#calculadora form');
        if (!form) return null;
        // Tenta identificar pelo ID de um campo chave
        if (form.querySelector('#registro')) return 'in-situ';
        if (form.querySelector('#registro-real')) return 'real';
        if (form.querySelector('#registro-max-min')) return 'max-min';
        // Fallback pela H2 (menos confiável)
        const h2 = form.closest('#calculadora')?.querySelector('h2');
        if (h2) {
            const texto = h2.textContent.toLowerCase();
            if (texto.includes('in situ')) return 'in-situ';
            if (texto.includes('real')) return 'real';
            if (texto.includes('máxima e mínima')) return 'max-min';
        }
        return null;
    }

    /**
      * Exibe uma notificação toast.
      * @param {string} message A mensagem a ser exibida.
      * @param {'success'|'error'|'info'|'warning'} type O tipo de notificação.
      * @param {number} duration Duração em milissegundos.
      */
    function exibirNotificacao(message, type = 'info', duration = 3000) {
        // Tenta usar uma função global showToast se existir (ex: de uma lib de UI)
        if (typeof window.showToast === 'function') {
            window.showToast(message, type, duration);
        } else {
            // Fallback simples com console.log e alert para erros
            console.log(`Notificação (${type}): ${message}`);
            if (type === 'error') {
                alert(`ERRO: ${message}`);
            }
        }
    }

    /**
     * Carrega um registro existente para edição no formulário.
     * @param {'in-situ'|'real'|'max-min'} tipo
     * @param {string} registroId O ID do registro a ser carregado.
     */
    async function carregarRegistroParaEdicao(tipo, registroId) {
        if (!window.calculadora.db) {
            exibirNotificacao('Erro: Módulo de banco de dados não disponível.', 'error');
            return;
        }

        console.log(`Carregando registro '${registroId}' do tipo '${tipo}' para edição...`);
        const listaEnsaios = document.querySelector('.lista-registros');
        if (listaEnsaios) listaEnsaios.classList.add('loading');

        try {
            // busca o objeto salvo no IndexedDB
            const registro = await window.calculadora.db.carregarRegistro(tipo, registroId);
            if (!registro) {
                exibirNotificacao(`Registro '${registroId}' não encontrado.`, 'error');
                return;
            }

            // injeta o template/form adequado
            window.calculadora.formIntegration.carregarFormulario(tipo);

            // espera o form e os selects de referência ficarem disponíveis e habilitados
            await new Promise(resolve => {
                const checkReady = () => {
                    const form = document.querySelector('#calculadora form');
                    const refsLoaded = tipo !== 'in-situ'
                        || (form
                            && form.querySelector('#registro-densidade-real')?.options.length > 1
                            && form.querySelector('#registro-densidade-max-min')?.options.length > 1
                        );
                    if (form && refsLoaded) return resolve();
                    setTimeout(checkReady, 50);
                };
                checkReady();
            });

            const form = document.querySelector('#calculadora form');
            if (!form) {
                exibirNotificacao('Erro ao carregar o formulário para edição.', 'error');
                return;
            }

            // === 1) Preenche todos os campos estáticos ===
            const prefix = tipo === 'in-situ' ? '' : `-${tipo}`;
            const fill = (sel, v) => {
                const el = form.querySelector(sel);
                if (el) el.value = v ?? '';
            };

            fill(`#registro${prefix}`, registro.registro);
            fill(`#data${prefix}`, registro.data);
            fill(`#operador${prefix}`, registro.operador);
            fill(`#material${prefix}`, registro.material);
            fill(`#origem${prefix}`, registro.origem);

            if (tipo === 'in-situ') {
                // campos in-situ
                ['responsavel', 'verificador', 'norte', 'este', 'cota', 'quadrante', 'camada', 'hora', 'balanca', 'estufa']
                    .forEach(id => fill(`#${id}`, registro[id]));

                // preenche as determinações salvas:
                registro.determinacoesInSitu?.forEach((d, i) => {
                    const idx = i + 1;
                    fill(`#numero-cilindro-${idx}`, d.numeroCilindro);
                    fill(`#molde-solo-${idx}`, d.moldeSolo);
                    fill(`#molde-${idx}`, d.molde);
                    fill(`#volume-${idx}`, d.volume);
                });
                registro.determinacoesUmidadeTopo?.forEach((d, i) => {
                    const idx = i + 1;
                    fill(`#capsula-topo-${idx}`, d.capsula);
                    fill(`#solo-umido-tara-topo-${idx}`, d.soloUmidoTara);
                    fill(`#solo-seco-tara-topo-${idx}`, d.soloSecoTara);
                    fill(`#tara-topo-${idx}`, d.tara);
                });
                registro.determinacoesUmidadeBase?.forEach((d, i) => {
                    const idx = i + 1;
                    fill(`#capsula-base-${idx}`, d.capsula);
                    fill(`#solo-umido-tara-base-${idx}`, d.soloUmidoTara);
                    fill(`#solo-seco-tara-base-${idx}`, d.soloSecoTara);
                    fill(`#tara-base-${idx}`, d.tara);
                });
            }
            else if (tipo === 'real') {
                registro.determinacoesUmidadeReal?.forEach((d, i) => {
                    const idx = i + 1;
                    fill(`#capsula-real-${idx}`, d.capsula);
                    fill(`#solo-umido-tara-real-${idx}`, d.soloUmidoTara);
                    fill(`#solo-seco-tara-real-${idx}`, d.soloSecoTara);
                    fill(`#tara-real-${idx}`, d.tara);
                });
                registro.determinacoesPicnometro?.forEach((d, i) => {
                    const idx = i + 1;
                    fill(`#picnometro-${idx}`, d.picnometro);
                    fill(`#massa-pic-${idx}`, d.massaPic);
                    fill(`#massa-pic-amostra-agua-${idx}`, d.massaPicAmostraAgua);
                    fill(`#temperatura-${idx}`, d.temperatura);
                    fill(`#massa-pic-agua-${idx}`, d.massaPicAgua);
                    fill(`#massa-solo-umido-${idx}`, d.massaSoloUmido);
                });
            }
            else if (tipo === 'max-min') {
                registro.determinacoesMax?.forEach((d, i) => {
                    const idx = i + 1;
                    fill(`#numero-cilindro-max-${idx}`, d.numeroCilindro);
                    fill(`#molde-solo-max-${idx}`, d.moldeSolo);
                    fill(`#molde-max-${idx}`, d.molde);
                    fill(`#volume-max-${idx}`, d.volume);
                    fill(`#w-max-${idx}`, d.w);
                });
                registro.determinacoesMin?.forEach((d, i) => {
                    const idx = i + 1;
                    fill(`#numero-cilindro-min-${idx}`, d.numeroCilindro);
                    fill(`#molde-solo-min-${idx}`, d.moldeSolo);
                    fill(`#molde-min-${idx}`, d.molde);
                    fill(`#volume-min-${idx}`, d.volume);
                    fill(`#w-min-${idx}`, d.w);
                });
            }

            // === 2) Injeta as referências salvas no dataset e nos selects ===
            if (tipo === 'in-situ') {
                form.querySelector('#registro-densidade-real').value = registro.registroDensidadeReal || '';
                form.querySelector('#registro-densidade-max-min').value = registro.registroDensidadeMaxMin || '';

                form.dataset.densidadeReal = registro.mediaDensidadeReal ?? form.dataset.densidadeReal;
                form.dataset.densidadeMax = registro.mediaGamadMax ?? form.dataset.densidadeMax;
                form.dataset.densidadeMin = registro.mediaGamadMin ?? form.dataset.densidadeMin;
                form.dataset.registroDensidadeReal = registro.registroDensidadeReal ?? form.dataset.registroDensidadeReal;
                form.dataset.registroDensidadeMaxMin = registro.registroDensidadeMaxMin ?? form.dataset.registroDensidadeMaxMin;
            }

            // === 3) Exibe imediatamente os resultados que estavam salvos ===
            preencherResultados(tipo, registro);

            // === 4) Dispara o recálculo automático para atualizar ou manter tudo ===
            setTimeout(() => {
                window.calculadora.eventIntegration?.calcularAutomaticamente(tipo);
                exibirNotificacao(`Registro '${registroId}' carregado para edição.`, 'info');
            }, 150);

        } catch (error) {
            console.error(`Erro ao carregar registro '${registroId}' para edição:`, error);
            exibirNotificacao('Erro ao carregar dados do registro.', 'error');
        } finally {
            if (listaEnsaios) listaEnsaios.classList.remove('loading');
        }
    }


    /**
     * Salva os dados do formulário atual no banco de dados.
     * @param {'in-situ'|'real'|'max-min'} tipo
     */
    async function salvar(tipo) {
        if (!window.calculadora.db) {
            exibirNotificacao('Erro: Módulo de banco de dados não disponível.', 'error');
            return;
        }
        const form = document.querySelector('#calculadora form');
        if (!form) {
            exibirNotificacao('Erro: Formulário não encontrado.', 'error');
            return;
        }

        // 1) Força atualização do dataset com os selects de referência
        if (tipo === 'in-situ') {
            const selReal = form.querySelector('#registro-densidade-real');
            const selMaxMin = form.querySelector('#registro-densidade-max-min');

            if (selReal && selReal.selectedOptions.length) {
                form.dataset.densidadeReal = selReal.selectedOptions[0].dataset.gs || '';
                form.dataset.registroDensidadeReal = selReal.value;
            }
            if (selMaxMin && selMaxMin.selectedOptions.length) {
                form.dataset.densidadeMax = selMaxMin.selectedOptions[0].dataset.gamadMax || '';
                form.dataset.densidadeMin = selMaxMin.selectedOptions[0].dataset.gamadMin || '';
                form.dataset.registroDensidadeMaxMin = selMaxMin.value;
            }
        }

        // 2) Desabilita o botão enquanto salva
        const btnSalvar = form.querySelector('.btn-salvar');
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando…';

        try {
            // 3) Extrai dados, agora com refReal/refMax/refMin corretos
            const dados = obterDadosFormulario(tipo);
            if (!dados) return; // já mostrou erro em obterDadosFormulario

            // Validação simples
            if (!dados.registro) {
                exibirNotificacao('O campo "Registro" é obrigatório.', 'warning');
                form.querySelector(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`)?.focus();
                return;
            }

            // 4) Salvamento no IndexedDB
            await window.calculadora.db.salvarRegistro(tipo, dados);
            exibirNotificacao(`Registro "${dados.registro}" salvo com sucesso!`, 'success');

            // Atualiza lista se existir função global
            if (typeof window.atualizarListaEnsaios === 'function') {
                window.atualizarListaEnsaios(tipo);
            }
        } catch (error) {
            console.error('Erro ao salvar registro:', error);
            exibirNotificacao(`Erro ao salvar registro: ${error.message}`, 'error');
        } finally {
            // 5) Reabilita botão
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar';
        }
    }


    /**
     * Gera o PDF para o formulário atual.
     * @param {'in-situ'|'real'|'max-min'} tipo
     */
    function gerarPDF(tipo) {
        if (!window.calculadora.pdfGenerator) {
            exibirNotificacao('Erro: Módulo de geração de PDF não disponível.', 'error');
            return;
        }

        const form = document.querySelector('#calculadora form');
        if (!form) {
            exibirNotificacao('Erro: Formulário não encontrado.', 'error');
            return;
        }
        
        const btnGerarPDF = form.querySelector('.btn-gerar-pdf');
        btnGerarPDF.disabled = true;
        btnGerarPDF.textContent = 'Gerando...';

        try {
            const dados = obterDadosFormulario(tipo);
            if (!dados) {
                exibirNotificacao('Não foi possível obter os dados do formulário para gerar o PDF.', 'error');
                return;
            }

            // Adiciona resultados calculados se não foram incluídos em obterDadosFormulario
             const ultimosResultados = window.calculadora._ultimosResultados?.[tipo];
             if (ultimosResultados) {
                 Object.assign(dados, ultimosResultados);
             }

            console.log("Dados para PDF:", dados);
            window.calculadora.pdfGenerator.gerarPDF(tipo, dados);
            exibirNotificacao('PDF gerado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            exibirNotificacao(`Erro ao gerar PDF: ${error.message || 'Verifique o console.'}`, 'error');
        } finally {
             btnGerarPDF.disabled = false;
             btnGerarPDF.textContent = 'Gerar PDF';
        }
    }

    // API pública
    return {
        carregarFormulario,
        obterDadosFormulario,
        preencherResultados,
        limparFormulario,
        exibirNotificacao,
        carregarRegistroParaEdicao,
        salvar,
        gerarPDF,
        // exposições adicionais
        getTipoFormularioAtual,
        setUltimosResultados
    };


})();

