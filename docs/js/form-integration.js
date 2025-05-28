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
        // Adiciona feedback visual de carregamento
        const listaEnsaios = document.querySelector('.lista-registros');
        if (listaEnsaios) listaEnsaios.classList.add('loading');

        try {
            // Potencial ponto de lentidão
            const registro = await window.calculadora.db.carregarRegistro(tipo, registroId);
            if (!registro) {
                exibirNotificacao(`Registro '${registroId}' não encontrado.`, 'error');
                return;
            }

            // Carrega o formulário correspondente (pode ser otimizado se já carregado)
            carregarFormulario(tipo);

            // Aguarda o formulário ser totalmente carregado no DOM e referências carregadas
            await new Promise(resolve => {
                const checkFormReady = () => {
                    const form = document.querySelector('#calculadora form');
                    const refsLoaded = tipo !== 'in-situ' || (form && !form.querySelector('#registro-densidade-real')?.disabled);
                    if (form && refsLoaded) {
                        resolve();
                    } else {
                        setTimeout(checkFormReady, 100);
                    }
                };
                checkFormReady();
            });

            const form = document.querySelector('#calculadora form');
            if (!form) {
                exibirNotificacao('Erro ao carregar o formulário para edição.', 'error');
                return;
            }

            // Função auxiliar para preencher input
            const fillInput = (selector, value) => {
                const el = form.querySelector(selector);
                if (el) {
                    // Trata data para formato YYYY-MM-DD
                    if (el.type === 'date' && value) {
                         try {
                            // Garante que a data seja interpretada corretamente, independente do fuso
                            const date = new Date(value);
                            const offset = date.getTimezoneOffset();
                            const adjustedDate = new Date(date.getTime() + (offset * 60 * 1000));
                            el.value = adjustedDate.toISOString().split('T')[0];
                         } catch(e) { 
                            console.warn(`Data inválida encontrada para ${selector}: ${value}`);
                            el.value = ''; 
                         }
                    } else {
                        el.value = (value !== null && value !== undefined) ? value : '';
                    }
                }
            };

            // Preenche informações gerais comuns
            const prefix = tipo === 'in-situ' ? '' : `-${tipo}`;
            const registroInput = form.querySelector(`#registro${prefix}`);
            fillInput(`#registro${prefix}`, registro.registro);
            // Torna o campo de registro readonly ao editar
            if (registroInput) {
                registroInput.readOnly = true;
                registroInput.title = 'O número do registro não pode ser alterado durante a edição.';
                registroInput.style.backgroundColor = '#eee'; // Estilo visual para indicar readonly
            }
            fillInput(`#data${prefix}`, registro.data);
            fillInput(`#operador${prefix}`, registro.operador);
            fillInput(`#material${prefix}`, registro.material);
            fillInput(`#origem${prefix}`, registro.origem);

            // Preenche campos específicos por tipo
            if (tipo === 'in-situ') {
                fillInput('#responsavel', registro.responsavel);
                fillInput('#verificador', registro.verificador);
                fillInput('#norte', registro.norte);
                fillInput('#este', registro.este);
                fillInput('#cota', registro.cota);
                fillInput('#quadrante', registro.quadrante);
                fillInput('#camada', registro.camada);
                fillInput('#hora', registro.hora);
                fillInput('#balanca', registro.balanca);
                fillInput('#estufa', registro.estufa);

                // Seleciona referências e atualiza dataset (já feito em carregarReferenciasInSitu, mas garante valor)
                const selectReal = form.querySelector('#registro-densidade-real');
                const selectMaxMin = form.querySelector('#registro-densidade-max-min');
                if (selectReal && registro.registroDensidadeReal) {
                    selectReal.value = registro.registroDensidadeReal;
                    // Atualiza dataset manualmente para garantir que está correto antes do cálculo
                    const selectedRealOption = selectReal.selectedOptions[0];
                    form.dataset.densidadeReal = selectedRealOption?.dataset.gs || '';
                    form.dataset.registroDensidadeReal = selectReal.value;
                }
                 if (selectMaxMin && registro.registroDensidadeMaxMin) {
                    selectMaxMin.value = registro.registroDensidadeMaxMin;
                    // Atualiza dataset manualmente
                    const selectedMaxMinOption = selectMaxMin.selectedOptions[0];
                    form.dataset.densidadeMax = selectedMaxMinOption?.dataset.gamadMax || '';
                    form.dataset.densidadeMin = selectedMaxMinOption?.dataset.gamadMin || '';
                    form.dataset.registroDensidadeMaxMin = selectMaxMin.value;
                }

                // Preenche tabelas - CORREÇÃO DO BUG DE DENSIDADE IN SITU
                // Garante que ambas as determinações sejam preenchidas corretamente
                for (let i = 0; i < 2; i++) {
                    const det = registro.determinacoesInSitu?.[i];
                    const index = i + 1;
                    fillInput(`#numero-cilindro-${index}`, det?.numeroCilindro ?? '');
                    fillInput(`#molde-solo-${index}`, det?.moldeSolo ?? '');
                    fillInput(`#molde-${index}`, det?.molde ?? '');
                    fillInput(`#volume-${index}`, det?.volume ?? '');
                }
                
                for (let i = 0; i < 3; i++) {
                    const detTopo = registro.determinacoesUmidadeTopo?.[i];
                    const index = i + 1;
                    fillInput(`#capsula-topo-${index}`, detTopo?.capsula ?? '');
                    fillInput(`#solo-umido-tara-topo-${index}`, detTopo?.soloUmidoTara ?? '');
                    fillInput(`#solo-seco-tara-topo-${index}`, detTopo?.soloSecoTara ?? '');
                    fillInput(`#tara-topo-${index}`, detTopo?.tara ?? '');
                }
                
                for (let i = 0; i < 3; i++) {
                    const detBase = registro.determinacoesUmidadeBase?.[i];
                    const index = i + 1;
                    fillInput(`#capsula-base-${index}`, detBase?.capsula ?? '');
                    fillInput(`#solo-umido-tara-base-${index}`, detBase?.soloUmidoTara ?? '');
                    fillInput(`#solo-seco-tara-base-${index}`, detBase?.soloSecoTara ?? '');
                    fillInput(`#tara-base-${index}`, detBase?.tara ?? '');
                }

            } else if (tipo === 'real') {
                 for (let i = 0; i < 3; i++) {
                    const detUmidade = registro.determinacoesUmidadeReal?.[i];
                    const index = i + 1;
                    fillInput(`#capsula-real-${index}`, detUmidade?.capsula ?? '');
                    fillInput(`#solo-umido-tara-real-${index}`, detUmidade?.soloUmidoTara ?? '');
                    fillInput(`#solo-seco-tara-real-${index}`, detUmidade?.soloSecoTara ?? '');
                    fillInput(`#tara-real-${index}`, detUmidade?.tara ?? '');
                 }
                 for (let i = 0; i < 2; i++) {
                    const detPic = registro.determinacoesPicnometro?.[i];
                    const index = i + 1;
                    fillInput(`#picnometro-${index}`, detPic?.picnometro ?? '');
                    fillInput(`#massa-pic-${index}`, detPic?.massaPic ?? '');
                    fillInput(`#massa-pic-amostra-agua-${index}`, detPic?.massaPicAmostraAgua ?? '');
                    fillInput(`#temperatura-${index}`, detPic?.temperatura ?? '');
                    fillInput(`#massa-pic-agua-${index}`, detPic?.massaPicAgua ?? '');
                    fillInput(`#massa-solo-umido-${index}`, detPic?.massaSoloUmido ?? '');
                 }

            } else if (tipo === 'max-min') {
                for (let i = 0; i < 3; i++) {
                    const detMax = registro.determinacoesMax?.[i];
                    const index = i + 1;
                    fillInput(`#numero-cilindro-max-${index}`, detMax?.numeroCilindro ?? '');
                    fillInput(`#molde-solo-max-${index}`, detMax?.moldeSolo ?? '');
                    fillInput(`#molde-max-${index}`, detMax?.molde ?? '');
                    fillInput(`#volume-max-${index}`, detMax?.volume ?? '');
                    fillInput(`#w-max-${index}`, detMax?.w ?? '');
                }
                for (let i = 0; i < 3; i++) {
                    const detMin = registro.determinacoesMin?.[i];
                    const index = i + 1;
                    fillInput(`#numero-cilindro-min-${index}`, detMin?.numeroCilindro ?? '');
                    fillInput(`#molde-solo-min-${index}`, detMin?.moldeSolo ?? '');
                    fillInput(`#molde-min-${index}`, detMin?.molde ?? '');
                    fillInput(`#volume-min-${index}`, detMin?.volume ?? '');
                    fillInput(`#w-min-${index}`, detMin?.w ?? '');
                }
            }

            // Dispara cálculo inicial para preencher campos calculados
            // Usar setTimeout para garantir que o DOM está pronto e os listeners de change dos selects já rodaram
            setTimeout(() => {
                window.calculadora.eventIntegration?.calcularAutomaticamente(tipo);
                exibirNotificacao(`Registro '${registroId}' carregado para edição.`, 'info');
            }, 150); // Pequeno delay

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

        const btnSalvar = form.querySelector('.btn-salvar');
        btnSalvar.disabled = true; // Desabilita botão durante salvamento
        btnSalvar.textContent = 'Salvando...';

        try {
            const dados = obterDadosFormulario(tipo);
            if (!dados) {
                exibirNotificacao('Não foi possível obter os dados do formulário para salvar.', 'error');
                return; // Já exibiu erro em obterDadosFormulario
            }

            // Validação básica (ex: registro obrigatório)
            if (!dados.registro) {
                exibirNotificacao('O campo "Registro" é obrigatório.', 'warning');
                const registroInput = form.querySelector(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`);
                registroInput?.focus();
                return;
            }

            // *** VALIDAÇÃO DE NOME DUPLICADO ***
            const registroInput = form.querySelector(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`);
            const isEditing = registroInput?.readOnly === true; // Verifica se está editando (campo registro bloqueado)

            if (!isEditing) { // Só verifica duplicidade se for um novo registro
                const existingRecord = await window.calculadora.db.carregarRegistro(tipo, dados.registro);
                if (existingRecord) {
                    exibirNotificacao(`Erro: Já existe um registro com o nome "${dados.registro}". Escolha outro nome.`, 'error');
                    registroInput?.focus();
                    return;
                }
            }
            // *** FIM DA VALIDAÇÃO ***

            // Adiciona/atualiza os resultados calculados aos dados a serem salvos
            const ultimosResultados = window.calculadora._ultimosResultados?.[tipo];
            if (ultimosResultados) {
                // Mescla resultados, garantindo que dados do form tenham precedência se recalculados
                Object.assign(dados, ultimosResultados);
            }

            await window.calculadora.db.salvarRegistro(tipo, dados);
            exibirNotificacao(`Registro "${dados.registro}" salvo com sucesso!`, 'success');

            // Opcional: Limpar formulário ou voltar para lista após salvar
            // limparFormulario();
            // window.calculadora.navigation?.mostrarLista(tipo); // Se existir módulo de navegação

            // Atualiza a lista de ensaios na interface (se visível)
            if (typeof window.atualizarListaEnsaios === 'function') {
                 window.atualizarListaEnsaios(tipo);
            }

        } catch (error) {
            console.error('Erro ao salvar registro:', error);
            exibirNotificacao(`Erro ao salvar registro: ${error.message || 'Verifique o console.'}`, 'error');
        } finally {
            btnSalvar.disabled = false; // Reabilita botão
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
        salvar, // Adicionada função salvar
        gerarPDF // Adicionada função gerarPDF
    };

})();

