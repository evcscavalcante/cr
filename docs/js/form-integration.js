// Módulo de integração de formulários para a Calculadora de Compacidade
// Implementa a integração entre os formulários e os módulos de cálculo e banco de dados

document.addEventListener('DOMContentLoaded', () => {
    // Namespace para calculadora
    window.calculadora = window.calculadora || {};
    
    // Módulo de integração de formulários
    window.calculadora.formIntegration = (() => {
        // Carregar formulário
        function carregarFormulario(tipo) {
            const calculadora = document.getElementById('calculadora');
            if (!calculadora) return;
            
            // Limpar conteúdo atual
            calculadora.innerHTML = '';
            
            // Obter template correspondente
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
                    console.error(`Tipo de ensaio inválido: ${tipo}`);
                    return;
            }
            
            if (!template) {
                console.error(`Template não encontrado para o tipo: ${tipo}`);
                return;
            }
            
            // Clonar template e adicionar ao formulário
            const conteudo = template.content.cloneNode(true);
            calculadora.appendChild(conteudo);
            
            // Configurar botões
            configurarBotoes(tipo);
            
            // Carregar registros para referência cruzada
            if (tipo === 'in-situ') {
                carregarRegistrosReferencia();
            }
            
            // Disparar evento de formulário carregado
            const event = new CustomEvent('formLoaded', { 
                detail: { 
                    form: calculadora, 
                    tipo: tipo 
                } 
            });
            document.dispatchEvent(event);
            
            console.log(`Formulário carregado: ${tipo}`);
        }
        
        // Carregar registros para referência cruzada
        function carregarRegistrosReferencia() {
            if (!window.calculadora.db) {
                console.error('Módulo de banco de dados não disponível');
                return;
            }
            
            // Carregar registros de densidade real
            window.calculadora.db.listarRegistros('real')
                .then(registros => {
                    const select = document.getElementById('registro-densidade-real');
                    if (!select) return;
                    
                    // Limpar opções existentes
                    while (select.options.length > 1) {
                        select.remove(1);
                    }
                    
                    // Adicionar registros como opções
                    registros.forEach(registro => {
                        const option = document.createElement('option');
                        option.value = registro.registro;
                        option.textContent = `${registro.registro} - ${registro.material || 'Sem descrição'}`;
                        select.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Erro ao carregar registros de densidade real:', error);
                });
            
            // Carregar registros de densidade máxima e mínima
            window.calculadora.db.listarRegistros('max-min')
                .then(registros => {
                    const select = document.getElementById('registro-densidade-max-min');
                    if (!select) return;
                    
                    // Limpar opções existentes
                    while (select.options.length > 1) {
                        select.remove(1);
                    }
                    
                    // Adicionar registros como opções
                    registros.forEach(registro => {
                        const option = document.createElement('option');
                        option.value = registro.registro;
                        option.textContent = `${registro.registro} - ${registro.material || 'Sem descrição'}`;
                        select.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Erro ao carregar registros de densidade máxima e mínima:', error);
                });
        }
        
        // Configurar botões do formulário
        function configurarBotoes(tipo) {
            // Botão de calcular
            const btnCalcular = document.querySelector('.btn-calcular');
            if (btnCalcular) {
                btnCalcular.addEventListener('click', () => calcular(tipo));
            }
            
            // Botão de salvar
            const btnSalvar = document.querySelector('.btn-salvar');
            if (btnSalvar) {
                btnSalvar.addEventListener('click', () => salvar(tipo));
            }
            
            // Botão de gerar PDF
            const btnGerarPDF = document.querySelector('.btn-gerar-pdf');
            if (btnGerarPDF) {
                btnGerarPDF.addEventListener('click', () => gerarPDF(tipo));
            }
            
            // Botão de limpar
            const btnLimpar = document.querySelector('.btn-limpar');
            if (btnLimpar) {
                btnLimpar.addEventListener('click', () => limpar(tipo));
            }
        }
        
        // Calcular resultados
        function calcular(tipo) {
            if (!window.calculadora.calculos) {
                console.error('Módulo de cálculos não disponível');
                return;
            }
            
            try {
                // Obter dados do formulário
                const dados = obterDadosFormulario(tipo);
                if (!dados) return;
                
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
                
                // Preencher resultados no formulário
                preencherResultados(tipo, resultados);
                
                // Exibir notificação
                exibirNotificacao('Cálculos realizados com sucesso', 'success');
            } catch (error) {
                console.error(`Erro ao calcular ${tipo}:`, error);
                exibirNotificacao('Erro ao realizar cálculos. Verifique os dados informados.', 'error');
            }
        }
        
        // Salvar registro
        function salvar(tipo) {
            if (!window.calculadora.db) {
                console.error('Módulo de banco de dados não disponível');
                exibirNotificacao('Erro: Banco de dados não disponível', 'error');
                return;
            }
            
            try {
                // Obter dados do formulário
                const dados = obterDadosFormulario(tipo);
                if (!dados) return;
                
                // Validar registro
                if (!dados.registro) {
                    exibirNotificacao('Informe o número de registro', 'warning');
                    return;
                }
                
                // Salvar registro
                window.calculadora.db.salvarRegistro(tipo, dados)
                    .then(() => {
                        exibirNotificacao('Registro salvo com sucesso', 'success');
                        
                        // Atualizar listas de referência se necessário
                        if (tipo === 'real' || tipo === 'max-min') {
                            const forms = document.querySelectorAll('.calculadora-container');
                            forms.forEach(form => {
                                if (form.querySelector('#registro-densidade-real') || 
                                    form.querySelector('#registro-densidade-max-min')) {
                                    carregarRegistrosReferencia();
                                }
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao salvar registro:', error);
                        exibirNotificacao('Erro ao salvar registro', 'error');
                    });
            } catch (error) {
                console.error(`Erro ao salvar ${tipo}:`, error);
                exibirNotificacao('Erro ao salvar registro. Verifique os dados informados.', 'error');
            }
        }
        
        // Gerar PDF
        function gerarPDF(tipo) {
            if (!window.calculadora.pdfGenerator) {
                console.error('Módulo de geração de PDF não disponível');
                exibirNotificacao('Erro: Gerador de PDF não disponível', 'error');
                return;
            }
            
            try {
                // Obter dados do formulário
                const dados = obterDadosFormulario(tipo);
                if (!dados) return;
                
                // Gerar PDF
                window.calculadora.pdfGenerator.gerarPDF(tipo, dados)
                    .then(() => {
                        exibirNotificacao('PDF gerado com sucesso', 'success');
                    })
                    .catch(error => {
                        console.error('Erro ao gerar PDF:', error);
                        exibirNotificacao('Erro ao gerar PDF', 'error');
                    });
            } catch (error) {
                console.error(`Erro ao gerar PDF para ${tipo}:`, error);
                exibirNotificacao('Erro ao gerar PDF. Verifique os dados informados.', 'error');
            }
        }
        
        // Limpar formulário
        function limpar(tipo) {
            const form = document.querySelector('.calculadora-container');
            if (!form) return;
            
            // Limpar campos de entrada
            const inputs = form.querySelectorAll('input:not([readonly])');
            inputs.forEach(input => {
                input.value = '';
            });
            
            // Limpar campos calculados
            const calculados = form.querySelectorAll('input[readonly]');
            calculados.forEach(input => {
                input.value = '';
            });
            
            // Limpar selects
            const selects = form.querySelectorAll('select');
            selects.forEach(select => {
                select.selectedIndex = 0;
            });
            
            // Limpar status
            const status = form.querySelector('#status-ensaio');
            if (status) {
                status.textContent = 'AGUARDANDO CÁLCULO';
                status.className = 'status-ensaio';
            }
            
            exibirNotificacao('Formulário limpo', 'info');
        }
        
        // Obter dados do formulário
        function obterDadosFormulario(tipo) {
            const form = document.querySelector('.calculadora-container');
            if (!form) return null;
            
            const dados = {};
            
            // Obter valores comuns
            dados.registro = form.querySelector(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`).value;
            dados.data = form.querySelector(`#data${tipo === 'in-situ' ? '' : `-${tipo}`}`).value;
            dados.operador = form.querySelector(`#operador${tipo === 'in-situ' ? '' : `-${tipo}`}`).value;
            dados.material = form.querySelector(`#material${tipo === 'in-situ' ? '' : `-${tipo}`}`).value;
            dados.origem = form.querySelector(`#origem${tipo === 'in-situ' ? '' : `-${tipo}`}`).value;
            
            // Obter valores específicos por tipo
            switch (tipo) {
                case 'in-situ':
                    // Informações gerais
                    dados.responsavel = form.querySelector('#responsavel').value;
                    dados.verificador = form.querySelector('#verificador').value;
                    dados.norte = form.querySelector('#norte').value;
                    dados.este = form.querySelector('#este').value;
                    dados.cota = form.querySelector('#cota').value;
                    dados.quadrante = form.querySelector('#quadrante').value;
                    dados.camada = form.querySelector('#camada').value;
                    dados.hora = form.querySelector('#hora').value;
                    
                    // Dispositivos
                    dados.balanca = form.querySelector('#balanca').value;
                    dados.estufa = form.querySelector('#estufa').value;
                    
                    // Referências
                    dados.registroDensidadeReal = form.querySelector('#registro-densidade-real').value;
                    dados.registroDensidadeMaxMin = form.querySelector('#registro-densidade-max-min').value;
                    
                    // Densidade in situ
                    dados.numeroCilindro = form.querySelector('#numero-cilindro').value;
                    dados.moldeSolo = parseFloat(form.querySelector('#molde-solo').value || 0);
                    dados.molde = parseFloat(form.querySelector('#molde').value || 0);
                    dados.solo = parseFloat(form.querySelector('#solo').value || 0);
                    dados.volume = parseFloat(form.querySelector('#volume').value || 0);
                    dados.gamaNat = parseFloat(form.querySelector('#gama-nat').value || 0);
                    
                    // Umidade - Topo
                    dados.capsulaTopo = form.querySelector('#capsula-topo').value;
                    dados.soloUmidoTaraTopo = parseFloat(form.querySelector('#solo-umido-tara-topo').value || 0);
                    dados.soloSecoTaraTopo = parseFloat(form.querySelector('#solo-seco-tara-topo').value || 0);
                    dados.taraTopo = parseFloat(form.querySelector('#tara-topo').value || 0);
                    dados.soloSecoTopo = parseFloat(form.querySelector('#solo-seco-topo').value || 0);
                    dados.aguaTopo = parseFloat(form.querySelector('#agua-topo').value || 0);
                    dados.umidadeTopo = parseFloat(form.querySelector('#umidade-topo').value || 0);
                    
                    // Umidade - Base
                    dados.capsulaBase = form.querySelector('#capsula-base').value;
                    dados.soloUmidoTaraBase = parseFloat(form.querySelector('#solo-umido-tara-base').value || 0);
                    dados.soloSecoTaraBase = parseFloat(form.querySelector('#solo-seco-tara-base').value || 0);
                    dados.taraBase = parseFloat(form.querySelector('#tara-base').value || 0);
                    dados.soloSecoBase = parseFloat(form.querySelector('#solo-seco-base').value || 0);
                    dados.aguaBase = parseFloat(form.querySelector('#agua-base').value || 0);
                    dados.umidadeBase = parseFloat(form.querySelector('#umidade-base').value || 0);
                    
                    // Resultados
                    dados.gamadTopo = parseFloat(form.querySelector('#gamad-topo').value || 0);
                    dados.gamadBase = parseFloat(form.querySelector('#gamad-base').value || 0);
                    dados.indiceVaziosTopo = parseFloat(form.querySelector('#indice-vazios-topo').value || 0);
                    dados.indiceVaziosBase = parseFloat(form.querySelector('#indice-vazios-base').value || 0);
                    dados.crTopo = parseFloat(form.querySelector('#cr-topo').value || 0);
                    dados.crBase = parseFloat(form.querySelector('#cr-base').value || 0);
                    dados.status = form.querySelector('#status-ensaio').textContent;
                    
                    // Obter valores de referência
                    if (dados.registroDensidadeReal && window.calculadora.referenceSystem) {
                        dados.densidadeReal = window.calculadora.referenceSystem.getDensidadeReal(dados.registroDensidadeReal);
                    }
                    
                    if (dados.registroDensidadeMaxMin && window.calculadora.referenceSystem) {
                        const { gamadMax, gamadMin } = window.calculadora.referenceSystem.getDensidadeMaxMin(dados.registroDensidadeMaxMin);
                        dados.gamadMax = gamadMax;
                        dados.gamadMin = gamadMin;
                    }
                    break;
                    
                case 'real':
                    // Umidade
                    for (let i = 1; i <= 3; i++) {
                        dados[`capsulaReal${i}`] = form.querySelector(`#capsula-real-${i}`).value;
                        dados[`soloUmidoTaraReal${i}`] = parseFloat(form.querySelector(`#solo-umido-tara-real-${i}`).value || 0);
                        dados[`soloSecoTaraReal${i}`] = parseFloat(form.querySelector(`#solo-seco-tara-real-${i}`).value || 0);
                        dados[`taraReal${i}`] = parseFloat(form.querySelector(`#tara-real-${i}`).value || 0);
                        dados[`soloSecoReal${i}`] = parseFloat(form.querySelector(`#solo-seco-real-${i}`).value || 0);
                        dados[`aguaReal${i}`] = parseFloat(form.querySelector(`#agua-real-${i}`).value || 0);
                        dados[`umidadeReal${i}`] = parseFloat(form.querySelector(`#umidade-real-${i}`).value || 0);
                    }
                    
                    dados.umidadeMediaReal = parseFloat(form.querySelector('#umidade-media-real').value || 0);
                    
                    // Picnômetro (apenas 2 determinações)
                    for (let i = 1; i <= 2; i++) {
                        dados[`picnometro${i}`] = form.querySelector(`#picnometro-${i}`).value;
                        dados[`massaPic${i}`] = parseFloat(form.querySelector(`#massa-pic-${i}`).value || 0);
                        dados[`massaPicAmostraAgua${i}`] = parseFloat(form.querySelector(`#massa-pic-amostra-agua-${i}`).value || 0);
                        dados[`temperatura${i}`] = parseFloat(form.querySelector(`#temperatura-${i}`).value || 0);
                        dados[`massaPicAgua${i}`] = parseFloat(form.querySelector(`#massa-pic-agua-${i}`).value || 0);
                        dados[`densidadeAgua${i}`] = parseFloat(form.querySelector(`#densidade-agua-${i}`).value || 0);
                        dados[`massaSoloUmido${i}`] = parseFloat(form.querySelector(`#massa-solo-umido-${i}`).value || 0);
                        dados[`massaSoloSeco${i}`] = parseFloat(form.querySelector(`#massa-solo-seco-${i}`).value || 0);
                        dados[`densidadeReal${i}`] = parseFloat(form.querySelector(`#densidade-real-${i}`).value || 0);
                    }
                    
                    // Resultados
                    dados.diferencaReal = parseFloat(form.querySelector('#diferenca-real').value || 0);
                    dados.mediaDensidadeReal = parseFloat(form.querySelector('#media-densidade-real').value || 0);
                    break;
                    
                case 'max-min':
                    // Densidade máxima
                    for (let i = 1; i <= 3; i++) {
                        dados[`moldeSoloMax${i}`] = parseFloat(form.querySelector(`#molde-solo-max-${i}`).value || 0);
                        dados[`moldeMax${i}`] = parseFloat(form.querySelector(`#molde-max-${i}`).value || 0);
                        dados[`soloMax${i}`] = parseFloat(form.querySelector(`#solo-max-${i}`).value || 0);
                        dados[`volumeMax${i}`] = parseFloat(form.querySelector(`#volume-max-${i}`).value || 0);
                        dados[`gamadMax${i}`] = parseFloat(form.querySelector(`#gamad-max-${i}`).value || 0);
                        dados[`wMax${i}`] = parseFloat(form.querySelector(`#w-max-${i}`).value || 0);
                        dados[`gamasMax${i}`] = parseFloat(form.querySelector(`#gamas-max-${i}`).value || 0);
                    }
                    
                    dados.gamadMax = parseFloat(form.querySelector('#gamad-max').value || 0);
                    
                    // Densidade mínima
                    for (let i = 1; i <= 3; i++) {
                        dados[`numeroCilindroMin${i}`] = form.querySelector(`#numero-cilindro-min-${i}`).value;
                        dados[`moldeSoloMin${i}`] = parseFloat(form.querySelector(`#molde-solo-min-${i}`).value || 0);
                        dados[`moldeMin${i}`] = parseFloat(form.querySelector(`#molde-min-${i}`).value || 0);
                        dados[`soloMin${i}`] = parseFloat(form.querySelector(`#solo-min-${i}`).value || 0);
                        dados[`volumeMin${i}`] = parseFloat(form.querySelector(`#volume-min-${i}`).value || 0);
                        dados[`gamadMin${i}`] = parseFloat(form.querySelector(`#gamad-min-${i}`).value || 0);
                        dados[`wMin${i}`] = parseFloat(form.querySelector(`#w-min-${i}`).value || 0);
                        dados[`gamasMin${i}`] = parseFloat(form.querySelector(`#gamas-min-${i}`).value || 0);
                    }
                    
                    dados.gamadMin = parseFloat(form.querySelector('#gamad-min').value || 0);
                    break;
                    
                default:
                    console.error(`Tipo de ensaio inválido: ${tipo}`);
                    return null;
            }
            
            return dados;
        }
        
        // Preencher resultados no formulário
        function preencherResultados(tipo, resultados) {
            if (!resultados) return;
            
            const form = document.querySelector('.calculadora-container');
            if (!form) return;
            
            switch (tipo) {
                case 'in-situ':
                    // Densidade in situ
                    form.querySelector('#solo').value = resultados.solo.toFixed(2);
                    form.querySelector('#gama-nat').value = resultados.gamaNat.toFixed(3);
                    
                    // Umidade - Topo
                    form.querySelector('#solo-seco-topo').value = resultados.soloSecoTopo.toFixed(2);
                    form.querySelector('#agua-topo').value = resultados.aguaTopo.toFixed(2);
                    form.querySelector('#umidade-topo').value = resultados.umidadeTopo.toFixed(1);
                    
                    // Umidade - Base
                    form.querySelector('#solo-seco-base').value = resultados.soloSecoBase.toFixed(2);
                    form.querySelector('#agua-base').value = resultados.aguaBase.toFixed(2);
                    form.querySelector('#umidade-base').value = resultados.umidadeBase.toFixed(1);
                    
                    // Resultados
                    form.querySelector('#gamad-topo').value = resultados.gamadTopo.toFixed(3);
                    form.querySelector('#gamad-base').value = resultados.gamadBase.toFixed(3);
                    
                    if (resultados.indiceVaziosTopo !== null) {
                        form.querySelector('#indice-vazios-topo').value = resultados.indiceVaziosTopo.toFixed(2);
                    }
                    
                    if (resultados.indiceVaziosBase !== null) {
                        form.querySelector('#indice-vazios-base').value = resultados.indiceVaziosBase.toFixed(2);
                    }
                    
                    if (resultados.crTopo !== null) {
                        form.querySelector('#cr-topo').value = resultados.crTopo.toFixed(1);
                    }
                    
                    if (resultados.crBase !== null) {
                        form.querySelector('#cr-base').value = resultados.crBase.toFixed(1);
                    }
                    
                    // Status
                    const statusEnsaio = form.querySelector('#status-ensaio');
                    if (statusEnsaio && resultados.status) {
                        statusEnsaio.textContent = resultados.status;
                        statusEnsaio.className = `status-ensaio status-${resultados.status.toLowerCase()}`;
                    }
                    break;
                    
                case 'real':
                    // Umidade
                    for (let i = 0; i < 3; i++) {
                        const idx = i + 1;
                        form.querySelector(`#solo-seco-real-${idx}`).value = resultados.soloSeco[i].toFixed(2);
                        form.querySelector(`#agua-real-${idx}`).value = resultados.agua[i].toFixed(2);
                        form.querySelector(`#umidade-real-${idx}`).value = resultados.umidade[i].toFixed(1);
                    }
                    
                    form.querySelector('#umidade-media-real').value = resultados.umidadeMedia.toFixed(1);
                    
                    // Picnômetro (apenas 2 determinações)
                    for (let i = 0; i < 2; i++) {
                        const idx = i + 1;
                        form.querySelector(`#densidade-agua-${idx}`).value = resultados.densidadeAgua[i].toFixed(4);
                        form.querySelector(`#massa-solo-seco-${idx}`).value = resultados.massaSoloSeco[i].toFixed(2);
                        form.querySelector(`#densidade-real-${idx}`).value = resultados.densidadeReal[i].toFixed(3);
                    }
                    
                    // Resultados
                    form.querySelector('#diferenca-real').value = resultados.diferenca.toFixed(1);
                    form.querySelector('#media-densidade-real').value = resultados.mediaDensidadeReal.toFixed(3);
                    break;
                    
                case 'max-min':
                    // Densidade máxima
                    for (let i = 0; i < 3; i++) {
                        const idx = i + 1;
                        form.querySelector(`#solo-max-${idx}`).value = resultados.soloMax[i].toFixed(2);
                        form.querySelector(`#gamad-max-${idx}`).value = resultados.gamadMax[i].toFixed(3);
                        form.querySelector(`#gamas-max-${idx}`).value = resultados.gamasMax[i].toFixed(3);
                    }
                    
                    form.querySelector('#gamad-max').value = resultados.mediaGamadMax.toFixed(3);
                    
                    // Densidade mínima
                    for (let i = 0; i < 3; i++) {
                        const idx = i + 1;
                        form.querySelector(`#solo-min-${idx}`).value = resultados.soloMin[i].toFixed(2);
                        form.querySelector(`#gamad-min-${idx}`).value = resultados.gamadMin[i].toFixed(3);
                        form.querySelector(`#gamas-min-${idx}`).value = resultados.gamasMin[i].toFixed(3);
                    }
                    
                    form.querySelector('#gamad-min').value = resultados.mediaGamadMin.toFixed(3);
                    break;
                    
                default:
                    console.error(`Tipo de ensaio inválido: ${tipo}`);
            }
        }
        
        // Exibir notificação
        function exibirNotificacao(mensagem, tipo) {
            // Verificar se container de toast existe
            let toastContainer = document.querySelector('.toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.className = 'toast-container';
                document.body.appendChild(toastContainer);
            }
            
            // Criar toast
            const toast = document.createElement('div');
            toast.className = `toast toast-${tipo}`;
            toast.textContent = mensagem;
            
            // Adicionar toast ao container
            toastContainer.appendChild(toast);
            
            // Remover toast após 3 segundos
            setTimeout(() => {
                toast.classList.add('toast-hide');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }
        
        // Carregar registro para edição
        function carregarRegistroParaEdicao(tipo, registro) {
            if (!window.calculadora.db) {
                console.error('Módulo de banco de dados não disponível');
                return;
            }
            
            // Carregar registro
            window.calculadora.db.carregarRegistro(tipo, registro)
                .then(dados => {
                    if (!dados) {
                        exibirNotificacao('Registro não encontrado', 'error');
                        return;
                    }
                    
                    // Carregar formulário
                    carregarFormulario(tipo);
                    
                    // Aguardar carregamento do formulário
                    setTimeout(() => {
                        // Preencher dados no formulário
                        preencherDadosFormulario(tipo, dados);
                        
                        // Exibir notificação
                        exibirNotificacao('Registro carregado para edição', 'info');
                        
                        // Ativar tab de calculadora
                        const tabBtn = document.querySelector('.tab-btn[data-tab="calculadora"]');
                        if (tabBtn) {
                            tabBtn.click();
                        }
                    }, 100);
                })
                .catch(error => {
                    console.error('Erro ao carregar registro para edição:', error);
                    exibirNotificacao('Erro ao carregar registro', 'error');
                });
        }
        
        // Preencher dados no formulário
        function preencherDadosFormulario(tipo, dados) {
            const form = document.querySelector('.calculadora-container');
            if (!form) return;
            
            // Preencher valores comuns
            form.querySelector(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`).value = dados.registro;
            form.querySelector(`#data${tipo === 'in-situ' ? '' : `-${tipo}`}`).value = dados.data;
            form.querySelector(`#operador${tipo === 'in-situ' ? '' : `-${tipo}`}`).value = dados.operador;
            form.querySelector(`#material${tipo === 'in-situ' ? '' : `-${tipo}`}`).value = dados.material;
            form.querySelector(`#origem${tipo === 'in-situ' ? '' : `-${tipo}`}`).value = dados.origem;
            
            // Preencher valores específicos por tipo
            switch (tipo) {
                case 'in-situ':
                    // Informações gerais
                    form.querySelector('#responsavel').value = dados.responsavel;
                    form.querySelector('#verificador').value = dados.verificador;
                    form.querySelector('#norte').value = dados.norte;
                    form.querySelector('#este').value = dados.este;
                    form.querySelector('#cota').value = dados.cota;
                    form.querySelector('#quadrante').value = dados.quadrante;
                    form.querySelector('#camada').value = dados.camada;
                    form.querySelector('#hora').value = dados.hora;
                    
                    // Dispositivos
                    form.querySelector('#balanca').value = dados.balanca;
                    form.querySelector('#estufa').value = dados.estufa;
                    
                    // Referências
                    form.querySelector('#registro-densidade-real').value = dados.registroDensidadeReal;
                    form.querySelector('#registro-densidade-max-min').value = dados.registroDensidadeMaxMin;
                    
                    // Densidade in situ
                    form.querySelector('#numero-cilindro').value = dados.numeroCilindro;
                    form.querySelector('#molde-solo').value = dados.moldeSolo;
                    form.querySelector('#molde').value = dados.molde;
                    form.querySelector('#solo').value = dados.solo;
                    form.querySelector('#volume').value = dados.volume;
                    form.querySelector('#gama-nat').value = dados.gamaNat;
                    
                    // Umidade - Topo
                    form.querySelector('#capsula-topo').value = dados.capsulaTopo;
                    form.querySelector('#solo-umido-tara-topo').value = dados.soloUmidoTaraTopo;
                    form.querySelector('#solo-seco-tara-topo').value = dados.soloSecoTaraTopo;
                    form.querySelector('#tara-topo').value = dados.taraTopo;
                    form.querySelector('#solo-seco-topo').value = dados.soloSecoTopo;
                    form.querySelector('#agua-topo').value = dados.aguaTopo;
                    form.querySelector('#umidade-topo').value = dados.umidadeTopo;
                    
                    // Umidade - Base
                    form.querySelector('#capsula-base').value = dados.capsulaBase;
                    form.querySelector('#solo-umido-tara-base').value = dados.soloUmidoTaraBase;
                    form.querySelector('#solo-seco-tara-base').value = dados.soloSecoTaraBase;
                    form.querySelector('#tara-base').value = dados.taraBase;
                    form.querySelector('#solo-seco-base').value = dados.soloSecoBase;
                    form.querySelector('#agua-base').value = dados.aguaBase;
                    form.querySelector('#umidade-base').value = dados.umidadeBase;
                    
                    // Resultados
                    form.querySelector('#gamad-topo').value = dados.gamadTopo;
                    form.querySelector('#gamad-base').value = dados.gamadBase;
                    form.querySelector('#indice-vazios-topo').value = dados.indiceVaziosTopo;
                    form.querySelector('#indice-vazios-base').value = dados.indiceVaziosBase;
                    form.querySelector('#cr-topo').value = dados.crTopo;
                    form.querySelector('#cr-base').value = dados.crBase;
                    
                    // Status
                    const statusEnsaio = form.querySelector('#status-ensaio');
                    if (statusEnsaio && dados.status) {
                        statusEnsaio.textContent = dados.status;
                        statusEnsaio.className = `status-ensaio status-${dados.status.toLowerCase()}`;
                    }
                    break;
                    
                case 'real':
                    // Umidade
                    for (let i = 1; i <= 3; i++) {
                        form.querySelector(`#capsula-real-${i}`).value = dados[`capsulaReal${i}`];
                        form.querySelector(`#solo-umido-tara-real-${i}`).value = dados[`soloUmidoTaraReal${i}`];
                        form.querySelector(`#solo-seco-tara-real-${i}`).value = dados[`soloSecoTaraReal${i}`];
                        form.querySelector(`#tara-real-${i}`).value = dados[`taraReal${i}`];
                        form.querySelector(`#solo-seco-real-${i}`).value = dados[`soloSecoReal${i}`];
                        form.querySelector(`#agua-real-${i}`).value = dados[`aguaReal${i}`];
                        form.querySelector(`#umidade-real-${i}`).value = dados[`umidadeReal${i}`];
                    }
                    
                    form.querySelector('#umidade-media-real').value = dados.umidadeMediaReal;
                    
                    // Picnômetro (apenas 2 determinações)
                    for (let i = 1; i <= 2; i++) {
                        form.querySelector(`#picnometro-${i}`).value = dados[`picnometro${i}`];
                        form.querySelector(`#massa-pic-${i}`).value = dados[`massaPic${i}`];
                        form.querySelector(`#massa-pic-amostra-agua-${i}`).value = dados[`massaPicAmostraAgua${i}`];
                        form.querySelector(`#temperatura-${i}`).value = dados[`temperatura${i}`];
                        form.querySelector(`#massa-pic-agua-${i}`).value = dados[`massaPicAgua${i}`];
                        form.querySelector(`#densidade-agua-${i}`).value = dados[`densidadeAgua${i}`];
                        form.querySelector(`#massa-solo-umido-${i}`).value = dados[`massaSoloUmido${i}`];
                        form.querySelector(`#massa-solo-seco-${i}`).value = dados[`massaSoloSeco${i}`];
                        form.querySelector(`#densidade-real-${i}`).value = dados[`densidadeReal${i}`];
                    }
                    
                    // Resultados
                    form.querySelector('#diferenca-real').value = dados.diferencaReal;
                    form.querySelector('#media-densidade-real').value = dados.mediaDensidadeReal;
                    break;
                    
                case 'max-min':
                    // Densidade máxima
                    for (let i = 1; i <= 3; i++) {
                        form.querySelector(`#molde-solo-max-${i}`).value = dados[`moldeSoloMax${i}`];
                        form.querySelector(`#molde-max-${i}`).value = dados[`moldeMax${i}`];
                        form.querySelector(`#solo-max-${i}`).value = dados[`soloMax${i}`];
                        form.querySelector(`#volume-max-${i}`).value = dados[`volumeMax${i}`];
                        form.querySelector(`#gamad-max-${i}`).value = dados[`gamadMax${i}`];
                        form.querySelector(`#w-max-${i}`).value = dados[`wMax${i}`];
                        form.querySelector(`#gamas-max-${i}`).value = dados[`gamasMax${i}`];
                    }
                    
                    form.querySelector('#gamad-max').value = dados.gamadMax;
                    
                    // Densidade mínima
                    for (let i = 1; i <= 3; i++) {
                        form.querySelector(`#numero-cilindro-min-${i}`).value = dados[`numeroCilindroMin${i}`];
                        form.querySelector(`#molde-solo-min-${i}`).value = dados[`moldeSoloMin${i}`];
                        form.querySelector(`#molde-min-${i}`).value = dados[`moldeMin${i}`];
                        form.querySelector(`#solo-min-${i}`).value = dados[`soloMin${i}`];
                        form.querySelector(`#volume-min-${i}`).value = dados[`volumeMin${i}`];
                        form.querySelector(`#gamad-min-${i}`).value = dados[`gamadMin${i}`];
                        form.querySelector(`#w-min-${i}`).value = dados[`wMin${i}`];
                        form.querySelector(`#gamas-min-${i}`).value = dados[`gamasMin${i}`];
                    }
                    
                    form.querySelector('#gamad-min').value = dados.gamadMin;
                    break;
                    
                default:
                    console.error(`Tipo de ensaio inválido: ${tipo}`);
            }
        }
        
        // API pública
        return {
            carregarFormulario,
            carregarRegistrosReferencia,
            calcular,
            salvar,
            gerarPDF,
            limpar,
            carregarRegistroParaEdicao,
            exibirNotificacao
        };
    })();
});
