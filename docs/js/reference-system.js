// Módulo de referência cruzada corrigido para a Calculadora de Compacidade
// Implementa corretamente a referência entre ensaios sem valores hardcoded

document.addEventListener('DOMContentLoaded', () => {
    // Referência ao objeto global de cálculos e armazenamento
    const { densidadeInSitu, densidadeReal, densidadeMaxMin } = window.calculadora.calculos || {};
    const db = window.calculadora.db;
    
    // Sistema de referência cruzada
    const referenceCrossSystem = {
        // Carregar registros para seleção
        carregarRegistrosParaSelecao: async (tipoOrigem, tipoDestino, selectElement) => {
            if (!selectElement) return;
            
            try {
                // Limpa as opções existentes, mantendo apenas a opção padrão
                while (selectElement.options.length > 1) {
                    selectElement.remove(1);
                }
                
                // Carrega os registros do tipo especificado
                const registros = await db.carregarTodosEnsaios(tipoDestino);
                
                // Adiciona cada registro como uma opção
                registros.forEach(registro => {
                    const option = document.createElement('option');
                    option.value = registro.registro;
                    
                    // Formatar data para exibição
                    let dataFormatada = registro.data;
                    if (registro.data && registro.data.includes('-')) {
                        const partes = registro.data.split('-');
                        if (partes.length === 3) {
                            dataFormatada = `${partes[2].substring(0, 2)}/${partes[1]}/${partes[0]}`;
                        }
                    }
                    
                    option.textContent = `${registro.registro} - ${dataFormatada}`;
                    selectElement.appendChild(option);
                });
                
                console.log(`Registros de ${tipoDestino} carregados para seleção`);
            } catch (error) {
                console.error('Erro ao carregar registros para seleção:', error);
            }
        },
        
        // Atualizar seletores de referência cruzada
        atualizarSeletoresReferencia: async (form, tipo) => {
            if (tipo === 'in-situ') {
                const selectDensidadeReal = form.querySelector('#registro-densidade-real');
                const selectDensidadeMaxMin = form.querySelector('#registro-densidade-max-min');
                
                if (selectDensidadeReal) {
                    await referenceCrossSystem.carregarRegistrosParaSelecao('in-situ', 'real', selectDensidadeReal);
                }
                
                if (selectDensidadeMaxMin) {
                    await referenceCrossSystem.carregarRegistrosParaSelecao('in-situ', 'max-min', selectDensidadeMaxMin);
                }
            }
        },
        
        // Obter valores de referência cruzada
        obterValoresReferencia: async (tipo, registro) => {
            try {
                if (!registro) return null;
                
                const ensaio = await db.carregarRegistro(tipo, registro);
                
                if (!ensaio) {
                    console.warn(`Ensaio ${registro} não encontrado para tipo ${tipo}`);
                    return null;
                }
                
                switch (tipo) {
                    case 'real':
                        return {
                            mediaDensidadeReal: ensaio.mediaDensidadeReal
                        };
                    case 'max-min':
                        return {
                            gamadMax: ensaio.mediaGamadMax,
                            gamadMin: ensaio.mediaGamadMin
                        };
                    default:
                        return null;
                }
            } catch (error) {
                console.error('Erro ao obter valores de referência:', error);
                return null;
            }
        },
        
        // Configurar event listeners para seletores de referência
        configurarEventListenersSeletores: (form) => {
            const selectDensidadeReal = form.querySelector('#registro-densidade-real');
            const selectDensidadeMaxMin = form.querySelector('#registro-densidade-max-min');
            
            if (selectDensidadeReal) {
                selectDensidadeReal.addEventListener('change', async () => {
                    const registroSelecionado = selectDensidadeReal.value;
                    if (registroSelecionado) {
                        const valores = await referenceCrossSystem.obterValoresReferencia('real', registroSelecionado);
                        if (valores) {
                            // Exibir informações do registro selecionado em um toast em vez de alert
                            mostrarToast(`Densidade Real selecionada: ${valores.mediaDensidadeReal.toFixed(3)} g/cm³`, 'info');
                            
                            // Armazenar o valor para uso nos cálculos
                            form.dataset.densidadeReal = valores.mediaDensidadeReal;
                            
                            // Recalcular valores dependentes
                            const btnCalcular = form.querySelector('.btn-calcular');
                            if (btnCalcular) {
                                btnCalcular.click();
                            }
                        }
                    } else {
                        // Limpar o valor armazenado
                        delete form.dataset.densidadeReal;
                    }
                });
            }
            
            if (selectDensidadeMaxMin) {
                selectDensidadeMaxMin.addEventListener('change', async () => {
                    const registroSelecionado = selectDensidadeMaxMin.value;
                    if (registroSelecionado) {
                        const valores = await referenceCrossSystem.obterValoresReferencia('max-min', registroSelecionado);
                        if (valores) {
                            // Exibir informações do registro selecionado em um toast em vez de alert
                            mostrarToast(`Densidade Máxima: ${valores.gamadMax.toFixed(3)} g/cm³ | Densidade Mínima: ${valores.gamadMin.toFixed(3)} g/cm³`, 'info');
                            
                            // Armazenar os valores para uso nos cálculos
                            form.dataset.densidadeMax = valores.gamadMax;
                            form.dataset.densidadeMin = valores.gamadMin;
                            
                            // Recalcular valores dependentes
                            const btnCalcular = form.querySelector('.btn-calcular');
                            if (btnCalcular) {
                                btnCalcular.click();
                            }
                        }
                    } else {
                        // Limpar os valores armazenados
                        delete form.dataset.densidadeMax;
                        delete form.dataset.densidadeMin;
                    }
                });
            }
        }
    };
    
    // Sistema de filtros
    const filterSystem = {
        // Filtrar ensaios por data
        filtrarPorData: async (tipo, dataInicio, dataFim) => {
            try {
                return await db.filtrarEnsaios(tipo, { dataInicio, dataFim });
            } catch (error) {
                console.error('Erro ao filtrar ensaios por data:', error);
                return [];
            }
        },
        
        // Filtrar ensaios por termo de busca
        filtrarPorTermo: async (tipo, termo) => {
            try {
                return await db.filtrarEnsaios(tipo, { termo });
            } catch (error) {
                console.error('Erro ao filtrar ensaios por termo:', error);
                return [];
            }
        },
        
        // Aplicar filtros à lista de ensaios
        aplicarFiltros: async (tipo, filtros) => {
            try {
                return await db.filtrarEnsaios(tipo, filtros);
            } catch (error) {
                console.error('Erro ao aplicar filtros:', error);
                return [];
            }
        },
        
        // Adicionar controles de filtro à interface
        adicionarControlesFiltro: (listaContainer, tipo) => {
            // Criar elementos de filtro
            const filtrosContainer = document.createElement('div');
            filtrosContainer.className = 'filtros-container';
            
            filtrosContainer.innerHTML = `
                <div class="filtro-grupo">
                    <input type="text" id="filtro-termo" placeholder="Buscar por registro, operador, material...">
                </div>
                <div class="filtro-grupo">
                    <label for="filtro-data-inicio">De:</label>
                    <input type="date" id="filtro-data-inicio">
                    <label for="filtro-data-fim">Até:</label>
                    <input type="date" id="filtro-data-fim">
                </div>
                <button id="btn-aplicar-filtro" class="btn-filtro">Filtrar</button>
                <button id="btn-limpar-filtro" class="btn-filtro">Limpar</button>
            `;
            
            // Inserir antes da lista
            const listaRegistros = listaContainer.querySelector('.lista-registros');
            listaContainer.insertBefore(filtrosContainer, listaRegistros);
            
            // Configurar event listeners
            const btnAplicarFiltro = filtrosContainer.querySelector('#btn-aplicar-filtro');
            const btnLimparFiltro = filtrosContainer.querySelector('#btn-limpar-filtro');
            
            btnAplicarFiltro.addEventListener('click', async () => {
                const termo = filtrosContainer.querySelector('#filtro-termo').value;
                const dataInicio = filtrosContainer.querySelector('#filtro-data-inicio').value;
                const dataFim = filtrosContainer.querySelector('#filtro-data-fim').value;
                
                const filtros = { termo, dataInicio, dataFim };
                const ensaiosFiltrados = await filterSystem.aplicarFiltros(tipo, filtros);
                
                // Atualizar a lista com os ensaios filtrados
                atualizarListaEnsaios(listaRegistros, ensaiosFiltrados, tipo);
            });
            
            btnLimparFiltro.addEventListener('click', async () => {
                // Limpar campos de filtro
                filtrosContainer.querySelector('#filtro-termo').value = '';
                filtrosContainer.querySelector('#filtro-data-inicio').value = '';
                filtrosContainer.querySelector('#filtro-data-fim').value = '';
                
                // Recarregar todos os ensaios
                const ensaios = await db.carregarTodosEnsaios(tipo);
                atualizarListaEnsaios(listaRegistros, ensaios, tipo);
            });
        }
    };
    
    // Função para atualizar a lista de ensaios
    async function atualizarListaEnsaios(listaContainer, ensaios, tipo) {
        listaContainer.innerHTML = '';
        
        if (!ensaios || ensaios.length === 0) {
            listaContainer.innerHTML = '<p class="lista-vazia">Nenhum ensaio encontrado.</p>';
            return;
        }
        
        ensaios.forEach(ensaio => {
            const item = document.createElement('div');
            item.className = 'registro-item';
            
            // Formatar data para exibição
            let dataFormatada = ensaio.data;
            if (ensaio.data && ensaio.data.includes('-')) {
                const partes = ensaio.data.split('-');
                if (partes.length === 3) {
                    dataFormatada = `${partes[2].substring(0, 2)}/${partes[1]}/${partes[0]}`;
                }
            }
            
            // Conteúdo específico para cada tipo de ensaio
            let conteudoEspecifico = '';
            
            switch (tipo) {
                case 'in-situ':
                    if (ensaio.resultados && ensaio.resultados.compacidadeRelativa) {
                        conteudoEspecifico = `
                            <div class="registro-valores">
                                <div class="valor-item">
                                    <span class="valor-label">Topo:</span>
                                    <span class="${ensaio.resultados.compacidadeRelativa.topo < 0 || ensaio.resultados.compacidadeRelativa.topo > 100 ? 'valor-invalido' : ''}">
                                        ${formatarNumero(ensaio.resultados.compacidadeRelativa.topo, 1)}%
                                    </span>
                                </div>
                                <div class="valor-item">
                                    <span class="valor-label">Base:</span>
                                    <span class="${ensaio.resultados.compacidadeRelativa.base < 0 || ensaio.resultados.compacidadeRelativa.base > 100 ? 'valor-invalido' : ''}">
                                        ${formatarNumero(ensaio.resultados.compacidadeRelativa.base, 1)}%
                                    </span>
                                </div>
                            </div>
                        `;
                    }
                    break;
                    
                case 'real':
                    if (ensaio.mediaDensidadeReal) {
                        conteudoEspecifico = `
                            <div class="registro-valores">
                                <div class="valor-item">
                                    <span class="valor-label">Densidade Real:</span>
                                    <span>${formatarNumero(ensaio.mediaDensidadeReal, 3)} g/cm³</span>
                                </div>
                            </div>
                        `;
                    }
                    break;
                    
                case 'max-min':
                    if (ensaio.gamadMax && ensaio.gamadMin) {
                        conteudoEspecifico = `
                            <div class="registro-valores">
                                <div class="valor-item">
                                    <span class="valor-label">γdmax:</span>
                                    <span>${formatarNumero(ensaio.gamadMax, 3)} g/cm³</span>
                                </div>
                                <div class="valor-item">
                                    <span class="valor-label">γdmin:</span>
                                    <span>${formatarNumero(ensaio.gamadMin, 3)} g/cm³</span>
                                </div>
                            </div>
                        `;
                    }
                    break;
            }
            
            // Montar o item completo
            item.innerHTML = `
                <div class="registro-header">
                    <span class="registro-titulo">${ensaio.registro || 'Sem Registro'}</span>
                    <span class="registro-data">${dataFormatada || 'Sem Data'}</span>
                </div>
                <div class="registro-operador">Operador: ${ensaio.operador || 'N/A'}</div>
                <div class="registro-material">Material: ${ensaio.material || 'N/A'}</div>
                ${conteudoEspecifico}
                <div class="registro-acoes">
                    <button class="btn-editar" data-registro="${ensaio.registro}">Editar</button>
                    <button class="btn-excluir" data-registro="${ensaio.registro}">Excluir</button>
                </div>
            `;
            
            // Adicionar evento de clique para editar/visualizar o ensaio
            const btnEditar = item.querySelector('.btn-editar');
            if (btnEditar) {
                btnEditar.addEventListener('click', (event) => {
                    event.stopPropagation(); // Evitar propagação para o item
                    carregarEnsaioParaEdicao(tipo, ensaio);
                });
            }
            
            // Adicionar evento de clique para excluir o ensaio
            const btnExcluir = item.querySelector('.btn-excluir');
            if (btnExcluir) {
                btnExcluir.addEventListener('click', async (event) => {
                    event.stopPropagation(); // Evitar propagação para o item
                    
                    if (confirm(`Tem certeza que deseja excluir o ensaio ${ensaio.registro}?`)) {
                        try {
                            await db.excluirEnsaio(tipo, ensaio.registro);
                            mostrarToast(`Ensaio ${ensaio.registro} excluído com sucesso`, 'success');
                            
                            // Atualizar a lista
                            const ensaiosAtualizados = await db.carregarTodosEnsaios(tipo);
                            atualizarListaEnsaios(listaContainer, ensaiosAtualizados, tipo);
                        } catch (error) {
                            console.error('Erro ao excluir ensaio:', error);
                            mostrarToast('Erro ao excluir ensaio', 'error');
                        }
                    }
                });
            }
            
            listaContainer.appendChild(item);
        });
    }
    
    // Função para carregar um ensaio para edição
    async function carregarEnsaioParaEdicao(tipo, ensaio) {
        try {
            // Carregar o formulário correspondente
            loadCalculatorForm(tipo);
            
            // Ativar a aba da calculadora
            activateTab('calculadora');
            
            // Preencher o formulário com os dados do ensaio
            const form = document.querySelector('.calculadora-container');
            if (form) {
                await preencherFormulario(form, tipo, ensaio);
                
                // Configurar referências cruzadas se for densidade in situ
                if (tipo === 'in-situ') {
                    await referenceCrossSystem.atualizarSeletoresReferencia(form, tipo);
                    
                    // Selecionar os registros de referência
                    if (ensaio.referencias) {
                        const selectDensidadeReal = form.querySelector('#registro-densidade-real');
                        const selectDensidadeMaxMin = form.querySelector('#registro-densidade-max-min');
                        
                        if (selectDensidadeReal && ensaio.referencias.densidadeReal) {
                            selectDensidadeReal.value = ensaio.referencias.densidadeReal;
                            
                            // Disparar evento change para carregar os valores
                            const event = new Event('change');
                            selectDensidadeReal.dispatchEvent(event);
                        }
                        
                        if (selectDensidadeMaxMin && ensaio.referencias.densidadeMaxMin) {
                            selectDensidadeMaxMin.value = ensaio.referencias.densidadeMaxMin;
                            
                            // Disparar evento change para carregar os valores
                            const event = new Event('change');
                            selectDensidadeMaxMin.dispatchEvent(event);
                        }
                    }
                }
                
                mostrarToast(`Ensaio ${ensaio.registro} carregado para edição`, 'success');
            }
        } catch (error) {
            console.error('Erro ao carregar ensaio para edição:', error);
            mostrarToast('Erro ao carregar ensaio', 'error');
        }
    }
    
    // Função para preencher o formulário com os dados do ensaio
    async function preencherFormulario(form, tipo, ensaio) {
        // Função auxiliar para definir valor em campo
        const setFieldValue = (id, value) => {
            const field = form.querySelector(`#${id}`);
            if (field) {
                field.value = value !== undefined && value !== null ? value : '';
                
                // Disparar evento de input para recalcular campos dependentes
                const event = new Event('input', { bubbles: true });
                field.dispatchEvent(event);
            }
        };
        
        // Preencher campos comuns
        setFieldValue(`registro${tipo === 'in-situ' ? '' : '-' + tipo}`, ensaio.registro);
        setFieldValue(`data${tipo === 'in-situ' ? '' : '-' + tipo}`, ensaio.data);
        setFieldValue(`operador${tipo === 'in-situ' ? '' : '-' + tipo}`, ensaio.operador);
        setFieldValue(`material${tipo === 'in-situ' ? '' : '-' + tipo}`, ensaio.material);
        setFieldValue(`origem${tipo === 'in-situ' ? '' : '-' + tipo}`, ensaio.origem);
        
        // Preencher campos específicos por tipo
        switch (tipo) {
            case 'in-situ':
                // Informações gerais
                setFieldValue('responsavel', ensaio.responsavelCalculo);
                setFieldValue('verificador', ensaio.verificador);
                
                // Localização
                if (ensaio.localizacao) {
                    setFieldValue('norte', ensaio.localizacao.norte);
                    setFieldValue('este', ensaio.localizacao.este);
                    setFieldValue('cota', ensaio.localizacao.cota);
                    setFieldValue('quadrante', ensaio.localizacao.quadrante);
                }
                
                setFieldValue('camada', ensaio.camadaNumero);
                setFieldValue('hora', ensaio.hora);
                
                // Dispositivos
                if (ensaio.dispositivos) {
                    setFieldValue('balanca', ensaio.dispositivos.balanca);
                    setFieldValue('estufa', ensaio.dispositivos.estufa);
                }
                
                // Cilindro
                if (ensaio.cilindro && ensaio.cilindro.length > 0) {
                    setFieldValue('numero-cilindro', ensaio.cilindro[0].numero);
                    setFieldValue('molde-solo', ensaio.cilindro[0].moldeSolo);
                    setFieldValue('molde', ensaio.cilindro[0].molde);
                    setFieldValue('solo', ensaio.cilindro[0].solo);
                    setFieldValue('volume', ensaio.cilindro[0].volume);
                    setFieldValue('gama-nat', ensaio.cilindro[0].gamaNat);
                }
                
                // Teor de umidade - Topo
                if (ensaio.teorUmidade && ensaio.teorUmidade.topo && ensaio.teorUmidade.topo.length > 0) {
                    setFieldValue('capsula-topo', ensaio.teorUmidade.topo[0].capsula);
                    setFieldValue('solo-umido-tara-topo', ensaio.teorUmidade.topo[0].soloUmidoTara);
                    setFieldValue('solo-seco-tara-topo', ensaio.teorUmidade.topo[0].soloSecoTara);
                    setFieldValue('tara-topo', ensaio.teorUmidade.topo[0].tara);
                    setFieldValue('solo-seco-topo', ensaio.teorUmidade.topo[0].soloSeco);
                    setFieldValue('agua-topo', ensaio.teorUmidade.topo[0].agua);
                    setFieldValue('umidade-topo', ensaio.teorUmidade.topo[0].umidade);
                }
                
                // Teor de umidade - Base
                if (ensaio.teorUmidade && ensaio.teorUmidade.base && ensaio.teorUmidade.base.length > 0) {
                    setFieldValue('capsula-base', ensaio.teorUmidade.base[0].capsula);
                    setFieldValue('solo-umido-tara-base', ensaio.teorUmidade.base[0].soloUmidoTara);
                    setFieldValue('solo-seco-tara-base', ensaio.teorUmidade.base[0].soloSecoTara);
                    setFieldValue('tara-base', ensaio.teorUmidade.base[0].tara);
                    setFieldValue('solo-seco-base', ensaio.teorUmidade.base[0].soloSeco);
                    setFieldValue('agua-base', ensaio.teorUmidade.base[0].agua);
                    setFieldValue('umidade-base', ensaio.teorUmidade.base[0].umidade);
                }
                
                // Resultados
                if (ensaio.resultados) {
                    if (ensaio.resultados.gamad) {
                        setFieldValue('gamad-topo', ensaio.resultados.gamad.topo);
                        setFieldValue('gamad-base', ensaio.resultados.gamad.base);
                    }
                    
                    if (ensaio.resultados.indiceVazios) {
                        setFieldValue('indice-vazios-topo', ensaio.resultados.indiceVazios.topo);
                        setFieldValue('indice-vazios-base', ensaio.resultados.indiceVazios.base);
                    }
                    
                    if (ensaio.resultados.compacidadeRelativa) {
                        setFieldValue('cr-topo', ensaio.resultados.compacidadeRelativa.topo);
                        setFieldValue('cr-base', ensaio.resultados.compacidadeRelativa.base);
                    }
                    
                    // Status do ensaio
                    const statusEnsaio = form.querySelector('#status-ensaio');
                    if (statusEnsaio && ensaio.resultados.status) {
                        statusEnsaio.textContent = ensaio.resultados.status;
                        statusEnsaio.className = ensaio.resultados.status.includes('APROVADO') ? 'status-aprovado' : 'status-reprovado';
                    }
                }
                break;
                
            case 'real':
                // Implementar preenchimento para densidade real
                // ...
                break;
                
            case 'max-min':
                // Implementar preenchimento para densidade máxima e mínima
                // ...
                break;
        }
    }
    
    // Função auxiliar para formatar números
    function formatarNumero(valor, casas = 2) {
        if (valor === null || valor === undefined || isNaN(valor)) return 'N/A';
        return parseFloat(valor).toFixed(casas);
    }
    
    // Função para mostrar toast de notificação
    function mostrarToast(mensagem, tipo = 'info') {
        // Verificar se o container de toasts existe
        let toastContainer = document.querySelector('.toast-container');
        
        if (!toastContainer) {
            // Criar container de toasts
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Criar toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.textContent = mensagem;
        
        // Adicionar ao container
        toastContainer.appendChild(toast);
        
        // Remover após 3 segundos
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                toastContainer.removeChild(toast);
                
                // Remover container se estiver vazio
                if (toastContainer.children.length === 0) {
                    document.body.removeChild(toastContainer);
                }
            }, 300);
        }, 3000);
    }
    
    // Inicializar sistema de referência cruzada e filtros
    function inicializarSistemas() {
        // Adicionar event listener para quando um novo formulário for carregado
        document.addEventListener('formLoaded', (event) => {
            const { form, tipo } = event.detail;
            
            if (tipo === 'in-situ') {
                // Atualizar seletores de referência
                referenceCrossSystem.atualizarSeletoresReferencia(form, tipo);
                
                // Configurar event listeners para seletores
                referenceCrossSystem.configurarEventListenersSeletores(form);
            }
        });
        
        // Adicionar event listener para quando a lista de ensaios for carregada
        document.addEventListener('listaEnsaiosLoaded', (event) => {
            const { container, tipo } = event.detail;
            
            // Adicionar controles de filtro
            filterSystem.adicionarControlesFiltro(container, tipo);
            
            // Carregar ensaios iniciais
            const listaRegistros = container.querySelector('.lista-registros');
            if (listaRegistros) {
                db.carregarTodosEnsaios(tipo)
                    .then(ensaios => {
                        atualizarListaEnsaios(listaRegistros, ensaios, tipo);
                    })
                    .catch(error => {
                        console.error('Erro ao carregar ensaios:', error);
                        listaRegistros.innerHTML = '<p class="lista-vazia">Erro ao carregar ensaios.</p>';
                    });
            }
        });
    }
    
    // Exportar funções para uso global
    window.calculadora.referenceCrossSystem = referenceCrossSystem;
    window.calculadora.filterSystem = filterSystem;
    
    // Inicializar sistemas
    inicializarSistemas();
});
