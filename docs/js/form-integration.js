// Módulo de integração de formulários para a Calculadora de Compacidade
// Implementa a integração entre os formulários e os módulos de cálculo e banco de dados

document.addEventListener("DOMContentLoaded", () => {
    // Namespace para calculadora
    window.calculadora = window.calculadora || {};

    // Módulo de integração de formulários
    window.calculadora.formIntegration = (() => {
        // Carregar formulário
        function carregarFormulario(tipo) {
            const calculadora = document.getElementById("calculadora");
            if (!calculadora) return;

            // Limpar conteúdo atual
            calculadora.innerHTML = "";

            // Obter template correspondente
            let template;
            switch (tipo) {
                case "in-situ":
                    template = document.getElementById("template-densidade-in-situ");
                    break;
                case "real":
                    template = document.getElementById("template-densidade-real");
                    break;
                case "max-min":
                    template = document.getElementById("template-densidade-max-min");
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
            if (tipo === "in-situ") {
                 if (window.calculadora.referenceSystem && typeof window.calculadora.referenceSystem.atualizarSeletoresReferencia === 'function') {
                    window.calculadora.referenceSystem.atualizarSeletoresReferencia();
                 } else {
                    console.warn("Função para carregar referências não encontrada ou não disponível.");
                 }
            }

            // Disparar evento de formulário carregado
            const event = new CustomEvent("formLoaded", {
                detail: {
                    form: calculadora,
                    tipo: tipo
                }
            });
            document.dispatchEvent(event);

            console.log(`Formulário carregado: ${tipo}`);
        }

        // Configurar botões do formulário
        function configurarBotoes(tipo) {
            // Botão de calcular (agora automático)
            // const btnCalcular = document.querySelector(".btn-calcular");
            // if (btnCalcular) {
            //     btnCalcular.addEventListener("click", () => calcular(tipo));
            // }

            // Botão de salvar
            const btnSalvar = document.querySelector(".btn-salvar");
            if (btnSalvar) {
                btnSalvar.addEventListener("click", () => salvar(tipo));
            }

            // Botão de gerar PDF
            const btnGerarPDF = document.querySelector(".btn-gerar-pdf");
            if (btnGerarPDF) {
                btnGerarPDF.addEventListener("click", () => gerarPDF(tipo));
            }

            // Botão de limpar
            const btnLimpar = document.querySelector(".btn-limpar");
            if (btnLimpar) {
                btnLimpar.addEventListener("click", () => limpar(tipo));
            }
        }

        // Calcular resultados (chamado automaticamente)
        function calcular(tipo) {
             if (!window.calculadora.calculos) {
                console.error("Módulo de cálculos não disponível");
                return;
            }
             // A função calcularAutomaticamente deve obter os dados e preencher os resultados
             window.calculadora.calculos.calcularAutomaticamente(tipo);
        }

        // Salvar registro
        function salvar(tipo) {
            if (!window.calculadora.db) {
                console.error("Módulo de banco de dados não disponível");
                exibirNotificacao("Erro: Banco de dados não disponível", "error");
                return;
            }

            try {
                // Obter dados do formulário (já estruturados para múltiplas determinações)
                const dados = obterDadosFormulario(tipo);
                if (!dados) return; // Erro ao obter dados já notificado

                // Validar registro
                if (!dados.registro) {
                    exibirNotificacao("Informe o número de registro", "warning");
                    const registroInput = document.querySelector(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`);
                    if (registroInput) registroInput.focus();
                    return;
                }

                // Salvar registro
                window.calculadora.db.salvarRegistro(tipo, dados)
                    .then(() => {
                        exibirNotificacao("Registro salvo com sucesso", "success");

                        // Atualizar listas de referência se necessário
                        if ((tipo === "real" || tipo === "max-min") && window.calculadora.referenceSystem && typeof window.calculadora.referenceSystem.atualizarSeletoresReferencia === 'function') {
                           window.calculadora.referenceSystem.atualizarSeletoresReferencia();
                        }
                        // Atualizar lista de ensaios da aba atual
                        if (window.calculadora.app && typeof window.calculadora.app.atualizarListaEnsaios === 'function') {
                            window.calculadora.app.atualizarListaEnsaios(tipo);
                        }
                    })
                    .catch(error => {
                        console.error("Erro ao salvar registro:", error);
                        exibirNotificacao(`Erro ao salvar registro: ${error.message || error}`, "error");
                    });
            } catch (error) {
                console.error(`Erro ao salvar ${tipo}:`, error);
                exibirNotificacao("Erro ao salvar registro. Verifique os dados informados.", "error");
            }
        }

        // Gerar PDF
        function gerarPDF(tipo) {
            if (!window.calculadora.pdfGenerator) {
                console.error("Módulo de geração de PDF não disponível");
                exibirNotificacao("Erro: Gerador de PDF não disponível", "error");
                return;
            }

            try {
                // Obter dados do formulário
                const dados = obterDadosFormulario(tipo);
                if (!dados) return;

                 // Validar registro antes de gerar PDF
                if (!dados.registro) {
                    exibirNotificacao("Informe o número de registro para gerar o PDF", "warning");
                     const registroInput = document.querySelector(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`);
                    if (registroInput) registroInput.focus();
                    return;
                }

                // Obter resultados calculados para incluir no PDF
                // É importante que os cálculos estejam atualizados
                const resultados = window.calculadora.calculos ? window.calculadora.calculos.calcularResultados(tipo, dados) : {};
                const dadosCompletos = { ...dados, ...resultados }; // Combina dados de entrada e resultados

                // Gerar PDF
                window.calculadora.pdfGenerator.gerarPDF(tipo, dadosCompletos)
                    .then(() => {
                        // Notificação geralmente tratada dentro do pdfGenerator
                    })
                    .catch(error => {
                        console.error("Erro ao gerar PDF:", error);
                        exibirNotificacao(`Erro ao gerar PDF: ${error.message || error}`, "error");
                    });
            } catch (error) {
                console.error(`Erro ao gerar PDF para ${tipo}:`, error);
                exibirNotificacao("Erro ao gerar PDF. Verifique os dados informados.", "error");
            }
        }

        // Limpar formulário
        function limpar(tipo) {
            const form = document.querySelector(".calculadora-container");
            if (!form) return;

            // Limpar campos de entrada
            const inputs = form.querySelectorAll("input:not([readonly])");
            inputs.forEach(input => {
                input.value = "";
            });

            // Limpar campos calculados (readonly)
            const calculados = form.querySelectorAll("input[readonly]");
            calculados.forEach(input => {
                input.value = input.placeholder === "0.0" || input.placeholder === "0.00" || input.placeholder === "0.000" || input.placeholder === "0.0000" ? input.placeholder : "";
            });

            // Limpar selects
            const selects = form.querySelectorAll("select");
            selects.forEach(select => {
                select.selectedIndex = 0;
            });

            // Limpar status
            const status = form.querySelector("#status-ensaio");
            if (status) {
                status.textContent = "AGUARDANDO CÁLCULO";
                status.className = "status-ensaio";
            }

            exibirNotificacao("Formulário limpo", "info");
            // Recalcular após limpar para zerar os campos dependentes
            // Usar um pequeno timeout para garantir que o DOM está pronto
            setTimeout(() => calcular(tipo), 50);
        }

        // Função auxiliar para obter valor float de um campo
        function getFloatValue(selector) {
            const element = document.querySelector(selector);
            // Trata vírgula como decimal, remove espaços e retorna 0 se inválido/vazio
            return parseFloat(element ? element.value.replace(/\s/g, '').replace(',', '.') : 0) || 0;
        }

        // Função auxiliar para obter valor string de um campo
        function getStringValue(selector) {
            const element = document.querySelector(selector);
            return element ? element.value.trim() : "";
        }

        // Obter dados do formulário (REESCRITO para estrutura com arrays)
        function obterDadosFormulario(tipo) {
            const form = document.querySelector(".calculadora-container");
            if (!form) {
                console.error("Container do formulário não encontrado.");
                exibirNotificacao("Erro interno: Formulário não encontrado.", "error");
                return null;
            }

            const dados = {};
            try {
                // Obter valores comuns
                const idSuffix = tipo === 'in-situ' ? '' : `-${tipo}`;
                dados.registro = getStringValue(`#registro${idSuffix}`);
                dados.data = getStringValue(`#data${idSuffix}`);
                dados.operador = getStringValue(`#operador${idSuffix}`);
                dados.material = getStringValue(`#material${idSuffix}`);
                dados.origem = getStringValue(`#origem${idSuffix}`);

                // Obter valores específicos por tipo
                switch (tipo) {
                    case "in-situ":
                        // Informações gerais
                        dados.responsavel = getStringValue("#responsavel");
                        dados.verificador = getStringValue("#verificador");
                        dados.norte = getStringValue("#norte");
                        dados.este = getStringValue("#este");
                        dados.cota = getStringValue("#cota");
                        dados.quadrante = getStringValue("#quadrante");
                        dados.camada = getStringValue("#camada");
                        dados.hora = getStringValue("#hora");

                        // Dispositivos
                        dados.balanca = getStringValue("#balanca");
                        dados.estufa = getStringValue("#estufa");

                        // Referências
                        dados.registroDensidadeReal = getStringValue("#registro-densidade-real");
                        dados.registroDensidadeMaxMin = getStringValue("#registro-densidade-max-min");

                        // Densidade in situ (2 Determinações)
                        dados.determinacoesInSitu = [];
                        for (let i = 1; i <= 2; i++) {
                            dados.determinacoesInSitu.push({
                                numeroCilindro: getStringValue(`#numero-cilindro-${i}`),
                                moldeSolo: getFloatValue(`#molde-solo-${i}`),
                                molde: getFloatValue(`#molde-${i}`),
                                volume: getFloatValue(`#volume-${i}`) // Volume é input
                                // solo e gamaNat são calculados
                            });
                        }

                        // Umidade - Topo (3 Determinações)
                        dados.determinacoesUmidadeTopo = [];
                        for (let i = 1; i <= 3; i++) {
                            dados.determinacoesUmidadeTopo.push({
                                capsula: getStringValue(`#capsula-numero-topo-${i}`), // ID corrigido
                                soloUmidoTara: getFloatValue(`#solo-umido-tara-topo-${i}`),
                                soloSecoTara: getFloatValue(`#solo-seco-tara-topo-${i}`),
                                tara: getFloatValue(`#tara-topo-${i}`)
                                // soloSeco, agua, umidade são calculados
                            });
                        }

                        // Umidade - Base (3 Determinações)
                        dados.determinacoesUmidadeBase = [];
                        for (let i = 1; i <= 3; i++) {
                            dados.determinacoesUmidadeBase.push({
                                capsula: getStringValue(`#capsula-numero-base-${i}`), // ID corrigido
                                soloUmidoTara: getFloatValue(`#solo-umido-tara-base-${i}`),
                                soloSecoTara: getFloatValue(`#solo-seco-tara-base-${i}`),
                                tara: getFloatValue(`#tara-base-${i}`)
                                // soloSeco, agua, umidade são calculados
                            });
                        }

                        // Obter valores de referência (serão usados nos cálculos)
                        if (window.calculadora.referenceSystem) {
                             if (dados.registroDensidadeReal) {
                                const refReal = window.calculadora.referenceSystem.getDensidadeReal(dados.registroDensidadeReal);
                                dados.densidadeRealRef = refReal ? refReal.mediaDensidadeReal : null;
                             }
                             if (dados.registroDensidadeMaxMin) {
                                const refMaxMin = window.calculadora.referenceSystem.getDensidadeMaxMin(dados.registroDensidadeMaxMin);
                                if (refMaxMin) {
                                    dados.gamadMaxRef = refMaxMin.mediaGamadMax;
                                    dados.gamadMinRef = refMaxMin.mediaGamadMin;
                                }
                             }
                        } else {
                            console.warn("Módulo referenceSystem não encontrado para obter dados de referência.");
                        }
                        break;

                    case "real":
                        // Umidade (3 Determinações)
                        dados.determinacoesUmidadeReal = [];
                        for (let i = 1; i <= 3; i++) {
                            dados.determinacoesUmidadeReal.push({
                                capsula: getStringValue(`#capsula-real-${i}`),
                                soloUmidoTara: getFloatValue(`#solo-umido-tara-real-${i}`),
                                soloSecoTara: getFloatValue(`#solo-seco-tara-real-${i}`),
                                tara: getFloatValue(`#tara-real-${i}`)
                            });
                        }

                        // Picnômetro (2 Determinações)
                        dados.determinacoesPicnometro = [];
                        for (let i = 1; i <= 2; i++) {
                            dados.determinacoesPicnometro.push({
                                picnometro: getStringValue(`#picnometro-${i}`),
                                massaPic: getFloatValue(`#massa-pic-${i}`),
                                massaPicAmostraAgua: getFloatValue(`#massa-pic-amostra-agua-${i}`),
                                temperatura: getFloatValue(`#temperatura-${i}`),
                                massaPicAgua: getFloatValue(`#massa-pic-agua-${i}`),
                                massaSoloUmido: getFloatValue(`#massa-solo-umido-${i}`)
                            });
                        }
                        break;

                    case "max-min":
                        // Densidade máxima (3 Determinações)
                        dados.determinacoesMax = [];
                        for (let i = 1; i <= 3; i++) {
                            dados.determinacoesMax.push({
                                moldeSolo: getFloatValue(`#molde-solo-max-${i}`),
                                molde: getFloatValue(`#molde-max-${i}`),
                                volume: getFloatValue(`#volume-max-${i}`),
                                w: getFloatValue(`#w-max-${i}`)
                            });
                        }

                        // Densidade mínima (3 Determinações)
                        dados.determinacoesMin = [];
                        for (let i = 1; i <= 3; i++) {
                            dados.determinacoesMin.push({
                                numeroCilindro: getStringValue(`#numero-cilindro-min-${i}`),
                                moldeSolo: getFloatValue(`#molde-solo-min-${i}`),
                                molde: getFloatValue(`#molde-min-${i}`),
                                volume: getFloatValue(`#volume-min-${i}`),
                                w: getFloatValue(`#w-min-${i}`)
                            });
                        }
                        break;

                    default:
                        console.error(`Tipo de ensaio inválido ao obter dados: ${tipo}`);
                        exibirNotificacao(`Erro interno: Tipo de ensaio desconhecido (${tipo}).`, "error");
                        return null;
                }
                return dados;

            } catch (error) {
                console.error(`Erro crítico ao obter dados do formulário ${tipo}:`, error);
                exibirNotificacao("Erro ao ler dados do formulário. Verifique o console para detalhes.", "error");
                return null;
            }
        }

        // Função auxiliar para definir valor em um campo
        function setFieldValue(selector, value, precision = null) {
            const element = document.querySelector(selector);
            if (element) {
                let formattedValue = value;
                if (typeof value === 'number' && !isNaN(value) && precision !== null) {
                    // Arredonda para a precisão especificada e formata para string
                    formattedValue = value.toFixed(precision);
                } else if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
                    // Se o valor for nulo, indefinido ou NaN, limpar o campo ou usar placeholder
                    formattedValue = element.placeholder === "0.0" || element.placeholder === "0.00" || element.placeholder === "0.000" || element.placeholder === "0.0000" ? element.placeholder : "";
                }
                element.value = formattedValue;
            } else {
                // console.warn(`Elemento não encontrado para setFieldValue: ${selector}`);
            }
        }

        // Preencher resultados no formulário (ATUALIZADO para estrutura com arrays)
        function preencherResultados(tipo, resultados) {
            if (!resultados) {
                console.warn("preencherResultados chamado sem dados de resultados.");
                return;
            }

            const form = document.querySelector(".calculadora-container");
            if (!form) return;

            try {
                switch (tipo) {
                    case "in-situ":
                        // Densidade in situ (Array 'determinacoesInSitu')
                        if (resultados.determinacoesInSitu && Array.isArray(resultados.determinacoesInSitu)) {
                            resultados.determinacoesInSitu.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#solo-${i}`, det.solo, 2);
                                setFieldValue(`#gama-nat-${i}`, det.gamaNat, 3);
                                // Preencher outros campos se necessário (ex: volume, se for calculado)
                            });
                        }

                        // Umidade - Topo (Array 'determinacoesUmidadeTopo')
                        if (resultados.determinacoesUmidadeTopo && Array.isArray(resultados.determinacoesUmidadeTopo)) {
                            resultados.determinacoesUmidadeTopo.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#solo-seco-topo-${i}`, det.soloSeco, 2);
                                setFieldValue(`#agua-topo-${i}`, det.agua, 2);
                                setFieldValue(`#umidade-topo-${i}`, det.umidade, 1);
                            });
                        }
                        setFieldValue("#umidade-media-topo", resultados.umidadeMediaTopo, 1);

                        // Umidade - Base (Array 'determinacoesUmidadeBase')
                        if (resultados.determinacoesUmidadeBase && Array.isArray(resultados.determinacoesUmidadeBase)) {
                            resultados.determinacoesUmidadeBase.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#solo-seco-base-${i}`, det.soloSeco, 2);
                                setFieldValue(`#agua-base-${i}`, det.agua, 2);
                                setFieldValue(`#umidade-base-${i}`, det.umidade, 1);
                            });
                        }
                        setFieldValue("#umidade-media-base", resultados.umidadeMediaBase, 1);

                        // Resultados Finais
                        setFieldValue("#gamad-topo", resultados.gamadTopo, 3);
                        setFieldValue("#gamad-base", resultados.gamadBase, 3);
                        setFieldValue("#indice-vazios-topo", resultados.indiceVaziosTopo, 2);
                        setFieldValue("#indice-vazios-base", resultados.indiceVaziosBase, 2);
                        setFieldValue("#cr-topo", resultados.crTopo, 1);
                        setFieldValue("#cr-base", resultados.crBase, 1);

                        // Status
                        const statusEnsaio = form.querySelector("#status-ensaio");
                        if (statusEnsaio && resultados.status) {
                            statusEnsaio.textContent = resultados.status;
                            statusEnsaio.className = `status-ensaio status-${resultados.status.toLowerCase().replace(/[ /]/g, '-')}`;
                        }
                        break;

                    case "real":
                        // Umidade (Array 'determinacoesUmidadeReal')
                        if (resultados.determinacoesUmidadeReal && Array.isArray(resultados.determinacoesUmidadeReal)) {
                            resultados.determinacoesUmidadeReal.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#solo-seco-real-${i}`, det.soloSeco, 2);
                                setFieldValue(`#agua-real-${i}`, det.agua, 2);
                                setFieldValue(`#umidade-real-${i}`, det.umidade, 1);
                            });
                        }
                        setFieldValue("#umidade-media-real", resultados.umidadeMedia, 1);

                        // Picnômetro (Array 'determinacoesPicnometro')
                        if (resultados.determinacoesPicnometro && Array.isArray(resultados.determinacoesPicnometro)) {
                            resultados.determinacoesPicnometro.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#densidade-agua-${i}`, det.densidadeAgua, 4);
                                setFieldValue(`#massa-solo-seco-${i}`, det.massaSoloSeco, 2);
                                setFieldValue(`#densidade-real-${i}`, det.densidadeReal, 3);
                            });
                        }

                        // Resultados
                        setFieldValue("#diferenca-real", resultados.diferenca, 1);
                        setFieldValue("#media-densidade-real", resultados.mediaDensidadeReal, 3);
                        break;

                    case "max-min":
                        // Densidade máxima (Array 'determinacoesMax')
                        if (resultados.determinacoesMax && Array.isArray(resultados.determinacoesMax)) {
                            resultados.determinacoesMax.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#solo-max-${i}`, det.solo, 2);
                                setFieldValue(`#gamad-max-${i}`, det.gamad, 3);
                                setFieldValue(`#gamas-max-${i}`, det.gamas, 3);
                            });
                        }
                        setFieldValue("#gamad-max", resultados.mediaGamadMax, 3);

                        // Densidade mínima (Array 'determinacoesMin')
                        if (resultados.determinacoesMin && Array.isArray(resultados.determinacoesMin)) {
                            resultados.determinacoesMin.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#solo-min-${i}`, det.solo, 2);
                                setFieldValue(`#gamad-min-${i}`, det.gamad, 3);
                                setFieldValue(`#gamas-min-${i}`, det.gamas, 3);
                            });
                        }
                        setFieldValue("#gamad-min", resultados.mediaGamadMin, 3);
                        break;

                    default:
                        console.error(`Tipo de ensaio inválido ao preencher resultados: ${tipo}`);
                }
            } catch (error) {
                console.error(`Erro ao preencher resultados para ${tipo}:`, error);
                exibirNotificacao("Erro ao exibir resultados. Verifique o console.", "error");
            }
        }

        // Exibir notificação
        function exibirNotificacao(mensagem, tipo) {
            // Verificar se container de toast existe
            let toastContainer = document.querySelector(".toast-container");
            if (!toastContainer) {
                toastContainer = document.createElement("div");
                toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3";
                toastContainer.style.zIndex = "1055"; // Ensure it's above most elements
                document.body.appendChild(toastContainer);
            }

            // Criar toast
            const toastId = `toast-${Date.now()}`;
            const toastHTML = `
                <div id="${toastId}" class="toast align-items-center text-white bg-${tipo === 'error' ? 'danger' : tipo === 'warning' ? 'warning' : tipo === 'info' ? 'info' : 'success'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body">
                            ${mensagem}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                </div>
            `;

            // Adicionar toast ao container
            toastContainer.insertAdjacentHTML('beforeend', toastHTML);

            // Inicializar e mostrar o toast (requer Bootstrap JS)
            const toastElement = document.getElementById(toastId);
            if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
                 const toastInstance = new bootstrap.Toast(toastElement, { delay: 3000 });
                 toastInstance.show();
                 // Remover o elemento do DOM após o toast ser escondido
                 toastElement.addEventListener('hidden.bs.toast', () => {
                     toastElement.remove();
                 });
            } else {
                 // Fallback se Bootstrap JS não estiver carregado
                 console.warn("Bootstrap Toast JS não encontrado. Exibindo notificação simples.");
                 toastElement.style.display = 'block'; // Make it visible
                 toastElement.style.opacity = 1;
                 setTimeout(() => {
                     toastElement.style.transition = 'opacity 0.5s ease-out';
                     toastElement.style.opacity = 0;
                     setTimeout(() => toastElement.remove(), 500);
                 }, 3000);
            }
        }

        // Carregar registro para edição (ATUALIZADO para estrutura com arrays)
        function carregarRegistroParaEdicao(tipo, registroId) {
            if (!window.calculadora.db) {
                console.error("Módulo de banco de dados não disponível");
                return;
            }

            // Carregar registro
            window.calculadora.db.carregarRegistro(tipo, registroId)
                .then(dados => {
                    if (!dados) {
                        exibirNotificacao("Registro não encontrado", "error");
                        return;
                    }

                    // Carregar formulário correspondente
                    carregarFormulario(tipo);

                    // Aguardar um pouco para garantir que o DOM foi atualizado
                    setTimeout(() => {
                        try {
                            // Preencher dados no formulário
                            preencherDadosFormulario(tipo, dados);

                            // Calcular resultados com base nos dados carregados
                            calcular(tipo);

                            exibirNotificacao("Registro carregado para edição", "info");
                        } catch (error) {
                             console.error("Erro ao preencher ou calcular após carregar registro:", error);
                             exibirNotificacao("Erro ao carregar dados do registro no formulário.", "error");
                        }
                    }, 200); // Pequeno delay
                })
                .catch(error => {
                    console.error("Erro ao carregar registro para edição:", error);
                    exibirNotificacao(`Erro ao carregar registro: ${error.message || error}`, "error");
                });
        }

        // Preencher dados do formulário ao carregar para edição (ATUALIZADO para estrutura com arrays)
        function preencherDadosFormulario(tipo, dados) {
            const form = document.querySelector(".calculadora-container");
            if (!form || !dados) return;

            // Preencher campos comuns
            const idSuffix = tipo === 'in-situ' ? '' : `-${tipo}`;
            setFieldValue(`#registro${idSuffix}`, dados.registro);
            setFieldValue(`#data${idSuffix}`, dados.data);
            setFieldValue(`#operador${idSuffix}`, dados.operador);
            setFieldValue(`#material${idSuffix}`, dados.material);
            setFieldValue(`#origem${idSuffix}`, dados.origem);

            switch (tipo) {
                case "in-situ":
                    // Informações gerais
                    setFieldValue("#responsavel", dados.responsavel);
                    setFieldValue("#verificador", dados.verificador);
                    setFieldValue("#norte", dados.norte);
                    setFieldValue("#este", dados.este);
                    setFieldValue("#cota", dados.cota);
                    setFieldValue("#quadrante", dados.quadrante);
                    setFieldValue("#camada", dados.camada);
                    setFieldValue("#hora", dados.hora);

                    // Dispositivos
                    setFieldValue("#balanca", dados.balanca);
                    setFieldValue("#estufa", dados.estufa);

                    // Referências (Selecionar valor no dropdown)
                    const selectReal = form.querySelector("#registro-densidade-real");
                    if (selectReal) selectReal.value = dados.registroDensidadeReal || "";
                    const selectMaxMin = form.querySelector("#registro-densidade-max-min");
                    if (selectMaxMin) selectMaxMin.value = dados.registroDensidadeMaxMin || "";

                    // Densidade in situ (Array 'determinacoesInSitu')
                    if (dados.determinacoesInSitu && Array.isArray(dados.determinacoesInSitu)) {
                        dados.determinacoesInSitu.forEach((det, index) => {
                            const i = index + 1;
                            setFieldValue(`#numero-cilindro-${i}`, det.numeroCilindro);
                            setFieldValue(`#molde-solo-${i}`, det.moldeSolo, 2);
                            setFieldValue(`#molde-${i}`, det.molde, 2);
                            setFieldValue(`#volume-${i}`, det.volume, 2); // Preencher volume
                        });
                    }

                    // Umidade - Topo (Array 'determinacoesUmidadeTopo')
                    if (dados.determinacoesUmidadeTopo && Array.isArray(dados.determinacoesUmidadeTopo)) {
                        dados.determinacoesUmidadeTopo.forEach((det, index) => {
                            const i = index + 1;
                            setFieldValue(`#capsula-numero-topo-${i}`, det.capsula);
                            setFieldValue(`#solo-umido-tara-topo-${i}`, det.soloUmidoTara, 2);
                            setFieldValue(`#solo-seco-tara-topo-${i}`, det.soloSecoTara, 2);
                            setFieldValue(`#tara-topo-${i}`, det.tara, 2);
                        });
                    }

                    // Umidade - Base (Array 'determinacoesUmidadeBase')
                    if (dados.determinacoesUmidadeBase && Array.isArray(dados.determinacoesUmidadeBase)) {
                        dados.determinacoesUmidadeBase.forEach((det, index) => {
                            const i = index + 1;
                            setFieldValue(`#capsula-numero-base-${i}`, det.capsula);
                            setFieldValue(`#solo-umido-tara-base-${i}`, det.soloUmidoTara, 2);
                            setFieldValue(`#solo-seco-tara-base-${i}`, det.soloSecoTara, 2);
                            setFieldValue(`#tara-base-${i}`, det.tara, 2);
                        });
                    }
                    // Campos de resultado serão preenchidos por preencherResultados após cálculo
                    break;

                 case "real":
                    // Umidade (Array 'determinacoesUmidadeReal')
                    if (dados.determinacoesUmidadeReal && Array.isArray(dados.determinacoesUmidadeReal)) {
                        dados.determinacoesUmidadeReal.forEach((det, index) => {
                            const i = index + 1;
                            setFieldValue(`#capsula-real-${i}`, det.capsula);
                            setFieldValue(`#solo-umido-tara-real-${i}`, det.soloUmidoTara, 2);
                            setFieldValue(`#solo-seco-tara-real-${i}`, det.soloSecoTara, 2);
                            setFieldValue(`#tara-real-${i}`, det.tara, 2);
                        });
                    }
                    // Picnômetro (Array 'determinacoesPicnometro')
                    if (dados.determinacoesPicnometro && Array.isArray(dados.determinacoesPicnometro)) {
                        dados.determinacoesPicnometro.forEach((det, index) => {
                            const i = index + 1;
                            setFieldValue(`#picnometro-${i}`, det.picnometro);
                            setFieldValue(`#massa-pic-${i}`, det.massaPic, 2);
                            setFieldValue(`#massa-pic-amostra-agua-${i}`, det.massaPicAmostraAgua, 2);
                            setFieldValue(`#temperatura-${i}`, det.temperatura, 1);
                            setFieldValue(`#massa-pic-agua-${i}`, det.massaPicAgua, 2);
                            setFieldValue(`#massa-solo-umido-${i}`, det.massaSoloUmido, 2);
                        });
                    }
                    break;

                case "max-min":
                     // Densidade máxima (Array 'determinacoesMax')
                    if (dados.determinacoesMax && Array.isArray(dados.determinacoesMax)) {
                        dados.determinacoesMax.forEach((det, index) => {
                            const i = index + 1;
                            setFieldValue(`#molde-solo-max-${i}`, det.moldeSolo, 2);
                            setFieldValue(`#molde-max-${i}`, det.molde, 2);
                            setFieldValue(`#volume-max-${i}`, det.volume, 2);
                            setFieldValue(`#w-max-${i}`, det.w, 1);
                        });
                    }
                    // Densidade mínima (Array 'determinacoesMin')
                    if (dados.determinacoesMin && Array.isArray(dados.determinacoesMin)) {
                        dados.determinacoesMin.forEach((det, index) => {
                            const i = index + 1;
                            setFieldValue(`#numero-cilindro-min-${i}`, det.numeroCilindro);
                            setFieldValue(`#molde-solo-min-${i}`, det.moldeSolo, 2);
                            setFieldValue(`#molde-min-${i}`, det.molde, 2);
                            setFieldValue(`#volume-min-${i}`, det.volume, 2);
                            setFieldValue(`#w-min-${i}`, det.w, 1);
                        });
                    }
                    break;
            }
        }

        // Inicialização (pode ser chamada pelo app.js)
        function init() {
            // Configurações iniciais, se houver
        }

        // Expor funções públicas
        return {
            carregarFormulario,
            obterDadosFormulario,
            preencherResultados,
            salvar,
            gerarPDF,
            limpar,
            exibirNotificacao,
            carregarRegistroParaEdicao,
            init
        };
    })();

    // Inicializar integração se necessário (geralmente feito pelo app.js)
    // window.calculadora.formIntegration.init();
});

