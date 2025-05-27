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
     */
    async function carregarReferenciasInSitu(form) {
        const selectReal = form.querySelector('#registro-densidade-real');
        const selectMaxMin = form.querySelector('#registro-densidade-max-min');

        if (!selectReal || !selectMaxMin || !window.calculadora.db) return;

        try {
            const [registrosReal, registrosMaxMin] = await Promise.all([
                window.calculadora.db.listarRegistros('real'),
                window.calculadora.db.listarRegistros('max-min')
            ]);

            // Limpa selects existentes, exceto a opção padrão
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
                window.calculadora.calculos?.calcularAutomaticamente('in-situ');
            });
            selectMaxMin.addEventListener('change', (e) => {
                const selectedOption = e.target.selectedOptions[0];
                form.dataset.densidadeMax = selectedOption.dataset.gamadMax || '';
                form.dataset.densidadeMin = selectedOption.dataset.gamadMin || '';
                form.dataset.registroDensidadeMaxMin = e.target.value;
                // Dispara cálculo automático se necessário
                window.calculadora.calculos?.calcularAutomaticamente('in-situ');
            });

        } catch (error) {
            console.error("Erro ao carregar referências:", error);
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
                dados.densidadeRealRef = parseFloat(form.dataset.densidadeReal) || null;
                dados.gamadMaxRef = parseFloat(form.dataset.densidadeMax) || null;
                dados.gamadMinRef = parseFloat(form.dataset.densidadeMin) || null;

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
                const resultadosChaves = Object.keys(ultimosResultados).filter(k => k !== 'determinacoesInSitu' && k !== 'determinacoesUmidadeTopo' && k !== 'determinacoesUmidadeBase' && k !== 'determinacoesUmidadeReal' && k !== 'determinacoesPicnometro' && k !== 'determinacoesMax' && k !== 'determinacoesMin');
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
             const isCalculatedField = id.includes('solo-') || id.includes('agua-') || id.includes('umidade-') || id.includes('gama-') || id.includes('gamad-') || id.includes('gamas-') || id.includes('indice-vazios') || id.includes('cr-') || id.includes('media-') || id.includes('diferenca-');
             if (isCalculatedField) {
                 el.value = '';
             }
        });
        const statusEl = form.querySelector('#status-ensaio');
        if (statusEl) statusEl.textContent = 'AGUARDANDO CÁLCULO';

        if (!resultados) return;

        // Preenche campos calculados nas tabelas
        if (tipo === 'in-situ') {
            resultados.determinacoesInSitu?.forEach((det, i) => {
                fillInput(`#solo-${i + 1}`, det.solo, 1);
                fillInput(`#gama-nat-um-${i + 1}`, det.gamaNatUm, 3); // Assumindo que gamaNatUm é calculado
                fillInput(`#gama-nat-${i + 1}`, det.gamaNat, 3);
            });
            resultados.determinacoesUmidadeTopo?.forEach((det, i) => {
                fillInput(`#solo-seco-topo-${i + 1}`, det.soloSeco, 1);
                fillInput(`#agua-topo-${i + 1}`, det.agua, 1);
                fillInput(`#umidade-topo-${i + 1}`, det.umidade, 1);
            });
            resultados.determinacoesUmidadeBase?.forEach((det, i) => {
                fillInput(`#solo-seco-base-${i + 1}`, det.soloSeco, 1);
                fillInput(`#agua-base-${i + 1}`, det.agua, 1);
                fillInput(`#umidade-base-${i + 1}`, det.umidade, 1);
            });
            fillInput('#umidade-media-topo', resultados.umidadeMediaTopo, 1);
            fillInput('#umidade-media-base', resultados.umidadeMediaBase, 1);
            fillInput('#gama-nat', resultados.gamaNatMedio, 3); // Preenche o campo gama-nat médio

            // Resultados Finais In Situ
            fillInput('#gamad-topo', resultados.gamadTopo, 3);
            fillInput('#gamad-base', resultados.gamadBase, 3);
            fillInput('#indice-vazios-topo', resultados.indiceVaziosTopo, 3);
            fillInput('#indice-vazios-base', resultados.indiceVaziosBase, 3);
            fillInput('#cr-topo', resultados.crTopo, 1);
            fillInput('#cr-base', resultados.crBase, 1);
            if (statusEl) statusEl.textContent = resultados.status || 'N/A';

        } else if (tipo === 'real') {
            resultados.determinacoesUmidadeReal?.forEach((det, i) => {
                fillInput(`#solo-seco-real-${i + 1}`, det.soloSeco, 1);
                fillInput(`#agua-real-${i + 1}`, det.agua, 1);
                fillInput(`#umidade-real-${i + 1}`, det.umidade, 1);
            });
            fillInput('#umidade-media-real', resultados.umidadeMedia, 1);

            resultados.determinacoesPicnometro?.forEach((det, i) => {
                fillInput(`#densidade-agua-${i + 1}`, det.densidadeAgua, 4);
                fillInput(`#massa-solo-seco-${i + 1}`, det.massaSoloSeco, 1);
                fillInput(`#densidade-real-${i + 1}`, det.densidadeReal, 3);
            });

            // Resultados Finais Real
            fillInput('#diferenca-real', resultados.diferenca, 1);
            fillInput('#media-densidade-real', resultados.mediaDensidadeReal, 3);

        } else if (tipo === 'max-min') {
            resultados.determinacoesMax?.forEach((det, i) => {
                fillInput(`#solo-max-${i + 1}`, det.solo, 1);
                fillInput(`#gamad-max-${i + 1}`, det.gamad, 3);
                fillInput(`#gamas-max-${i + 1}`, det.gamas, 3);
            });
            resultados.determinacoesMin?.forEach((det, i) => {
                fillInput(`#solo-min-${i + 1}`, det.solo, 1);
                fillInput(`#gamad-min-${i + 1}`, det.gamad, 3);
                fillInput(`#gamas-min-${i + 1}`, det.gamas, 3);
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
            const tipo = getTipoFormularioAtual();
            if (tipo) {
                setUltimosResultados(tipo, null);
            }
            // Limpa status
            const statusEl = form.querySelector('#status-ensaio');
            if (statusEl) statusEl.textContent = 'AGUARDANDO CÁLCULO';
            // Foca no primeiro campo editável
            const firstInput = form.querySelector('input:not([readonly]):not([type="hidden"])');
            firstInput?.focus();
            exibirNotificacao('Formulário limpo.', 'info');
        }
    }

    /**
     * Obtém o tipo do formulário atualmente carregado na aba 'calculadora'
     * @returns {'in-situ'|'real'|'max-min'|null}
     */
    function getTipoFormularioAtual() {
        const h2 = document.querySelector('#calculadora h2');
        if (!h2) return null;
        const texto = h2.textContent.toLowerCase();
        if (texto.includes('in situ')) return 'in-situ';
        if (texto.includes('real')) return 'real';
        if (texto.includes('máxima e mínima')) return 'max-min';
        return null;
    }

    /**
      * Exibe uma notificação toast.
      * @param {string} message A mensagem a ser exibida.
      * @param {'success'|'error'|'info'} type O tipo de notificação.
      * @param {number} duration Duração em milissegundos.
      */
    function exibirNotificacao(message, type = 'info', duration = 3000) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type, duration);
        } else {
            // Fallback caso a função showToast não esteja disponível
            alert(`${type.toUpperCase()}: ${message}`);
            console.log(`Toast (${type}): ${message}`);
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

        try {
            const registro = await window.calculadora.db.carregarRegistro(tipo, registroId);
            if (!registro) {
                exibirNotificacao(`Registro '${registroId}' não encontrado.`, 'error');
                return;
            }

            // Carrega o formulário correspondente
            carregarFormulario(tipo);

            // Aguarda o formulário ser totalmente carregado no DOM
            await new Promise(resolve => setTimeout(resolve, 100));

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
                            el.value = new Date(value).toISOString().split('T')[0];
                         } catch(e) { el.value = ''; }
                    } else {
                        el.value = (value !== null && value !== undefined) ? value : '';
                    }
                }
            };

            // Preenche informações gerais comuns
            const prefix = tipo === 'in-situ' ? '' : `-${tipo}`;
            fillInput(`#registro${prefix}`, registro.registro);
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

                // Seleciona referências e atualiza dataset
                const selectReal = form.querySelector('#registro-densidade-real');
                const selectMaxMin = form.querySelector('#registro-densidade-max-min');
                if (selectReal && registro.registroDensidadeReal) {
                    selectReal.value = registro.registroDensidadeReal;
                    // Dispara evento change para atualizar dataset e recalcular se necessário
                    selectReal.dispatchEvent(new Event('change'));
                }
                 if (selectMaxMin && registro.registroDensidadeMaxMin) {
                    selectMaxMin.value = registro.registroDensidadeMaxMin;
                    selectMaxMin.dispatchEvent(new Event('change'));
                }

                // Preenche tabelas
                registro.determinacoesInSitu?.forEach((det, i) => {
                    fillInput(`#numero-cilindro-${i + 1}`, det.numeroCilindro);
                    fillInput(`#molde-solo-${i + 1}`, det.moldeSolo);
                    fillInput(`#molde-${i + 1}`, det.molde);
                    fillInput(`#volume-${i + 1}`, det.volume);
                });
                registro.determinacoesUmidadeTopo?.forEach((det, i) => {
                    fillInput(`#capsula-topo-${i + 1}`, det.capsula);
                    fillInput(`#solo-umido-tara-topo-${i + 1}`, det.soloUmidoTara);
                    fillInput(`#solo-seco-tara-topo-${i + 1}`, det.soloSecoTara);
                    fillInput(`#tara-topo-${i + 1}`, det.tara);
                });
                registro.determinacoesUmidadeBase?.forEach((det, i) => {
                    fillInput(`#capsula-base-${i + 1}`, det.capsula);
                    fillInput(`#solo-umido-tara-base-${i + 1}`, det.soloUmidoTara);
                    fillInput(`#solo-seco-tara-base-${i + 1}`, det.soloSecoTara);
                    fillInput(`#tara-base-${i + 1}`, det.tara);
                });

            } else if (tipo === 'real') {
                 registro.determinacoesUmidadeReal?.forEach((det, i) => {
                    fillInput(`#capsula-real-${i + 1}`, det.capsula);
                    fillInput(`#solo-umido-tara-real-${i + 1}`, det.soloUmidoTara);
                    fillInput(`#solo-seco-tara-real-${i + 1}`, det.soloSecoTara);
                    fillInput(`#tara-real-${i + 1}`, det.tara);
                });
                 registro.determinacoesPicnometro?.forEach((det, i) => {
                    fillInput(`#picnometro-${i + 1}`, det.picnometro);
                    fillInput(`#massa-pic-${i + 1}`, det.massaPic);
                    fillInput(`#massa-pic-amostra-agua-${i + 1}`, det.massaPicAmostraAgua);
                    fillInput(`#temperatura-${i + 1}`, det.temperatura);
                    fillInput(`#massa-pic-agua-${i + 1}`, det.massaPicAgua);
                    fillInput(`#massa-solo-umido-${i + 1}`, det.massaSoloUmido);
                });

            } else if (tipo === 'max-min') {
                 registro.determinacoesMax?.forEach((det, i) => {
                    fillInput(`#numero-cilindro-max-${i + 1}`, det.numeroCilindro);
                    fillInput(`#molde-solo-max-${i + 1}`, det.moldeSolo);
                    fillInput(`#molde-max-${i + 1}`, det.molde);
                    fillInput(`#volume-max-${i + 1}`, det.volume);
                    fillInput(`#w-max-${i + 1}`, det.w);
                });
                 registro.determinacoesMin?.forEach((det, i) => {
                    fillInput(`#numero-cilindro-min-${i + 1}`, det.numeroCilindro);
                    fillInput(`#molde-solo-min-${i + 1}`, det.moldeSolo);
                    fillInput(`#molde-min-${i + 1}`, det.molde);
                    fillInput(`#volume-min-${i + 1}`, det.volume);
                    fillInput(`#w-min-${i + 1}`, det.w);
                });
            }

            // Recalcula e preenche os resultados
            if (window.calculadora.calculos) {
                const dadosFormulario = obterDadosFormulario(tipo);
                const resultados = window.calculadora.calculos.calcularResultados(tipo, dadosFormulario);
                setUltimosResultados(tipo, resultados);
                preencherResultados(tipo, resultados);
            }

            // Muda para a aba da calculadora
            const tabBtn = document.querySelector('.tab-btn[data-tab="calculadora"]');
            if (tabBtn) {
                tabBtn.click();
            }

            exibirNotificacao(`Registro '${registroId}' carregado para edição.`, 'info');

        } catch (error) {
            console.error(`Erro ao carregar registro ${registroId} para edição:`, error);
            exibirNotificacao('Erro ao carregar registro para edição.', 'error');
        }
    }


    // API Pública
    return {
        carregarFormulario,
        obterDadosFormulario,
        setUltimosResultados,
        preencherResultados,
        limparFormulario,
        getTipoFormularioAtual,
        exibirNotificacao, // Expondo a função de notificação
        carregarRegistroParaEdicao // Expondo a função de carregar para edição
    };
})();

