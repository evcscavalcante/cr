// Módulo de aplicação principal para a Calculadora de Compacidade
// Implementa a inicialização, controle geral da aplicação e handlers de botões

document.addEventListener('DOMContentLoaded', () => {
    // Namespace para calculadora
    window.calculadora = window.calculadora || {};

    // --- Função para exibir Notificações Toast ---
    window.showToast = function (message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container') || createToastContainer();
        const toast = document.createElement('div');

        // Usa classe no padrão: toast toast-success, toast-error etc.
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        // Trigger reflow para ativar animação
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.add('toast-hide');
            toast.addEventListener('animationend', () => {
                if (toast.parentNode === container) {
                    container.removeChild(toast);
                }
                if (container.children.length === 0 && container.parentNode === document.body) {
                    document.body.removeChild(container);
                }
            });
        }, duration);
    }


    function createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }
    // Garante que a função esteja disponível globalmente
    window.calculadora.exibirNotificacao = window.showToast;
    // Atualiza a referência em formIntegration se já carregado
    if (window.calculadora.formIntegration) {
        window.calculadora.formIntegration.exibirNotificacao = window.showToast;
    }

    // --- Inicialização da Aplicação ---
    inicializarApp();

    function inicializarApp() {
        console.log('Inicializando aplicação...');
        configurarMenuPrincipal();
        configurarTabs();
        configurarBotoesGlobais(); // Configura listeners para botões de ação e voltar
        inicializarBancoDeDados();
        verificarHashNavegacao();
        console.log('Aplicação inicializada');
    }

    function configurarMenuPrincipal() {
        document.getElementById('btn-densidade-in-situ')?.addEventListener('click', () => carregarEnsaio('in-situ'));
        document.getElementById('btn-densidade-real')?.addEventListener('click', () => carregarEnsaio('real'));
        document.getElementById('btn-densidade-max-min')?.addEventListener('click', () => carregarEnsaio('max-min'));
    }

    async function carregarEnsaio(tipo) {
        window.location.hash = tipo;
        document.querySelector('.menu-principal')?.style.setProperty('display', 'none');
        const secaoListaEnsaios = document.getElementById('secao-lista-ensaios');
        if (secaoListaEnsaios) {
            secaoListaEnsaios.style.display = 'block';
            if (!secaoListaEnsaios.querySelector('.btn-voltar-menu-principal')) {
                const btnVoltar = document.createElement('button');
                btnVoltar.className = 'btn-voltar-menu-principal';
                btnVoltar.innerHTML = '<i class="fas fa-home"></i> Menu Principal';
                btnVoltar.addEventListener('click', voltarMenuPrincipal);
                // Insere antes do primeiro filho (tabs)
                secaoListaEnsaios.insertBefore(btnVoltar, secaoListaEnsaios.firstChild);
            }
        }
        carregarListaEnsaios(tipo);
        if (window.calculadora.formIntegration) {
            await window.calculadora.formIntegration.carregarFormulario(tipo);
        } else {
            console.error('Módulo de integração de formulários não disponível');
        }
        // Ativa a última aba selecionada ou lista por padrão
        const savedTab = sessionStorage.getItem('activeTab') || 'lista-ensaios';
        document.querySelector(`.tab-btn[data-tab="${savedTab}"]`)?.click();
    }

    function voltarMenuPrincipal() {
        window.location.hash = '';
        document.querySelector('.menu-principal')?.style.setProperty('display', 'block');
        document.getElementById('secao-lista-ensaios')?.style.setProperty('display', 'none');
    }

    function configurarTabs() {
        const tabsContainer = document.querySelector('.tabs');
        tabsContainer?.addEventListener('click', (event) => {
            if (event.target.classList.contains('tab-btn')) {
                const tabAlvo = event.target.getAttribute('data-tab');
                tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                event.target.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                document.getElementById(tabAlvo)?.classList.add('active');
                sessionStorage.setItem('activeTab', tabAlvo);
            }
        });
    }

    // Configura listeners para botões que podem aparecer dinamicamente (Calcular, Salvar, PDF, Limpar, Voltar)
    function configurarBotoesGlobais() {
        document.body.addEventListener('click', async (event) => {
            const target = event.target;
            const calculadoraContainer = target.closest('#calculadora');
            const listaEnsaiosContainer = target.closest('#secao-lista-ensaios');

            // Botões dentro da Calculadora
            if (calculadoraContainer) {
                const tipo = window.calculadora.formIntegration?.getTipoFormularioAtual();
                if (!tipo) return; // Sai se não conseguir determinar o tipo

                if (target.classList.contains('btn-calcular')) {
                    console.log('Botão Calcular clicado');
                    if (window.calculadora.calculos?.calcularAutomaticamente) {
                         window.calculadora.calculos.calcularAutomaticamente(tipo);
                         window.showToast('Cálculos realizados com sucesso!', 'success');
                    } else {
                         window.showToast('Erro: Módulo de cálculos não encontrado.', 'error');
                    }
                }
                 else if (target.classList.contains('btn-salvar')) {
                    console.log('Botão Salvar clicado');
                    const dados = window.calculadora.formIntegration?.obterDadosFormulario(tipo);
                    if (dados && dados.registro && window.calculadora.db?.salvarRegistro) {
                        try {
                            await window.calculadora.db.salvarRegistro(tipo, dados);
                            window.showToast(`Registro '${dados.registro}' salvo com sucesso!`, 'success');
                            carregarListaEnsaios(tipo); // Atualiza a lista após salvar
                        } catch (error) {
                            console.error('Erro ao salvar registro:', error);
                            window.showToast(`Erro ao salvar registro: ${error.message}`, 'error');
                        }
                    } else if (!dados?.registro) {
                         window.showToast('Erro: Número do Registro é obrigatório para salvar.', 'error');
                    } else {
                        window.showToast('Erro ao obter dados ou salvar registro.', 'error');
                    }
                }
                 else if (target.classList.contains('btn-gerar-pdf')) {
                    console.log('Botão Gerar PDF clicado');
                    const dados = window.calculadora.formIntegration?.obterDadosFormulario(tipo);

                    // Garante que a biblioteca de geração de PDF está carregada
                    try {
                        await loadHtml2Pdf();
                    } catch (e) {
                        window.showToast(e.message, 'error');
                        return;
                    }

                    if (dados && dados.registro && window.calculadora.pdfGenerator?.gerarPDF && typeof html2pdf !== 'undefined') {
                        try {
                            window.showToast('Gerando PDF...', 'info', 5000);
                            await window.calculadora.pdfGenerator.gerarPDF(tipo, dados);
                            // O save é feito dentro da função gerarPDF
                            // window.showToast(`PDF '${tipo}_${dados.registro}.pdf' gerado com sucesso!`, 'success');
                        } catch (error) {
                            console.error('Erro ao gerar PDF:', error);
                            window.showToast(`Erro ao gerar PDF: ${error.message}`, 'error');
                        }
                    } else if (!dados?.registro) {
                         window.showToast('Erro: Número do Registro é obrigatório para gerar PDF.', 'error');
                    } else {
                        window.showToast('Erro ao obter dados ou função para gerar PDF.', 'error');
                    }
                }
                 else if (target.classList.contains('btn-limpar')) {
                    console.log('Botão Limpar clicado');
                    window.calculadora.formIntegration?.limparFormulario();
                    // A notificação já é exibida dentro de limparFormulario
                }
                 else if (target.classList.contains('btn-voltar')) {
                    // Botão Voltar DENTRO da calculadora (volta para a lista)
                    console.log('Botão Voltar (calculadora) clicado');
                    document.querySelector('.tab-btn[data-tab="lista-ensaios"]')?.click();
                }
            }
            // Botão Voltar FORA da calculadora (volta para o menu principal)
            else if (target.classList.contains('btn-voltar-menu-principal')) {
                 console.log('Botão Voltar (menu principal) clicado');
                 voltarMenuPrincipal();
            }
            // Botões na Lista de Ensaios
            else if (listaEnsaiosContainer) {
                 if (target.classList.contains('btn-novo-ensaio')) {
                    console.log('Botão Novo Ensaio clicado');
                    const tipo = window.location.hash.substring(1) || 'in-situ';
                    if (window.calculadora.formIntegration) {
                        await window.calculadora.formIntegration.carregarFormulario(tipo);
                        window.calculadora.formIntegration.limparFormulario(); // Garante que o form carregado esteja limpo
                        document.querySelector('.tab-btn[data-tab="calculadora"]')?.click();
                    }
                 }
                 else if (target.classList.contains('btn-editar')) {
                    console.log('Botão Editar clicado');
                    const item = target.closest('.registro-item');
                    const registroId = item?.dataset.registroId;
                    const tipo = item?.dataset.tipo;
                    if (registroId && tipo && window.calculadora.formIntegration?.carregarRegistroParaEdicao) {
                        await window.calculadora.formIntegration.carregarRegistroParaEdicao(tipo, registroId);
                        // Força a mudança para a aba da calculadora após carregar para edição
                        const tabBtn = document.querySelector('.tab-btn[data-tab="calculadora"]');
                        if (tabBtn) {
                            tabBtn.click();
                        } else {
                             window.showToast('Erro: Aba da calculadora não encontrada.', 'error');
                        }
                    } else {
                        window.showToast('Erro ao obter dados para edição.', 'error');
                    }
                 }
                 else if (target.classList.contains('btn-excluir')) {
                    console.log('Botão Excluir clicado');
                    const item = target.closest('.registro-item');
                    const registroId = item?.dataset.registroId;
                    const tipo = item?.dataset.tipo;
                    if (registroId && tipo && window.calculadora.db?.excluirRegistro) {
                        if (confirm(`Deseja realmente excluir o registro ${registroId}?`)) {
                            try {
                                await window.calculadora.db.excluirRegistro(tipo, registroId);
                                window.showToast('Registro excluído com sucesso!', 'success');
                                carregarListaEnsaios(tipo); // Recarrega a lista
                            } catch (error) {
                                console.error('Erro ao excluir registro:', error);
                                window.showToast(`Erro ao excluir registro: ${error.message}`, 'error');
                            }
                        }
                    } else {
                         window.showToast('Erro ao obter dados para exclusão.', 'error');
                    }
                 }
                 else if (target.classList.contains('btn-filtro')) {
                    console.log('Botão Filtrar clicado');
                    const tipo = window.location.hash.substring(1) || 'in-situ';
                    carregarListaEnsaios(tipo); // Recarrega a lista aplicando filtros
                 }
            }
        });
    }

    function inicializarBancoDeDados() {
        if (window.calculadora.db) {
            window.calculadora.db.init()
                .then(() => {
                    console.log('Banco de dados inicializado');
                    // Carrega a lista inicial baseada no hash ou padrão
                    const tipoInicial = window.location.hash.substring(1);
                    if (['in-situ', 'real', 'max-min'].includes(tipoInicial)) {
                         carregarListaEnsaios(tipoInicial);
                    } else {
                        // Se não houver hash válido, não carrega nenhuma lista inicialmente
                        // A lista será carregada quando um tipo de ensaio for selecionado
                    }
                })
                .catch(error => {
                    console.error('Erro ao inicializar banco de dados:', error);
                    window.showToast('Erro ao conectar ao banco de dados local.', 'error', 5000);
                });
        } else {
            console.error('Módulo de banco de dados não disponível');
            window.showToast('Funcionalidade de banco de dados indisponível.', 'error', 5000);
        }
    }

    function verificarHashNavegacao() {
        const hash = window.location.hash.substring(1);
        if (['in-situ', 'real', 'max-min'].includes(hash)) {
            carregarEnsaio(hash);
        }
    }

    // Carregar lista de ensaios (com filtros)
    async function carregarListaEnsaios(tipo) {
        if (!window.calculadora.db) {
            console.error('Módulo de banco de dados não disponível para carregar lista');
            return;
        }

        const listaRegistros = document.querySelector('.lista-registros');
        const filtroRegistroInput = document.getElementById('filtro-registro');
        const filtroDataInput = document.getElementById('filtro-data');
        if (!listaRegistros || !filtroRegistroInput || !filtroDataInput) return;

        listaRegistros.innerHTML = '<div class="loading-lista">Carregando registros...</div>'; // Feedback de carregamento

        const filtroRegistro = filtroRegistroInput.value.toLowerCase();
        const filtroData = filtroDataInput.value;

        try {
            let registros = await window.calculadora.db.listarRegistros(tipo);

            // Aplicar filtros
            if (filtroRegistro) {
                registros = registros.filter(r => r.registro.toLowerCase().includes(filtroRegistro));
            }
            if (filtroData) {
                registros = registros.filter(r => r.data === filtroData);
            }

            // Limpar lista antes de adicionar itens filtrados
            listaRegistros.innerHTML = '';

            if (registros.length === 0) {
                listaRegistros.innerHTML = '<p class="sem-registros">Nenhum registro encontrado para este tipo de ensaio ou filtro.</p>';
            } else {
                registros.forEach(registro => {
                    const item = document.createElement('div');
                    item.className = 'registro-item';
                    item.dataset.registroId = registro.registro; // Usar o número do registro como ID
                    item.dataset.tipo = tipo;
                    item.innerHTML = `
                        <span class="registro-nome">Registro: ${registro.registro}</span>
                        <span class="registro-data">Data: ${registro.data || 'N/A'}</span>
                        <div class="registro-acoes">
                            <button class="btn-editar" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="btn-excluir" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    `;
                    listaRegistros.appendChild(item);
                });
            }
        } catch (error) {
            console.error(`Erro ao carregar lista de ensaios (${tipo}):`, error);
            listaRegistros.innerHTML = '<p class="erro-lista">Erro ao carregar registros. Tente novamente mais tarde.</p>';
            window.showToast(`Erro ao carregar registros: ${error.message}`, 'error');
        }
    }

    // Carrega a biblioteca html2pdf apenas quando não estiver disponível
    async function loadHtml2Pdf() {
        if (typeof html2pdf === 'undefined') {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'libs/html2pdf.bundle.min.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Falha ao carregar html2pdf'));
                document.body.appendChild(script);
            });
        }
    }



});

