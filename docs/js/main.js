// Arquivo principal para integração de todos os módulos
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados salvos
    carregarDadosSalvos();
    
    // Configurar event listeners globais
    configurarEventListeners();
    
    // Inicializar a interface
    inicializarInterface();
});

// Função para carregar dados salvos do localStorage
function carregarDadosSalvos() {
    try {
        // Carregar ensaios de Densidade In Situ
        const ensaiosInSitu = localStorage.getItem('ensaios_in-situ');
        if (ensaiosInSitu) {
            window.ensaios['in-situ'] = JSON.parse(ensaiosInSitu);
        }
        
        // Carregar ensaios de Densidade Real
        const ensaiosReal = localStorage.getItem('ensaios_real');
        if (ensaiosReal) {
            window.ensaios['real'] = JSON.parse(ensaiosReal);
        }
        
        // Carregar ensaios de Densidade Máxima e Mínima
        const ensaiosMaxMin = localStorage.getItem('ensaios_max-min');
        if (ensaiosMaxMin) {
            window.ensaios['max-min'] = JSON.parse(ensaiosMaxMin);
        }
        
        console.log('Dados carregados com sucesso:', window.ensaios);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Função para configurar event listeners globais
function configurarEventListeners() {
    // Event listener para navegação principal
    document.addEventListener('click', (event) => {
        // Botão de voltar ao menu principal
        if (event.target.classList.contains('btn-voltar-menu')) {
            showMainMenu();
        }
    });
    
    // Event listener para redimensionamento da janela
    window.addEventListener('resize', () => {
        ajustarLayoutResponsivo();
    });
}

// Função para inicializar a interface
function inicializarInterface() {
    // Mostrar menu principal
    showMainMenu();
    
    // Ajustar layout responsivo
    ajustarLayoutResponsivo();
    
    // Verificar suporte a recursos do navegador
    verificarSuporteNavegador();
}

// Função para ajustar layout responsivo
function ajustarLayoutResponsivo() {
    const larguraJanela = window.innerWidth;
    
    // Ajustar layout com base na largura da janela
    if (larguraJanela < 768) {
        document.body.classList.add('mobile-view');
        document.body.classList.remove('desktop-view');
    } else {
        document.body.classList.add('desktop-view');
        document.body.classList.remove('mobile-view');
    }
}

// Função para verificar suporte a recursos do navegador
function verificarSuporteNavegador() {
    // Verificar suporte a localStorage
    if (!window.localStorage) {
        alert('Seu navegador não suporta armazenamento local. Algumas funcionalidades podem não funcionar corretamente.');
    }
    
    // Verificar suporte a flexbox
    const suporteFlexbox = 'flex' in document.documentElement.style || 
                          'webkitFlex' in document.documentElement.style || 
                          'msFlex' in document.documentElement.style;
    
    if (!suporteFlexbox) {
        alert('Seu navegador pode não suportar completamente o layout flexível. A aparência pode ser afetada.');
    }
}

// Função para mostrar o menu principal
function showMainMenu() {
    const menuPrincipal = document.querySelector('.menu-principal');
    const secaoListaEnsaios = document.querySelector('#secao-lista-ensaios');
    
    if (menuPrincipal && secaoListaEnsaios) {
        menuPrincipal.style.display = 'block';
        secaoListaEnsaios.style.display = 'none';
    }
}

// Função para mostrar uma calculadora específica
function showCalculator(type) {
    const menuPrincipal = document.querySelector('.menu-principal');
    const secaoListaEnsaios = document.querySelector('#secao-lista-ensaios');
    
    if (menuPrincipal && secaoListaEnsaios) {
        menuPrincipal.style.display = 'none';
        secaoListaEnsaios.style.display = 'block';
        
        // Atualizar o tipo de calculadora atual
        window.currentCalculator = type;
        
        // Carregar a lista de ensaios
        loadEnsaiosList(type);
        
        // Ativar a aba de lista
        activateTab('lista-ensaios');
    }
}

// Função para ativar uma aba
function activateTab(tabId) {
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
    
    // Se a aba da calculadora estiver vazia e for ativada, carregar o formulário
    if (tabId === 'calculadora') {
        const calculadoraContent = document.querySelector('#calculadora');
        if (calculadoraContent && calculadoraContent.innerHTML.trim() === '') {
            loadCalculatorForm(window.currentCalculator);
        }
    }
}

// Função para carregar a lista de ensaios
function loadEnsaiosList(tipo) {
    const listaRegistros = document.querySelector('.lista-registros');
    if (!listaRegistros) return;
    
    // Limpar a lista
    listaRegistros.innerHTML = '';
    
    // Obter os ensaios do tipo especificado
    const ensaios = window.ensaios[tipo] || [];
    
    if (ensaios.length === 0) {
        listaRegistros.innerHTML = '<p>Nenhum ensaio encontrado.</p>';
        return;
    }
    
    // Adicionar cada ensaio à lista
    ensaios.forEach(ensaio => {
        const item = document.createElement('div');
        item.className = 'registro-item';
        
        // Conteúdo específico para cada tipo de ensaio
        let conteudoEspecifico = '';
        
        switch (tipo) {
            case 'in-situ':
                if (ensaio.resultados && ensaio.resultados.compacidadeRelativa) {
                    conteudoEspecifico = `
                        <div class="registro-valores">
                            <div class="valor-item">
                                <span class="valor-label">Topo:</span>
                                <span>${window.calculadora.dadosHelper.formatarNumero(ensaio.resultados.compacidadeRelativa.topo, 1)}%</span>
                            </div>
                            <div class="valor-item">
                                <span class="valor-label">Base:</span>
                                <span>${window.calculadora.dadosHelper.formatarNumero(ensaio.resultados.compacidadeRelativa.base, 1)}%</span>
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
                                <span>${window.calculadora.dadosHelper.formatarNumero(ensaio.mediaDensidadeReal, 3)} g/cm³</span>
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
                                <span>${window.calculadora.dadosHelper.formatarNumero(ensaio.gamadMax, 3)} g/cm³</span>
                            </div>
                            <div class="valor-item">
                                <span class="valor-label">γdmin:</span>
                                <span>${window.calculadora.dadosHelper.formatarNumero(ensaio.gamadMin, 3)} g/cm³</span>
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
                <span class="registro-data">${window.calculadora.dadosHelper.formatarData(ensaio.data) || 'Sem Data'}</span>
            </div>
            <div class="registro-operador">Operador: ${ensaio.operador || 'N/A'}</div>
            <div class="registro-material">Material: ${ensaio.material || 'N/A'}</div>
            ${conteudoEspecifico}
        `;
        
        // Adicionar evento de clique para editar/visualizar o ensaio
        item.addEventListener('click', () => {
            carregarEnsaioParaEdicao(tipo, ensaio);
        });
        
        listaRegistros.appendChild(item);
    });
    
    // Disparar evento para notificar que a lista foi carregada
    const event = new CustomEvent('listaEnsaiosLoaded', {
        detail: {
            container: listaRegistros.parentElement,
            tipo: tipo
        }
    });
    
    document.dispatchEvent(event);
}

// Função para carregar o formulário da calculadora
function loadCalculatorForm(tipo) {
    const calculadoraContent = document.querySelector('#calculadora');
    if (!calculadoraContent) return;
    
    // Limpar o conteúdo atual
    calculadoraContent.innerHTML = '';
    
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
        default:
            console.error('Tipo de calculadora desconhecido:', tipo);
            return;
    }
    
    // Clonar o template e adicionar ao conteúdo
    if (template) {
        const conteudo = template.content.cloneNode(true);
        calculadoraContent.appendChild(conteudo);
        
        // Adicionar botão para voltar ao menu principal
        const btnVoltar = document.createElement('button');
        btnVoltar.className = 'btn-voltar-menu';
        btnVoltar.textContent = 'Voltar ao Menu Principal';
        calculadoraContent.appendChild(btnVoltar);
        
        // Disparar evento para notificar que o formulário foi carregado
        const event = new CustomEvent('formLoaded', {
            detail: {
                form: calculadoraContent.querySelector('.calculadora-container'),
                tipo: tipo
            }
        });
        
        document.dispatchEvent(event);
    }
}

// Função para carregar um ensaio para edição
function carregarEnsaioParaEdicao(tipo, ensaio) {
    // Carregar o formulário correspondente
    loadCalculatorForm(tipo);
    
    // Ativar a aba da calculadora
    activateTab('calculadora');
    
    // Preencher o formulário com os dados do ensaio
    const form = document.querySelector('.calculadora-container');
    if (form) {
        window.formHelper.preencherFormulario(form, tipo, ensaio);
        
        // Configurar referências cruzadas se for densidade in situ
        if (tipo === 'in-situ' && window.referenceCrossSystem) {
            window.referenceCrossSystem.atualizarSeletoresReferencia(form, tipo);
            
            // Selecionar os registros de referência
            if (ensaio.referencias) {
                const selectDensidadeReal = form.querySelector('#registro-densidade-real');
                const selectDensidadeMaxMin = form.querySelector('#registro-densidade-max-min');
                
                if (selectDensidadeReal && ensaio.referencias.densidadeReal) {
                    selectDensidadeReal.value = ensaio.referencias.densidadeReal;
                }
                
                if (selectDensidadeMaxMin && ensaio.referencias.densidadeMaxMin) {
                    selectDensidadeMaxMin.value = ensaio.referencias.densidadeMaxMin;
                }
            }
        }
    }
}

// Inicializar variáveis globais
window.ensaios = {
    'in-situ': [],
    'real': [],
    'max-min': []
};

window.currentCalculator = null;

// Exportar funções para uso global
window.showMainMenu = showMainMenu;
window.showCalculator = showCalculator;
window.activateTab = activateTab;
window.loadEnsaiosList = loadEnsaiosList;
window.loadCalculatorForm = loadCalculatorForm;
window.carregarEnsaioParaEdicao = carregarEnsaioParaEdicao;
