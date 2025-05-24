// Módulo de aplicação principal para a Calculadora de Compacidade
// Implementa a inicialização e controle geral da aplicação

document.addEventListener('DOMContentLoaded', () => {
    // Namespace para calculadora
    window.calculadora = window.calculadora || {};
    
    // Inicializar aplicação
    inicializarApp();
    
    // Função de inicialização
    function inicializarApp() {
        console.log('Inicializando aplicação...');
        
        // Configurar navegação do menu principal
        configurarMenuPrincipal();
        
        // Configurar navegação de tabs
        configurarTabs();
        
        // Configurar botões de voltar
        configurarBotoesVoltar();
        
        // Inicializar módulo de banco de dados
        if (window.calculadora.db) {
            window.calculadora.db.init()
                .then(() => {
                    console.log('Banco de dados inicializado');
                    carregarListaEnsaios();
                })
                .catch(error => {
                    console.error('Erro ao inicializar banco de dados:', error);
                });
        } else {
            console.error('Módulo de banco de dados não disponível');
        }
        
        // Verificar se há um hash na URL para navegação direta
        if (window.location.hash) {
            const hash = window.location.hash.substring(1);
            if (hash === 'in-situ' || hash === 'real' || hash === 'max-min') {
                carregarEnsaio(hash);
            }
        }
        
        console.log('Aplicação inicializada');
    }
    
    // Configurar menu principal
    function configurarMenuPrincipal() {
        const btnDensidadeInSitu = document.getElementById('btn-densidade-in-situ');
        const btnDensidadeReal = document.getElementById('btn-densidade-real');
        const btnDensidadeMaxMin = document.getElementById('btn-densidade-max-min');
        
        if (btnDensidadeInSitu) {
            btnDensidadeInSitu.addEventListener('click', () => carregarEnsaio('in-situ'));
        }
        
        if (btnDensidadeReal) {
            btnDensidadeReal.addEventListener('click', () => carregarEnsaio('real'));
        }
        
        if (btnDensidadeMaxMin) {
            btnDensidadeMaxMin.addEventListener('click', () => carregarEnsaio('max-min'));
        }
    }
    
    // Carregar ensaio
    function carregarEnsaio(tipo) {
        // Atualizar hash da URL
        window.location.hash = tipo;
        
        // Esconder menu principal
        const menuPrincipal = document.querySelector('.menu-principal');
        if (menuPrincipal) {
            menuPrincipal.style.display = 'none';
        }
        
        // Mostrar seção de lista de ensaios
        const secaoListaEnsaios = document.getElementById('secao-lista-ensaios');
        if (secaoListaEnsaios) {
            secaoListaEnsaios.style.display = 'block';
            
            // Adicionar botão de voltar ao menu principal
            if (!secaoListaEnsaios.querySelector('.btn-voltar-menu-principal')) {
                const btnVoltar = document.createElement('button');
                btnVoltar.className = 'btn-voltar-menu-principal';
                btnVoltar.innerHTML = '<i class="fas fa-home"></i> Menu Principal';
                btnVoltar.addEventListener('click', voltarMenuPrincipal);
                secaoListaEnsaios.appendChild(btnVoltar);
            }
        }
        
        // Carregar lista de ensaios
        carregarListaEnsaios(tipo);
        
        // Carregar formulário da calculadora
        if (window.calculadora.formIntegration) {
            window.calculadora.formIntegration.carregarFormulario(tipo);
        } else {
            console.error('Módulo de integração de formulários não disponível');
        }
        
        // Ativar tab de lista de ensaios
        const tabBtn = document.querySelector('.tab-btn[data-tab="lista-ensaios"]');
        if (tabBtn) {
            tabBtn.click();
        }
    }
    
    // Voltar ao menu principal
    function voltarMenuPrincipal() {
        // Limpar hash da URL
        window.location.hash = '';
        
        // Mostrar menu principal
        const menuPrincipal = document.querySelector('.menu-principal');
        if (menuPrincipal) {
            menuPrincipal.style.display = 'block';
        }
        
        // Esconder seção de lista de ensaios
        const secaoListaEnsaios = document.getElementById('secao-lista-ensaios');
        if (secaoListaEnsaios) {
            secaoListaEnsaios.style.display = 'none';
        }
    }
    
    // Configurar navegação de tabs
    function configurarTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remover classe active de todos os botões
                tabBtns.forEach(b => b.classList.remove('active'));
                
                // Adicionar classe active ao botão clicado
                btn.classList.add('active');
                
                // Obter tab alvo
                const tabAlvo = btn.getAttribute('data-tab');
                
                // Esconder todos os conteúdos de tab
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Mostrar conteúdo da tab alvo
                const tabContent = document.getElementById(tabAlvo);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
    }
    
    // Configurar botões de voltar
    function configurarBotoesVoltar() {
        document.addEventListener('click', (event) => {
            if (event.target.closest('.btn-voltar')) {
                const tabBtn = document.querySelector('.tab-btn[data-tab="lista-ensaios"]');
                if (tabBtn) {
                    tabBtn.click();
                }
            }
        });
    }
    
    // Carregar lista de ensaios
    function carregarListaEnsaios(tipo) {
        if (!window.calculadora.db) {
            console.error('Módulo de banco de dados não disponível');
            return;
        }
        
        const listaRegistros = document.querySelector('.lista-registros');
        if (!listaRegistros) return;
        
        // Limpar lista
        listaRegistros.innerHTML = '';
        
        // Obter tipo atual se não for especificado
        if (!tipo) {
            const hash = window.location.hash.substring(1);
            tipo = hash === 'in-situ' || hash === 'real' || hash === 'max-min' ? hash : 'in-situ';
        }
        
        // Atualizar título da lista
        const tituloLista = document.querySelector('.lista-header h2');
        if (tituloLista) {
            let titulo = '';
            switch (tipo) {
                case 'in-situ':
                    titulo = 'Densidade In Situ';
                    break;
                case 'real':
                    titulo = 'Densidade Real';
                    break;
                case 'max-min':
                    titulo = 'Densidade Máxima e Mínima';
                    break;
            }
            tituloLista.textContent = `Lista de Ensaios - ${titulo}`;
        }
        
        // Configurar botão de novo ensaio
        const btnNovoEnsaio = document.querySelector('.btn-novo-ensaio');
        if (btnNovoEnsaio) {
            btnNovoEnsaio.onclick = () => {
                // Carregar formulário vazio
                if (window.calculadora.formIntegration) {
                    window.calculadora.formIntegration.carregarFormulario(tipo);
                    
                    // Ativar tab de calculadora
                    const tabBtn = document.querySelector('.tab-btn[data-tab="calculadora"]');
                    if (tabBtn) {
                        tabBtn.click();
                    }
                }
            };
        }
        
        // Carregar registros
        window.calculadora.db.listarRegistros(tipo)
            .then(registros => {
                if (registros.length === 0) {
                    // Exibir mensagem de lista vazia
                    const mensagemVazia = document.createElement('div');
                    mensagemVazia.className = 'lista-vazia';
                    mensagemVazia.textContent = 'Nenhum registro encontrado';
                    listaRegistros.appendChild(mensagemVazia);
                    return;
                }
                
                // Ordenar registros por data (mais recentes primeiro)
                registros.sort((a, b) => {
                    const dataA = a.timestamp || 0;
                    const dataB = b.timestamp || 0;
                    return dataB - dataA;
                });
                
                // Adicionar registros à lista
                registros.forEach(registro => {
                    const item = criarItemRegistro(registro, tipo);
                    listaRegistros.appendChild(item);
                });
            })
            .catch(error => {
                console.error('Erro ao carregar lista de ensaios:', error);
                
                // Exibir mensagem de erro
                const mensagemErro = document.createElement('div');
                mensagemErro.className = 'lista-vazia';
                mensagemErro.textContent = 'Erro ao carregar registros';
                listaRegistros.appendChild(mensagemErro);
            });
    }
    
    // Criar item de registro para a lista
    function criarItemRegistro(registro, tipo) {
        const item = document.createElement('div');
        item.className = 'registro-item';
        
        // Cabeçalho do registro
        const header = document.createElement('div');
        header.className = 'registro-header';
        
        const titulo = document.createElement('div');
        titulo.className = 'registro-titulo';
        titulo.textContent = registro.registro;
        header.appendChild(titulo);
        
        const data = document.createElement('div');
        data.className = 'registro-data';
        data.textContent = registro.data ? new Date(registro.data).toLocaleDateString() : 'Data não informada';
        header.appendChild(data);
        
        item.appendChild(header);
        
        // Operador
        const operador = document.createElement('div');
        operador.className = 'registro-operador';
        operador.textContent = `Operador: ${registro.operador || 'Não informado'}`;
        item.appendChild(operador);
        
        // Material
        const material = document.createElement('div');
        material.className = 'registro-material';
        material.textContent = `Material: ${registro.material || 'Não informado'}`;
        item.appendChild(material);
        
        // Valores principais
        const valores = document.createElement('div');
        valores.className = 'registro-valores';
        
        // Adicionar valores específicos por tipo
        switch (tipo) {
            case 'in-situ':
                adicionarValor(valores, 'γd Topo', registro.gamadTopo, 'g/cm³');
                adicionarValor(valores, 'γd Base', registro.gamadBase, 'g/cm³');
                adicionarValor(valores, 'CR Topo', registro.crTopo, '%');
                adicionarValor(valores, 'CR Base', registro.crBase, '%');
                break;
                
            case 'real':
                adicionarValor(valores, 'Densidade Real', registro.mediaDensidadeReal, 'g/cm³');
                adicionarValor(valores, 'Umidade Média', registro.umidadeMediaReal, '%');
                break;
                
            case 'max-min':
                adicionarValor(valores, 'γd máx', registro.gamadMax, 'g/cm³');
                adicionarValor(valores, 'γd mín', registro.gamadMin, 'g/cm³');
                break;
        }
        
        item.appendChild(valores);
        
        // Ações
        const acoes = document.createElement('div');
        acoes.className = 'registro-acoes';
        
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-editar';
        btnEditar.textContent = 'Editar';
        btnEditar.addEventListener('click', () => {
            if (window.calculadora.formIntegration) {
                window.calculadora.formIntegration.carregarRegistroParaEdicao(tipo, registro.registro);
            }
        });
        acoes.appendChild(btnEditar);
        
        const btnExcluir = document.createElement('button');
        btnExcluir.className = 'btn-excluir';
        btnExcluir.textContent = 'Excluir';
        btnExcluir.addEventListener('click', () => {
            if (confirm(`Deseja realmente excluir o registro ${registro.registro}?`)) {
                if (window.calculadora.db) {
                    window.calculadora.db.excluirRegistro(tipo, registro.registro)
                        .then(() => {
                            // Recarregar lista
                            carregarListaEnsaios(tipo);
                            
                            // Exibir notificação
                            if (window.calculadora.formIntegration) {
                                window.calculadora.formIntegration.exibirNotificacao('Registro excluído com sucesso', 'success');
                            }
                        })
                        .catch(error => {
                            console.error('Erro ao excluir registro:', error);
                            
                            // Exibir notificação
                            if (window.calculadora.formIntegration) {
                                window.calculadora.formIntegration.exibirNotificacao('Erro ao excluir registro', 'error');
                            }
                        });
                }
            }
        });
        acoes.appendChild(btnExcluir);
        
        item.appendChild(acoes);
        
        return item;
    }
    
    // Adicionar valor ao container de valores
    function adicionarValor(container, label, valor, unidade) {
        const item = document.createElement('div');
        item.className = 'valor-item';
        
        const labelEl = document.createElement('span');
        labelEl.className = 'valor-label';
        labelEl.textContent = label + ':';
        item.appendChild(labelEl);
        
        const valorEl = document.createElement('span');
        valorEl.className = valor ? '' : 'valor-invalido';
        valorEl.textContent = valor ? `${valor} ${unidade}` : 'Não calculado';
        item.appendChild(valorEl);
        
        container.appendChild(item);
    }
});
