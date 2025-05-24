// Módulo de navegação para a Calculadora de Compacidade
// Implementa navegação consistente entre telas e botões de voltar

document.addEventListener('DOMContentLoaded', () => {
    // Namespace para navegação
    window.calculadora = window.calculadora || {};
    
    // Módulo de navegação
    window.calculadora.navegacao = (() => {
        // Histórico de navegação
        const historico = [];
        
        // Estado atual
        let estadoAtual = {
            tela: 'menu', // 'menu', 'lista', 'calculadora'
            tipo: null,    // 'in-situ', 'real', 'max-min'
            aba: null      // 'lista-ensaios', 'calculadora'
        };
        
        // Elementos da interface
        const elementos = {
            menuPrincipal: document.querySelector('.menu-principal'),
            secaoListaEnsaios: document.querySelector('#secao-lista-ensaios'),
            calculadoraContent: document.querySelector('#calculadora'),
            listaEnsaiosContent: document.querySelector('#lista-ensaios'),
            tabs: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content')
        };
        
        // Navegar para o menu principal
        function navegarParaMenu() {
            // Salvar estado atual no histórico
            if (estadoAtual.tela !== 'menu') {
                historico.push({...estadoAtual});
            }
            
            // Atualizar estado
            estadoAtual = {
                tela: 'menu',
                tipo: null,
                aba: null
            };
            
            // Atualizar interface
            if (elementos.menuPrincipal) elementos.menuPrincipal.style.display = 'block';
            if (elementos.secaoListaEnsaios) elementos.secaoListaEnsaios.style.display = 'none';
            if (elementos.calculadoraContent) elementos.calculadoraContent.innerHTML = '';
            
            console.log('Navegação: Menu Principal');
        }
        
        // Navegar para a lista de ensaios
        function navegarParaLista(tipo) {
            // Verificar se o tipo é válido
            if (!tipo || !['in-situ', 'real', 'max-min'].includes(tipo)) {
                console.error('Tipo de ensaio inválido:', tipo);
                return;
            }
            
            // Salvar estado atual no histórico
            historico.push({...estadoAtual});
            
            // Atualizar estado
            estadoAtual = {
                tela: 'lista',
                tipo: tipo,
                aba: 'lista-ensaios'
            };
            
            // Atualizar interface
            if (elementos.menuPrincipal) elementos.menuPrincipal.style.display = 'none';
            if (elementos.secaoListaEnsaios) elementos.secaoListaEnsaios.style.display = 'block';
            if (elementos.calculadoraContent) elementos.calculadoraContent.innerHTML = '';
            
            // Ativar a aba de lista
            ativarAba('lista-ensaios');
            
            // Carregar a lista de ensaios
            carregarListaEnsaios(tipo);
            
            // Adicionar botão de voltar ao menu principal se não existir
            adicionarBotaoVoltarMenuPrincipal();
            
            console.log(`Navegação: Lista de Ensaios (${tipo})`);
        }
        
        // Navegar para a calculadora
        function navegarParaCalculadora(tipo, ensaio = null) {
            // Verificar se o tipo é válido
            if (!tipo || !['in-situ', 'real', 'max-min'].includes(tipo)) {
                console.error('Tipo de ensaio inválido:', tipo);
                return;
            }
            
            // Salvar estado atual no histórico
            historico.push({...estadoAtual});
            
            // Atualizar estado
            estadoAtual = {
                tela: 'calculadora',
                tipo: tipo,
                aba: 'calculadora',
                ensaio: ensaio
            };
            
            // Atualizar interface
            if (elementos.menuPrincipal) elementos.menuPrincipal.style.display = 'none';
            if (elementos.secaoListaEnsaios) elementos.secaoListaEnsaios.style.display = 'block';
            
            // Ativar a aba da calculadora
            ativarAba('calculadora');
            
            // Carregar o formulário da calculadora
            carregarFormularioCalculadora(tipo, ensaio);
            
            // Adicionar botão de voltar ao menu principal se não existir
            adicionarBotaoVoltarMenuPrincipal();
            
            console.log(`Navegação: Calculadora (${tipo})`);
        }
        
        // Voltar para a tela anterior
        function voltar() {
            // Verificar se há histórico
            if (historico.length === 0) {
                // Se não houver histórico, voltar para o menu principal
                navegarParaMenu();
                return;
            }
            
            // Obter o último estado do histórico
            const ultimoEstado = historico.pop();
            
            // Restaurar o estado
            estadoAtual = {...ultimoEstado};
            
            // Atualizar interface com base no estado restaurado
            switch (estadoAtual.tela) {
                case 'menu':
                    if (elementos.menuPrincipal) elementos.menuPrincipal.style.display = 'block';
                    if (elementos.secaoListaEnsaios) elementos.secaoListaEnsaios.style.display = 'none';
                    if (elementos.calculadoraContent) elementos.calculadoraContent.innerHTML = '';
                    break;
                    
                case 'lista':
                    if (elementos.menuPrincipal) elementos.menuPrincipal.style.display = 'none';
                    if (elementos.secaoListaEnsaios) elementos.secaoListaEnsaios.style.display = 'block';
                    if (elementos.calculadoraContent) elementos.calculadoraContent.innerHTML = '';
                    
                    // Ativar a aba de lista
                    ativarAba('lista-ensaios');
                    
                    // Recarregar a lista de ensaios
                    carregarListaEnsaios(estadoAtual.tipo);
                    
                    // Adicionar botão de voltar ao menu principal se não existir
                    adicionarBotaoVoltarMenuPrincipal();
                    break;
                    
                case 'calculadora':
                    if (elementos.menuPrincipal) elementos.menuPrincipal.style.display = 'none';
                    if (elementos.secaoListaEnsaios) elementos.secaoListaEnsaios.style.display = 'block';
                    
                    // Ativar a aba da calculadora
                    ativarAba('calculadora');
                    
                    // Recarregar o formulário da calculadora
                    carregarFormularioCalculadora(estadoAtual.tipo, estadoAtual.ensaio);
                    
                    // Adicionar botão de voltar ao menu principal se não existir
                    adicionarBotaoVoltarMenuPrincipal();
                    break;
            }
            
            console.log(`Navegação: Voltar para ${estadoAtual.tela} (${estadoAtual.tipo || 'N/A'})`);
        }
        
        // Adicionar botão de voltar ao menu principal
        function adicionarBotaoVoltarMenuPrincipal() {
            // Verificar se o botão já existe
            if (document.querySelector('.btn-voltar-menu-principal')) {
                return;
            }
            
            // Criar botão
            const btnVoltarMenuPrincipal = document.createElement('button');
            btnVoltarMenuPrincipal.className = 'btn-voltar-menu-principal';
            btnVoltarMenuPrincipal.innerHTML = '<i class="fas fa-home"></i> Menu Principal';
            
            // Adicionar evento de clique
            btnVoltarMenuPrincipal.addEventListener('click', navegarParaMenu);
            
            // Adicionar ao container
            const secaoListaEnsaios = document.querySelector('#secao-lista-ensaios');
            if (secaoListaEnsaios) {
                secaoListaEnsaios.insertBefore(btnVoltarMenuPrincipal, secaoListaEnsaios.firstChild);
            }
        }
        
        // Ativar uma aba
        function ativarAba(abaId) {
            // Atualizar estado
            estadoAtual.aba = abaId;
            
            // Atualizar interface
            elementos.tabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === abaId);
            });
            
            elementos.tabContents.forEach(content => {
                content.classList.toggle('active', content.id === abaId);
            });
            
            console.log(`Navegação: Aba ativada (${abaId})`);
        }
        
        // Carregar a lista de ensaios
        function carregarListaEnsaios(tipo) {
            // Verificar se o módulo de banco de dados está disponível
            if (!window.calculadora.db) {
                console.error('Módulo de banco de dados não encontrado');
                return;
            }
            
            // Obter o container da lista
            const listaContainer = elementos.listaEnsaiosContent;
            if (!listaContainer) {
                console.error('Container da lista não encontrado');
                return;
            }
            
            // Disparar evento para carregar a lista
            const event = new CustomEvent('listaEnsaiosLoaded', {
                detail: {
                    container: listaContainer,
                    tipo: tipo
                }
            });
            
            document.dispatchEvent(event);
        }
        
        // Carregar o formulário da calculadora
        function carregarFormularioCalculadora(tipo, ensaio = null) {
            // Verificar se o tipo é válido
            if (!tipo || !['in-situ', 'real', 'max-min'].includes(tipo)) {
                console.error('Tipo de ensaio inválido:', tipo);
                return;
            }
            
            // Obter o container da calculadora
            const calculadoraContainer = elementos.calculadoraContent;
            if (!calculadoraContainer) {
                console.error('Container da calculadora não encontrado');
                return;
            }
            
            // Limpar o container
            calculadoraContainer.innerHTML = '';
            
            // Obter o template correspondente
            let template;
            switch (tipo) {
                case 'in-situ':
                    template = document.getElementById('template-densidade-in-situ');
                    break;
                case 'real':
                    template = document.getElementById('template-densidade-real');
                    break;
                case 'max-min':
                    template = document.getElementById('template-densidade-max-min');
                    break;
            }
            
            if (!template) {
                console.error(`Template para ${tipo} não encontrado`);
                return;
            }
            
            // Clonar o template
            const conteudo = template.content.cloneNode(true);
            
            // Adicionar botão de voltar
            const formularioContainer = conteudo.querySelector('.calculadora-container');
            if (formularioContainer) {
                // Verificar se já existe um botão de voltar
                let btnVoltar = formularioContainer.querySelector('.btn-voltar');
                
                if (!btnVoltar) {
                    // Criar botão de voltar
                    btnVoltar = document.createElement('button');
                    btnVoltar.className = 'btn-voltar';
                    btnVoltar.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar';
                    
                    // Adicionar ao início do formulário
                    if (formularioContainer.firstChild) {
                        formularioContainer.insertBefore(btnVoltar, formularioContainer.firstChild);
                    } else {
                        formularioContainer.appendChild(btnVoltar);
                    }
                }
                
                // Adicionar evento de clique
                btnVoltar.addEventListener('click', voltar);
            }
            
            // Adicionar botão de voltar na seção de ações
            const acoesContainer = conteudo.querySelector('.acoes');
            if (acoesContainer) {
                // Verificar se já existe um botão de voltar
                let btnVoltarAcoes = acoesContainer.querySelector('.btn-voltar-acoes');
                
                if (!btnVoltarAcoes) {
                    // Criar botão de voltar
                    btnVoltarAcoes = document.createElement('button');
                    btnVoltarAcoes.className = 'btn-voltar-acoes';
                    btnVoltarAcoes.textContent = 'Voltar';
                    
                    // Adicionar ao início da seção de ações
                    if (acoesContainer.firstChild) {
                        acoesContainer.insertBefore(btnVoltarAcoes, acoesContainer.firstChild);
                    } else {
                        acoesContainer.appendChild(btnVoltarAcoes);
                    }
                }
                
                // Adicionar evento de clique
                btnVoltarAcoes.addEventListener('click', voltar);
            }
            
            // Adicionar ao container
            calculadoraContainer.appendChild(conteudo);
            
            // Disparar evento para configurar o formulário
            const event = new CustomEvent('formLoaded', {
                detail: {
                    form: calculadoraContainer.querySelector('.calculadora-container'),
                    tipo: tipo
                }
            });
            
            document.dispatchEvent(event);
            
            // Carregar dados do ensaio, se fornecido
            if (ensaio && window.calculadora.formHelper && window.calculadora.formHelper.preencherFormulario) {
                window.calculadora.formHelper.preencherFormulario(
                    calculadoraContainer.querySelector('.calculadora-container'),
                    tipo,
                    ensaio
                );
            }
        }
        
        // Configurar event listeners para navegação
        function configurarEventListeners() {
            // Botões do menu principal
            const btnDensidadeInSitu = document.getElementById('btn-densidade-in-situ');
            const btnDensidadeReal = document.getElementById('btn-densidade-real');
            const btnDensidadeMaxMin = document.getElementById('btn-densidade-max-min');
            
            if (btnDensidadeInSitu) {
                btnDensidadeInSitu.addEventListener('click', () => navegarParaLista('in-situ'));
            }
            
            if (btnDensidadeReal) {
                btnDensidadeReal.addEventListener('click', () => navegarParaLista('real'));
            }
            
            if (btnDensidadeMaxMin) {
                btnDensidadeMaxMin.addEventListener('click', () => navegarParaLista('max-min'));
            }
            
            // Abas
            elementos.tabs.forEach(tab => {
                tab.addEventListener('click', () => ativarAba(tab.dataset.tab));
            });
            
            // Botão Novo Ensaio
            document.addEventListener('click', (event) => {
                if (event.target.classList.contains('btn-novo-ensaio')) {
                    const tipo = event.target.dataset.tipo || estadoAtual.tipo;
                    navegarParaCalculadora(tipo);
                }
            });
            
            // Botões de voltar existentes
            document.addEventListener('click', (event) => {
                if (event.target.classList.contains('btn-voltar') || 
                    event.target.classList.contains('btn-voltar-acoes')) {
                    voltar();
                }
            });
            
            console.log('Event listeners de navegação configurados');
        }
        
        // Inicializar navegação
        function inicializar() {
            // Atualizar referências aos elementos da interface
            Object.assign(elementos, {
                menuPrincipal: document.querySelector('.menu-principal'),
                secaoListaEnsaios: document.querySelector('#secao-lista-ensaios'),
                calculadoraContent: document.querySelector('#calculadora'),
                listaEnsaiosContent: document.querySelector('#lista-ensaios'),
                tabs: document.querySelectorAll('.tab-btn'),
                tabContents: document.querySelectorAll('.tab-content')
            });
            
            // Configurar event listeners
            configurarEventListeners();
            
            // Iniciar no menu principal
            navegarParaMenu();
            
            console.log('Módulo de navegação inicializado');
        }
        
        // Inicializar quando o documento estiver pronto
        inicializar();
        
        // API pública
        return {
            navegarParaMenu,
            navegarParaLista,
            navegarParaCalculadora,
            voltar,
            ativarAba,
            adicionarBotaoVoltarMenuPrincipal,
            getEstadoAtual: () => ({...estadoAtual})
        };
    })();
});
