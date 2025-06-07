// Módulo de integração de eventos para a Calculadora de Compacidade
// Implementa a vinculação de eventos para cálculos automáticos em tempo real

document.addEventListener('DOMContentLoaded', () => {
    // Namespace para calculadora
    window.calculadora = window.calculadora || {};
    
    // Módulo de integração de eventos
    window.calculadora.eventIntegration = (() => {
        // Configurar eventos para cálculos automáticos
        function configurarEventosCalculoAutomatico() {
            console.log('Configurando eventos para cálculos automáticos...');
            
            // Observar mudanças no DOM para detectar quando novos formulários são carregados
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        // Verificar se algum formulário foi adicionado
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const form = node.querySelector('.calculadora-container');
                                if (form) {
                                    // Determinar o tipo de formulário
                                    let tipo = '';
                                    if (form.querySelector('#registro')) {
                                        tipo = 'in-situ';
                                    } else if (form.querySelector('#registro-real')) {
                                        tipo = 'real';
                                    } else if (form.querySelector('#registro-max-min')) {
                                        tipo = 'max-min';
                                    }
                                    
                                    if (tipo) {
                                        console.log(`Formulário detectado: ${tipo}`);
                                        configurarEventosFormulario(form, tipo);
                                    }
                                }
                            }
                        });
                    }
                });
            });
            
            // Iniciar observação
            observer.observe(document.body, { childList: true, subtree: true });
            
            // Configurar formulários existentes
            document.querySelectorAll('.calculadora-container').forEach((form) => {
                // Determinar o tipo de formulário
                let tipo = '';
                if (form.querySelector('#registro')) {
                    tipo = 'in-situ';
                } else if (form.querySelector('#registro-real')) {
                    tipo = 'real';
                } else if (form.querySelector('#registro-max-min')) {
                    tipo = 'max-min';
                }
                
                if (tipo) {
                    console.log(`Formulário existente detectado: ${tipo}`);
                    configurarEventosFormulario(form, tipo);
                }
            });
        }
        
        // Configurar eventos para um formulário específico
        function configurarEventosFormulario(form, tipo) {
            console.log(`Configurando eventos para formulário ${tipo}`);
            
            // Adicionar event listeners para inputs
            const inputs = form.querySelectorAll('input:not([readonly])');
            inputs.forEach(input => {
                // Remover event listeners existentes para evitar duplicação
                input.removeEventListener('input', onInputChange);
                input.removeEventListener('blur', onInputBlur);
                
                // Adicionar novos event listeners
                input.addEventListener('input', onInputChange);
                input.addEventListener('blur', onInputBlur);
                
                // Armazenar tipo no elemento para uso nos handlers
                input.dataset.formTipo = tipo;
            });
            
            // Adicionar event listeners para selects
            const selects = form.querySelectorAll('select');
            selects.forEach(select => {
                // Remover event listeners existentes para evitar duplicação
                select.removeEventListener('change', onSelectChange);
                
                // Adicionar novos event listeners
                select.addEventListener('change', onSelectChange);
                
                // Armazenar tipo no elemento para uso nos handlers
                select.dataset.formTipo = tipo;
            });
            
            // Configurar botão de calcular
            const btnCalcular = form.querySelector('.btn-calcular');
            if (btnCalcular) {
                // Remover event listeners existentes para evitar duplicação
                btnCalcular.removeEventListener('click', onCalcularClick);
                
                // Adicionar novos event listeners
                btnCalcular.addEventListener('click', onCalcularClick);
                
                // Armazenar tipo no elemento para uso nos handlers
                btnCalcular.dataset.formTipo = tipo;
            }
            
            // Configurar botão de salvar
            const btnSalvar = form.querySelector('.btn-salvar');
            if (btnSalvar) {
                // Remover event listeners existentes para evitar duplicação
                btnSalvar.removeEventListener('click', onSalvarClick);
                
                // Adicionar novos event listeners
                btnSalvar.addEventListener('click', onSalvarClick);
                
                // Armazenar tipo no elemento para uso nos handlers
                btnSalvar.dataset.formTipo = tipo;
            }
            
            // Configurar botão de gerar PDF
            const btnGerarPDF = form.querySelector('.btn-gerar-pdf');
            if (btnGerarPDF) {
                // Remover event listeners existentes para evitar duplicação
                btnGerarPDF.removeEventListener('click', onGerarPDFClick);
                
                // Adicionar novos event listeners
                btnGerarPDF.addEventListener('click', onGerarPDFClick);
                
                // Armazenar tipo no elemento para uso nos handlers
                btnGerarPDF.dataset.formTipo = tipo;
            }
            
            // Configurar botão de limpar
            const btnLimpar = form.querySelector('.btn-limpar');
            if (btnLimpar) {
                // Remover event listeners existentes para evitar duplicação
                btnLimpar.removeEventListener('click', onLimparClick);
                
                // Adicionar novos event listeners
                btnLimpar.addEventListener('click', onLimparClick);
                
                // Armazenar tipo no elemento para uso nos handlers
                btnLimpar.dataset.formTipo = tipo;
            }
            
            // Calcular inicialmente após um pequeno delay
            // Garante que o formulário ainda esteja no DOM antes de prosseguir
            setTimeout(() => {
                if (document.body.contains(form)) {
                    calcularAutomaticamente(tipo);
                }
            }, 500);
        }
        
        // Handler para evento de input
        function onInputChange(event) {
            const tipo = event.target.dataset.formTipo;
            if (tipo) {
                // Usar debounce para evitar cálculos excessivos durante digitação rápida
                clearTimeout(event.target.debounceTimer);
                event.target.debounceTimer = setTimeout(() => {
                    calcularAutomaticamente(tipo);
                }, 300);
            }
        }
        
        // Handler para evento de blur
        function onInputBlur(event) {
            const tipo = event.target.dataset.formTipo;
            if (tipo) {
                calcularAutomaticamente(tipo);
            }
        }
        
        // Handler para evento de change em select
        function onSelectChange(event) {
            const tipo = event.target.dataset.formTipo;
            if (tipo) {
                calcularAutomaticamente(tipo);
            }
        }
        
        // Handler para evento de click no botão calcular
        function onCalcularClick(event) {
            const tipo = event.target.dataset.formTipo;
            if (tipo) {
                calcularAutomaticamente(tipo);
            }
        }
        
        // Handler para evento de click no botão salvar
        function onSalvarClick(event) {
            const tipo = event.target.dataset.formTipo;
            if (tipo && window.calculadora.formIntegration) {
                window.calculadora.formIntegration.salvar(tipo);
            }
        }
        
        // Handler para evento de click no botão gerar PDF
        function onGerarPDFClick(event) {
            const tipo = event.target.dataset.formTipo;
            if (tipo && window.calculadora.formIntegration) {
                window.calculadora.formIntegration.gerarPDF(tipo);
            }
        }
        
        // Handler para evento de click no botão limpar
        function onLimparClick(event) {
            const tipo = event.target.dataset.formTipo;
            if (tipo && window.calculadora.formIntegration) {
                window.calculadora.formIntegration.limpar(tipo);
            }
        }
        
        // Calcular automaticamente
        function calcularAutomaticamente(tipo) {
            console.log(`Calculando automaticamente para ${tipo}`);
            
            if (!window.calculadora.calculos) {
                console.error('Módulo de cálculos não disponível');
                return;
            }
            
            if (!window.calculadora.formIntegration) {
                console.error('Módulo de integração de formulários não disponível');
                return;
            }
            
            try {
                // Obter dados do formulário
                const dados = window.calculadora.formIntegration.obterDadosFormulario(tipo);
                if (!dados) {
                    console.error('Não foi possível obter dados do formulário');
                    return;
                }
                
                console.log('Dados obtidos:', dados);
                
                // Calcular resultados
                let resultados;
                switch (tipo) {
                    case 'in-situ':
                        resultados = window.calculadora.calculos.calcularDensidadeInSitu(dados);
                        break;
                    case 'real':
                        resultados = window.calculadora.calculos.calcularDensidadeReal(dados);
                        break;
                    case 'max-min':
                        resultados = window.calculadora.calculos.calcularDensidadeMaxMin(dados);
                        break;
                    default:
                        console.error(`Tipo de ensaio inválido: ${tipo}`);
                        return;
                }
                
                console.log('Resultados calculados:', resultados);
                
                // Preencher resultados no formulário
                window.calculadora.formIntegration.preencherResultados(tipo, resultados);
            } catch (error) {
                console.error(`Erro ao calcular automaticamente para ${tipo}:`, error);
            }
        }
        
        // Inicializar módulo
        function init() {
            console.log('Inicializando módulo de integração de eventos...');
            configurarEventosCalculoAutomatico();
        }
        
        // Inicializar ao carregar a página
        init();
        
        // API pública
        return {
            configurarEventosFormulario,
            calcularAutomaticamente
        };
    })();
});
