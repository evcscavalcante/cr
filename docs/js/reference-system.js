// Módulo de integração de formulários para a Calculadora de Compacidade
// Implementa a integração entre os formulários e os módulos de cálculo e banco de dados

document.addEventListener("DOMContentLoaded", () => {
    // Namespace para calculadora
    window.calculadora = window.calculadora || {};

    // Módulo de integração de formulários
    window.calculadora.formIntegration = (() => {

        // *** ADICIONADO: Variável para armazenar o último estado de resultados calculados ***
        let ultimosResultadosCalculados = {};

        // Carregar formulário
        function carregarFormulario(tipo) {
            const calculadora = document.getElementById("calculadora");
            if (!calculadora) return;

            // Limpar conteúdo atual
            calculadora.innerHTML = "";
            // Limpar estado de resultados para o tipo ao carregar novo formulário
            ultimosResultadosCalculados[tipo] = null;

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

        // Calcular resultados (chamado automaticamente por calculos.js)
        // function calcular(tipo) { ... } // Removido pois calculos.js chama calcularAutomaticamente

        // Salvar registro
        function salvar(tipo) {
            if (!window.calculadora.db) {
                console.error("Módulo de banco de dados não disponível");
                exibirNotificacao("Erro: Banco de dados não disponível", "error");
                return;
            }

            try {
                // Obter dados do formulário (apenas inputs)
                const dadosInputs = obterDadosFormulario(tipo);
                if (!dadosInputs) return; // Erro ao obter dados já notificado

                // Validar registro
                if (!dadosInputs.registro) {
                    exibirNotificacao("Informe o número de registro", "warning");
                    const registroInput = document.querySelector(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`);
                    if (registroInput) registroInput.focus();
                    return;
                }

                // LOG: Dados a serem salvos (apenas inputs)
                console.log('[LOG][form-integration.js -> salvar] Dados a serem salvos (inputs):', JSON.stringify(dadosInputs));

                // Salvar registro (apenas inputs)
                window.calculadora.db.salvarRegistro(tipo, dadosInputs)
                    .then(() => {
                        exibirNotificacao("Registro salvo com sucesso", "success");
                        // Atualizar listas etc.
                        if ((tipo === "real" || tipo === "max-min") && window.calculadora.referenceSystem && typeof window.calculadora.referenceSystem.atualizarSeletoresReferencia === 'function') {
                           window.calculadora.referenceSystem.atualizarSeletoresReferencia();
                        }
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

        // *** MODIFICADO: Gerar PDF usando estado consistente ***
        function gerarPDF(tipo) {
            if (!window.calculadora.pdfGenerator) {
                console.error("Módulo de geração de PDF não disponível");
                exibirNotificacao("Erro: Gerador de PDF não disponível", "error");
                return;
            }

            try {
                // Obter dados de INPUT do formulário
                const dadosInputs = obterDadosFormulario(tipo);
                if (!dadosInputs) return;

                 // Validar registro antes de gerar PDF
                if (!dadosInputs.registro) {
                    exibirNotificacao("Informe o número de registro para gerar o PDF", "warning");
                     const registroInput = document.querySelector(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`);
                    if (registroInput) registroInput.focus();
                    return;
                }

                // *** MUDANÇA PRINCIPAL: Usar os últimos resultados calculados armazenados no estado ***
                const resultados = ultimosResultadosCalculados[tipo];
                if (!resultados) {
                    // Se não houver resultados armazenados (ex: formulário recém-carregado ou erro no cálculo),
                    // exibir aviso para calcular primeiro.
                    console.warn("Últimos resultados não encontrados no estado para gerar o PDF.");
                    exibirNotificacao("Erro: Calcule ou verifique os dados antes de gerar o PDF.", "warning");
                    return;
                }

                // Combinar inputs e resultados do estado
                const dadosCompletos = { ...dadosInputs, ...resultados };

                // LOG: Dados completos para PDF (usando estado)
                console.log('[LOG][form-integration.js -> gerarPDF] Dados completos (usando estado) para PDF:', JSON.stringify(dadosCompletos));

                // Gerar PDF com os dados consistentes
                window.calculadora.pdfGenerator.gerarPDF(tipo, dadosCompletos)
                    .then(() => {
                        // Notificação pode ser tratada dentro do pdfGenerator ou aqui
                        exibirNotificacao("PDF gerado com sucesso!", "success");
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

            // Limpar estado de resultados
            ultimosResultadosCalculados[tipo] = null;

            exibirNotificacao("Formulário limpo", "info");
            // Recalcular após limpar para zerar os campos dependentes e atualizar estado
            // Usar um pequeno timeout para garantir que o DOM está pronto
            setTimeout(() => {
                 if (window.calculadora.calculos && typeof window.calculadora.calculos.calcularAutomaticamente === 'function') {
                    window.calculadora.calculos.calcularAutomaticamente(tipo);
                 }
            }, 50);
        }

        // Função auxiliar para obter valor float de um campo
        function getFloatValue(selector) {
            const element = document.querySelector(selector);
            return parseFloat(element ? element.value.replace(/\s/g, '').replace(',', '.') : 0) || 0;
        }

        // Função auxiliar para obter valor string de um campo
        function getStringValue(selector) {
            const element = document.querySelector(selector);
            return element ? element.value.trim() : "";
        }

        // Obter dados do formulário (apenas inputs)
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

                // Obter valores específicos por tipo (apenas inputs)
                switch (tipo) {
                    case "in-situ":
                        dados.responsavel = getStringValue("#responsavel");
                        dados.verificador = getStringValue("#verificador");
                        dados.norte = getStringValue("#norte");
                        dados.este = getStringValue("#este");
                        dados.cota = getStringValue("#cota");
                        dados.quadrante = getStringValue("#quadrante");
                        dados.camada = getStringValue("#camada");
                        dados.hora = getStringValue("#hora");
                        dados.balanca = getStringValue("#balanca");
                        dados.estufa = getStringValue("#estufa");
                        dados.registroDensidadeReal = getStringValue("#registro-densidade-real");
                        dados.registroDensidadeMaxMin = getStringValue("#registro-densidade-max-min");
                        dados.determinacoesInSitu = [];
                        for (let i = 1; i <= 2; i++) {
                            dados.determinacoesInSitu.push({
                                numeroCilindro: getStringValue(`#numero-cilindro-${i}`),
                                moldeSolo: getFloatValue(`#molde-solo-${i}`),
                                molde: getFloatValue(`#molde-${i}`),
                                volume: getFloatValue(`#volume-${i}`)
                            });
                        }
                        dados.determinacoesUmidadeTopo = [];
                        for (let i = 1; i <= 3; i++) {
                            dados.determinacoesUmidadeTopo.push({
                                capsula: getStringValue(`#capsula-numero-topo-${i}`),
                                soloUmidoTara: getFloatValue(`#solo-umido-tara-topo-${i}`),
                                soloSecoTara: getFloatValue(`#solo-seco-tara-topo-${i}`),
                                tara: getFloatValue(`#tara-topo-${i}`)
                            });
                        }
                        dados.determinacoesUmidadeBase = [];
                        for (let i = 1; i <= 3; i++) {
                            dados.determinacoesUmidadeBase.push({
                                capsula: getStringValue(`#capsula-numero-base-${i}`),
                                soloUmidoTara: getFloatValue(`#solo-umido-tara-base-${i}`),
                                soloSecoTara: getFloatValue(`#solo-seco-tara-base-${i}`),
                                tara: getFloatValue(`#tara-base-${i}`)
                            });
                        }
                        // Obter referências do sistema de referência (se existir)
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
                        dados.determinacoesUmidadeReal = [];
                        for (let i = 1; i <= 3; i++) {
                            dados.determinacoesUmidadeReal.push({
                                capsula: getStringValue(`#capsula-real-${i}`),
                                soloUmidoTara: getFloatValue(`#solo-umido-tara-real-${i}`),
                                soloSecoTara: getFloatValue(`#solo-seco-tara-real-${i}`),
                                tara: getFloatValue(`#tara-real-${i}`)
                            });
                        }
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
                        dados.determinacoesMax = [];
                        for (let i = 1; i <= 3; i++) {
                            dados.determinacoesMax.push({
                                moldeSolo: getFloatValue(`#molde-solo-max-${i}`),
                                molde: getFloatValue(`#molde-max-${i}`),
                                volume: getFloatValue(`#volume-max-${i}`),
                                w: getFloatValue(`#w-max-${i}`)
                            });
                        }
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

                // LOG: Dados lidos da UI (inputs)
                console.log(`[LOG][form-integration.js -> obterDadosFormulario (${tipo})] Dados lidos da UI (inputs):`, JSON.stringify(dados));
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
                    formattedValue = value.toFixed(precision);
                } else if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
                    formattedValue = element.placeholder === "0.0" || element.placeholder === "0.00" || element.placeholder === "0.000" || element.placeholder === "0.0000" ? element.placeholder : "";
                }
                element.value = formattedValue;
            } else {
                // console.warn(`Elemento não encontrado para setFieldValue: ${selector}`);
            }
        }

        // Preencher resultados no formulário (usando dados do estado)
        function preencherResultados(tipo, resultados) {
            // LOG: Resultados a serem preenchidos na UI (vindos do estado)
            console.log(`[LOG][form-integration.js -> preencherResultados (${tipo})] Resultados a serem preenchidos na UI (do estado):`, JSON.stringify(resultados));

            const form = document.querySelector(".calculadora-container");
            if (!form) return;

            // Se resultados for null (ex: erro no cálculo ou limpar), limpa os campos calculados
            if (!resultados) {
                const calculados = form.querySelectorAll("input[readonly]");
                calculados.forEach(input => {
                    input.value = input.placeholder === "0.0" || input.placeholder === "0.00" || input.placeholder === "0.000" || input.placeholder === "0.0000" ? input.placeholder : "";
                });
                 const statusEnsaio = form.querySelector("#status-ensaio");
                 if (statusEnsaio) {
                    statusEnsaio.textContent = "ERRO OU DADOS INVÁLIDOS";
                    statusEnsaio.className = "status-ensaio status-erro";
                 }
                return;
            }

            try {
                switch (tipo) {
                    case "in-situ":
                        if (resultados.determinacoesInSitu) {
                            resultados.determinacoesInSitu.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#solo-${i}`, det.solo, 2);
                                setFieldValue(`#gama-nat-${i}`, det.gamaNat, 3);
                            });
                        }
                        if (resultados.determinacoesUmidadeTopo) {
                            resultados.determinacoesUmidadeTopo.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#solo-seco-topo-${i}`, det.soloSeco, 2);
                                setFieldValue(`#agua-topo-${i}`, det.agua, 2);
                                setFieldValue(`#umidade-topo-${i}`, det.umidade, 1);
                            });
                        }
                        setFieldValue("#umidade-media-topo", resultados.umidadeMediaTopo, 1);
                        if (resultados.determinacoesUmidadeBase) {
                            resultados.determinacoesUmidadeBase.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#solo-seco-base-${i}`, det.soloSeco, 2);
                                setFieldValue(`#agua-base-${i}`, det.agua, 2);
                                setFieldValue(`#umidade-base-${i}`, det.umidade, 1);
                            });
                        }
                        setFieldValue("#umidade-media-base", resultados.umidadeMediaBase, 1);
                        setFieldValue("#gamad-topo", resultados.gamadTopo, 3);
                        setFieldValue("#gamad-base", resultados.gamadBase, 3);
                        setFieldValue("#indice-vazios-topo", resultados.indiceVaziosTopo, 2);
                        setFieldValue("#indice-vazios-base", resultados.indiceVaziosBase, 2);
                        setFieldValue("#cr-topo", resultados.crTopo, 1);
                        setFieldValue("#cr-base", resultados.crBase, 1);
                        const statusEnsaio = form.querySelector("#status-ensaio");
                        if (statusEnsaio && resultados.status) {
                            statusEnsaio.textContent = resultados.status;
                            statusEnsaio.className = `status-ensaio status-${resultados.status.toLowerCase().replace(/[ /]/g, '-')}`;
                        }
                        break;
                    case "real":
                        if (resultados.determinacoesUmidadeReal) {
                            resultados.determinacoesUmidadeReal.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#solo-seco-real-${i}`, det.soloSeco, 2);
                                setFieldValue(`#agua-real-${i}`, det.agua, 2);
                                setFieldValue(`#umidade-real-${i}`, det.umidade, 1);
                            });
                        }
                        setFieldValue("#umidade-media-real", resultados.umidadeMedia, 1);
                        if (resultados.determinacoesPicnometro) {
                            resultados.determinacoesPicnometro.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#densidade-agua-${i}`, det.densidadeAgua, 4);
                                setFieldValue(`#massa-solo-seco-${i}`, det.massaSoloSeco, 2);
                                setFieldValue(`#densidade-real-${i}`, det.densidadeReal, 3);
                            });
                        }
                        setFieldValue("#diferenca-real", resultados.diferenca, 1);
                        setFieldValue("#media-densidade-real", resultados.mediaDensidadeReal, 3);
                        break;
                    case "max-min":
                        if (resultados.determinacoesMax) {
                            resultados.determinacoesMax.forEach((det, index) => {
                                const i = index + 1;
                                setFieldValue(`#solo-max-${i}`, det.solo, 2);
                                setFieldValue(`#gamad-max-${i}`, det.gamad, 3);
                                setFieldValue(`#gamas-max-${i}`, det.gamas, 3);
                            });
                        }
                        setFieldValue("#gamad-max", resultados.mediaGamadMax, 3);
                        if (resultados.determinacoesMin) {
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

        // Exibir notificação (sem alterações)
        function exibirNotificacao(mensagem, tipo) {
            let toastContainer = document.querySelector(".toast-container");
            if (!toastContainer) {
                toastContainer = document.createElement("div");
                toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3";
                toastContainer.style.zIndex = "1055";
                document.body.appendChild(toastContainer);
            }
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
            toastContainer.insertAdjacentHTML('beforeend', toastHTML);
            const toastElement = document.getElementById(toastId);
            if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
                 const toastInstance = new bootstrap.Toast(toastElement, { delay: 3000 });
                 toastInstance.show();
                 toastElement.addEventListener('hidden.bs.toast', () => {
                     toastElement.remove();
                 });
            } else {
                 console.warn("Bootstrap Toast JS não encontrado. Exibindo notificação simples.");
                 toastElement.style.display = 'block';
                 toastElement.style.opacity = 1;
                 setTimeout(() => {
                     toastElement.style.transition = 'opacity 0.5s ease-out';
                     toastElement.style.opacity = 0;
                     setTimeout(() => toastElement.remove(), 500);
                 }, 3000);
            }
        }

        // *** ADICIONADO: Função para atualizar o estado dos resultados ***
        function setUltimosResultados(tipo, resultados) {
            console.log(`[LOG][form-integration.js -> setUltimosResultados (${tipo})] Atualizando estado com resultados:`, JSON.stringify(resultados));
            ultimosResultadosCalculados[tipo] = resultados;
        }

        // API pública
        return {
            carregarFormulario,
            salvar,
            gerarPDF, // Função modificada
            limpar,
            obterDadosFormulario,
            preencherResultados,
            setUltimosResultados, // Nova função exposta
            exibirNotificacao // Expor para uso em outros módulos se necessário
        };
    })();
});

