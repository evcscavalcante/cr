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
                // A função original foi removida ou renomeada em db.js, usar a nova estrutura se disponível
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
            // Botão de calcular (Removido pois o cálculo é automático)
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

        // Calcular resultados (agora chamado automaticamente)
        function calcular(tipo) {
             if (!window.calculadora.calculos) {
                console.error("Módulo de cálculos não disponível");
                return;
            }
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
                if (!dados) return;

                // Validar registro
                if (!dados.registro) {
                    exibirNotificacao("Informe o número de registro", "warning");
                    // Focar no campo de registro
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

                // Gerar PDF
                window.calculadora.pdfGenerator.gerarPDF(tipo, dados)
                    .then(() => {
                        // A notificação de sucesso é geralmente tratada dentro do pdfGenerator
                        // exibirNotificacao("PDF gerado com sucesso", "success");
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

            // Limpar campos calculados
            const calculados = form.querySelectorAll("input[readonly]");
            calculados.forEach(input => {
                // Definir como vazio ou placeholder padrão se houver
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
            setTimeout(() => calcular(tipo), 100);
        }

        // Função auxiliar para obter valor float de um campo
        function getFloatValue(selector) {
            const element = document.querySelector(selector);
            return parseFloat(element ? element.value.replace(',', '.') : 0) || 0; // Trata vírgula como decimal e retorna 0 se inválido/vazio
        }

        // Função auxiliar para obter valor string de um campo
        function getStringValue(selector) {
            const element = document.querySelector(selector);
            return element ? element.value : "";
        }

        // Obter dados do formulário (Atualizado para múltiplas determinações)
        function obterDadosFormulario(tipo) {
            const form = document.querySelector(".calculadora-container");
            if (!form) return null;

            const dados = {};

            // Obter valores comuns
            dados.registro = getStringValue(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`);
            dados.data = getStringValue(`#data${tipo === 'in-situ' ? '' : `-${tipo}`}`);
            dados.operador = getStringValue(`#operador${tipo === 'in-situ' ? '' : `-${tipo}`}`);
            dados.material = getStringValue(`#material${tipo === 'in-situ' ? '' : `-${tipo}`}`);
            dados.origem = getStringValue(`#origem${tipo === 'in-situ' ? '' : `-${tipo}`}`);

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
                    for (let i = 1; i <= 2; i++) {
                        dados[`numeroCilindro-${i}`] = getStringValue(`#numero-cilindro-${i}`);
                        dados[`moldeSolo-${i}`] = getFloatValue(`#molde-solo-${i}`);
                        dados[`molde-${i}`] = getFloatValue(`#molde-${i}`);
                        // Solo, Volume, GamaNat são calculados, não lidos diretamente do input (a menos que sejam editáveis)
                        // Se forem campos readonly preenchidos pelo cálculo, não precisam ser lidos aqui.
                        // Se forem inputs editáveis, descomente as linhas abaixo:
                        // dados[`solo-${i}`] = getFloatValue(`#solo-${i}`);
                        // dados[`volume-${i}`] = getFloatValue(`#volume-${i}`);
                        // dados[`gamaNat-${i}`] = getFloatValue(`#gama-nat-${i}`);
                    }

                    // Umidade - Topo (3 Determinações)
                    for (let i = 1; i <= 3; i++) {
                        dados[`capsulaTopo-${i}`] = getStringValue(`#capsula-topo-${i}`);
                        dados[`soloUmidoTaraTopo-${i}`] = getFloatValue(`#solo-umido-tara-topo-${i}`);
                        dados[`soloSecoTaraTopo-${i}`] = getFloatValue(`#solo-seco-tara-topo-${i}`);
                        dados[`taraTopo-${i}`] = getFloatValue(`#tara-topo-${i}`);
                         // SoloSeco, Agua, Umidade são calculados
                        // dados[`soloSecoTopo-${i}`] = getFloatValue(`#solo-seco-topo-${i}`);
                        // dados[`aguaTopo-${i}`] = getFloatValue(`#agua-topo-${i}`);
                        // dados[`umidadeTopo-${i}`] = getFloatValue(`#umidade-topo-${i}`);
                    }
                    // Umidade Média Topo é calculada
                    // dados.umidadeMediaTopo = getFloatValue("#umidade-media-topo");

                    // Umidade - Base (3 Determinações)
                    for (let i = 1; i <= 3; i++) {
                        dados[`capsulaBase-${i}`] = getStringValue(`#capsula-base-${i}`);
                        dados[`soloUmidoTaraBase-${i}`] = getFloatValue(`#solo-umido-tara-base-${i}`);
                        dados[`soloSecoTaraBase-${i}`] = getFloatValue(`#solo-seco-tara-base-${i}`);
                        dados[`taraBase-${i}`] = getFloatValue(`#tara-base-${i}`);
                         // SoloSeco, Agua, Umidade são calculados
                        // dados[`soloSecoBase-${i}`] = getFloatValue(`#solo-seco-base-${i}`);
                        // dados[`aguaBase-${i}`] = getFloatValue(`#agua-base-${i}`);
                        // dados[`umidadeBase-${i}`] = getFloatValue(`#umidade-base-${i}`);
                    }
                     // Umidade Média Base é calculada
                    // dados.umidadeMediaBase = getFloatValue("#umidade-media-base");

                    // Resultados (Gamad, Indice Vazios, CR, Status são calculados)
                    // Não é necessário ler os campos de resultado aqui, eles são preenchidos por preencherResultados

                    // Obter valores de referência do sistema de referência (se existir)
                    if (window.calculadora.referenceSystem) {
                         if (dados.registroDensidadeReal) {
                            dados.densidadeReal = window.calculadora.referenceSystem.getDensidadeReal(dados.registroDensidadeReal);
                         }
                         if (dados.registroDensidadeMaxMin) {
                            const refMaxMin = window.calculadora.referenceSystem.getDensidadeMaxMin(dados.registroDensidadeMaxMin);
                            if (refMaxMin) {
                                dados.gamadMax = refMaxMin.gamadMax;
                                dados.gamadMin = refMaxMin.gamadMin;
                            }
                         }
                    } else {
                        console.warn("Módulo referenceSystem não encontrado para obter dados de referência.");
                    }
                    break;

                case "real": // Manter lógica original, pois não foi mencionada alteração
                    // Umidade
                    for (let i = 1; i <= 3; i++) {
                        dados[`capsulaReal${i}`] = getStringValue(`#capsula-real-${i}`);
                        dados[`soloUmidoTaraReal${i}`] = getFloatValue(`#solo-umido-tara-real-${i}`);
                        dados[`soloSecoTaraReal${i}`] = getFloatValue(`#solo-seco-tara-real-${i}`);
                        dados[`taraReal${i}`] = getFloatValue(`#tara-real-${i}`);
                        // Calculados: soloSecoReal, aguaReal, umidadeReal
                    }
                    // Calculado: umidadeMediaReal

                    // Picnômetro (apenas 2 determinações)
                    for (let i = 1; i <= 2; i++) {
                        dados[`picnometro${i}`] = getStringValue(`#picnometro-${i}`);
                        dados[`massaPic${i}`] = getFloatValue(`#massa-pic-${i}`);
                        dados[`massaPicAmostraAgua${i}`] = getFloatValue(`#massa-pic-amostra-agua-${i}`);
                        dados[`temperatura${i}`] = getFloatValue(`#temperatura-${i}`);
                        dados[`massaPicAgua${i}`] = getFloatValue(`#massa-pic-agua-${i}`);
                        dados[`massaSoloUmido${i}`] = getFloatValue(`#massa-solo-umido-${i}`);
                         // Calculados: densidadeAgua, massaSoloSeco, densidadeReal
                    }

                    // Resultados (Calculados: diferencaReal, mediaDensidadeReal)
                    break;

                case "max-min": // Manter lógica original, pois não foi mencionada alteração
                    // Densidade máxima
                    for (let i = 1; i <= 3; i++) {
                        dados[`moldeSoloMax${i}`] = getFloatValue(`#molde-solo-max-${i}`);
                        dados[`moldeMax${i}`] = getFloatValue(`#molde-max-${i}`);
                        dados[`volumeMax${i}`] = getFloatValue(`#volume-max-${i}`);
                        dados[`wMax${i}`] = getFloatValue(`#w-max-${i}`);
                         // Calculados: soloMax, gamadMax, gamasMax
                    }
                    // Calculado: gamadMax (média)

                    // Densidade mínima
                    for (let i = 1; i <= 3; i++) {
                        dados[`numeroCilindroMin${i}`] = getStringValue(`#numero-cilindro-min-${i}`);
                        dados[`moldeSoloMin${i}`] = getFloatValue(`#molde-solo-min-${i}`);
                        dados[`moldeMin${i}`] = getFloatValue(`#molde-min-${i}`);
                        dados[`volumeMin${i}`] = getFloatValue(`#volume-min-${i}`);
                        dados[`wMin${i}`] = getFloatValue(`#w-min-${i}`);
                        // Calculados: soloMin, gamadMin, gamasMin
                    }
                    // Calculado: gamadMin (média)
                    break;

                default:
                    console.error(`Tipo de ensaio inválido: ${tipo}`);
                    return null;
            }

            return dados;
        }

        // Função auxiliar para definir valor em um campo
        function setFieldValue(selector, value, precision = null) {
            const element = document.querySelector(selector);
            if (element) {
                let formattedValue = value;
                if (typeof value === 'number' && !isNaN(value) && precision !== null) {
                    formattedValue = value.toFixed(precision);
                } else if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
                    // Se o valor for nulo, indefinido ou NaN, limpar o campo ou usar placeholder
                    formattedValue = element.placeholder === "0.0" || element.placeholder === "0.00" || element.placeholder === "0.000" || element.placeholder === "0.0000" ? element.placeholder : "";
                }
                element.value = formattedValue;
            }
        }

        // Preencher resultados no formulário (Atualizado para múltiplas determinações)
        function preencherResultados(tipo, resultados) {
            if (!resultados) return;

            const form = document.querySelector(".calculadora-container");
            if (!form) return;

            switch (tipo) {
                case "in-situ":
                    // Densidade in situ (2 Determinações)
                    resultados.determinacoesInSitu.forEach((det, index) => {
                        const i = index + 1;
                        setFieldValue(`#solo-${i}`, det.solo, 2);
                        setFieldValue(`#gama-nat-${i}`, det.gamaNat, 3);
                        // Preencher outros campos da determinação se necessário (ex: numeroCilindro, moldeSolo, molde, volume)
                        // setFieldValue(`#numero-cilindro-${i}`, det.numeroCilindro);
                        // setFieldValue(`#molde-solo-${i}`, det.moldeSolo, 2);
                        // setFieldValue(`#molde-${i}`, det.molde, 2);
                        // setFieldValue(`#volume-${i}`, det.volume, 2);
                    });

                    // Umidade - Topo (3 Determinações)
                    resultados.determinacoesUmidadeTopo.forEach((det, index) => {
                        const i = index + 1;
                        setFieldValue(`#solo-seco-topo-${i}`, det.soloSeco, 2);
                        setFieldValue(`#agua-topo-${i}`, det.agua, 2);
                        setFieldValue(`#umidade-topo-${i}`, det.umidade, 1);
                         // Preencher outros campos da determinação se necessário (ex: capsula, soloUmidoTara, soloSecoTara, tara)
                        // setFieldValue(`#capsula-topo-${i}`, det.capsula);
                        // setFieldValue(`#solo-umido-tara-topo-${i}`, det.soloUmidoTara, 2);
                        // setFieldValue(`#solo-seco-tara-topo-${i}`, det.soloSecoTara, 2);
                        // setFieldValue(`#tara-topo-${i}`, det.tara, 2);
                    });
                    setFieldValue("#umidade-media-topo", resultados.umidadeMediaTopo, 1);

                    // Umidade - Base (3 Determinações)
                    resultados.determinacoesUmidadeBase.forEach((det, index) => {
                        const i = index + 1;
                        setFieldValue(`#solo-seco-base-${i}`, det.soloSeco, 2);
                        setFieldValue(`#agua-base-${i}`, det.agua, 2);
                        setFieldValue(`#umidade-base-${i}`, det.umidade, 1);
                        // Preencher outros campos da determinação se necessário
                        // setFieldValue(`#capsula-base-${i}`, det.capsula);
                        // setFieldValue(`#solo-umido-tara-base-${i}`, det.soloUmidoTara, 2);
                        // setFieldValue(`#solo-seco-tara-base-${i}`, det.soloSecoTara, 2);
                        // setFieldValue(`#tara-base-${i}`, det.tara, 2);
                    });
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
                        statusEnsaio.className = `status-ensaio status-${resultados.status.toLowerCase().replace(/ /g, '-')}`;
                    }
                    break;

                case "real": // Manter lógica original
                     // Umidade
                    for (let i = 0; i < 3; i++) {
                        const idx = i + 1;
                        setFieldValue(`#solo-seco-real-${idx}`, resultados.soloSeco[i], 2);
                        setFieldValue(`#agua-real-${idx}`, resultados.agua[i], 2);
                        setFieldValue(`#umidade-real-${idx}`, resultados.umidade[i], 1);
                    }
                    setFieldValue("#umidade-media-real", resultados.umidadeMedia, 1);

                    // Picnômetro (apenas 2 determinações)
                    for (let i = 0; i < 2; i++) {
                        const idx = i + 1;
                        setFieldValue(`#densidade-agua-${idx}`, resultados.densidadeAgua[i], 4);
                        setFieldValue(`#massa-solo-seco-${idx}`, resultados.massaSoloSeco[i], 2);
                        setFieldValue(`#densidade-real-${idx}`, resultados.densidadeReal[i], 3);
                    }

                    // Resultados
                    setFieldValue("#diferenca-real", resultados.diferenca, 1);
                    setFieldValue("#media-densidade-real", resultados.mediaDensidadeReal, 3);
                    break;

                case "max-min": // Manter lógica original
                    // Densidade máxima
                    for (let i = 0; i < 3; i++) {
                        const idx = i + 1;
                        setFieldValue(`#solo-max-${idx}`, resultados.soloMax[i], 2);
                        setFieldValue(`#gamad-max-${idx}`, resultados.gamadMax[i], 3);
                        setFieldValue(`#gamas-max-${idx}`, resultados.gamasMax[i], 3);
                    }
                    setFieldValue("#gamad-max", resultados.mediaGamadMax, 3);

                    // Densidade mínima
                    for (let i = 0; i < 3; i++) {
                        const idx = i + 1;
                        setFieldValue(`#solo-min-${idx}`, resultados.soloMin[i], 2);
                        setFieldValue(`#gamad-min-${idx}`, resultados.gamadMin[i], 3);
                        setFieldValue(`#gamas-min-${idx}`, resultados.gamasMin[i], 3);
                    }
                    setFieldValue("#gamad-min", resultados.mediaGamadMin, 3);
                    break;

                default:
                    console.error(`Tipo de ensaio inválido: ${tipo}`);
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
                 toastElement.style.opacity = 1;
                 setTimeout(() => {
                     toastElement.style.transition = 'opacity 0.5s ease-out';
                     toastElement.style.opacity = 0;
                     setTimeout(() => toastElement.remove(), 500);
                 }, 3000);
            }
        }

        // Carregar registro para edição (Atualizado para múltiplas determinações)
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
                        // Preencher dados no formulário
                        preencherDadosFormulario(tipo, dados);

                        // Calcular resultados com base nos dados carregados
                        calcular(tipo);

                        exibirNotificacao("Registro carregado para edição", "info");
                    }, 200); // Pequeno delay
                })
                .catch(error => {
                    console.error("Erro ao carregar registro para edição:", error);
                    exibirNotificacao(`Erro ao carregar registro: ${error.message || error}`, "error");
                });
        }

        // Preencher dados do formulário ao carregar para edição (Atualizado)
        function preencherDadosFormulario(tipo, dados) {
            const form = document.querySelector(".calculadora-container");
            if (!form || !dados) return;

            // Preencher campos comuns
            setFieldValue(`#registro${tipo === 'in-situ' ? '' : `-${tipo}`}`, dados.registro);
            setFieldValue(`#data${tipo === 'in-situ' ? '' : `-${tipo}`}`, dados.data);
            setFieldValue(`#operador${tipo === 'in-situ' ? '' : `-${tipo}`}`, dados.operador);
            setFieldValue(`#material${tipo === 'in-situ' ? '' : `-${tipo}`}`, dados.material);
            setFieldValue(`#origem${tipo === 'in-situ' ? '' : `-${tipo}`}`, dados.origem);

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

                    // Densidade in situ (2 Determinações)
                    for (let i = 1; i <= 2; i++) {
                        setFieldValue(`#numero-cilindro-${i}`, dados[`numeroCilindro-${i}`]);
                        setFieldValue(`#molde-solo-${i}`, dados[`moldeSolo-${i}`], 2);
                        setFieldValue(`#molde-${i}`, dados[`molde-${i}`], 2);
                        // Campos calculados (solo, volume, gamaNat) serão preenchidos por preencherResultados
                    }

                    // Umidade - Topo (3 Determinações)
                    for (let i = 1; i <= 3; i++) {
                        setFieldValue(`#capsula-topo-${i}`, dados[`capsulaTopo-${i}`]);
                        setFieldValue(`#solo-umido-tara-topo-${i}`, dados[`soloUmidoTaraTopo-${i}`], 2);
                        setFieldValue(`#solo-seco-tara-topo-${i}`, dados[`soloSecoTaraTopo-${i}`], 2);
                        setFieldValue(`#tara-topo-${i}`, dados[`taraTopo-${i}`], 2);
                         // Campos calculados (soloSeco, agua, umidade) serão preenchidos por preencherResultados
                    }

                    // Umidade - Base (3 Determinações)
                    for (let i = 1; i <= 3; i++) {
                        setFieldValue(`#capsula-base-${i}`, dados[`capsulaBase-${i}`]);
                        setFieldValue(`#solo-umido-tara-base-${i}`, dados[`soloUmidoTaraBase-${i}`], 2);
                        setFieldValue(`#solo-seco-tara-base-${i}`, dados[`soloSecoTaraBase-${i}`], 2);
                        setFieldValue(`#tara-base-${i}`, dados[`taraBase-${i}`], 2);
                        // Campos calculados (soloSeco, agua, umidade) serão preenchidos por preencherResultados
                    }
                    // Campos de resultado (médias, gamad, indice, cr, status) serão preenchidos por preencherResultados
                    break;

                 case "real": // Manter lógica original
                    // Umidade
                    for (let i = 1; i <= 3; i++) {
                        setFieldValue(`#capsula-real-${i}`, dados[`capsulaReal${i}`]);
                        setFieldValue(`#solo-umido-tara-real-${i}`, dados[`soloUmidoTaraReal${i}`], 2);
                        setFieldValue(`#solo-seco-tara-real-${i}`, dados[`soloSecoTaraReal${i}`], 2);
                        setFieldValue(`#tara-real-${i}`, dados[`taraReal${i}`], 2);
                    }
                    // Picnômetro
                    for (let i = 1; i <= 2; i++) {
                        setFieldValue(`#picnometro-${i}`, dados[`picnometro${i}`]);
                        setFieldValue(`#massa-pic-${i}`, dados[`massaPic${i}`], 2);
                        setFieldValue(`#massa-pic-amostra-agua-${i}`, dados[`massaPicAmostraAgua${i}`], 2);
                        setFieldValue(`#temperatura-${i}`, dados[`temperatura${i}`], 1);
                        setFieldValue(`#massa-pic-agua-${i}`, dados[`massaPicAgua${i}`], 2);
                        setFieldValue(`#massa-solo-umido-${i}`, dados[`massaSoloUmido${i}`], 2);
                    }
                    break;

                case "max-min": // Manter lógica original
                     // Densidade máxima
                    for (let i = 1; i <= 3; i++) {
                        setFieldValue(`#molde-solo-max-${i}`, dados[`moldeSoloMax${i}`], 2);
                        setFieldValue(`#molde-max-${i}`, dados[`moldeMax${i}`], 2);
                        setFieldValue(`#volume-max-${i}`, dados[`volumeMax${i}`], 2);
                        setFieldValue(`#w-max-${i}`, dados[`wMax${i}`], 1);
                    }
                    // Densidade mínima
                    for (let i = 1; i <= 3; i++) {
                        setFieldValue(`#numero-cilindro-min-${i}`, dados[`numeroCilindroMin${i}`]);
                        setFieldValue(`#molde-solo-min-${i}`, dados[`moldeSoloMin${i}`], 2);
                        setFieldValue(`#molde-min-${i}`, dados[`moldeMin${i}`], 2);
                        setFieldValue(`#volume-min-${i}`, dados[`volumeMin${i}`], 2);
                        setFieldValue(`#w-min-${i}`, dados[`wMin${i}`], 1);
                    }
                    break;
            }
             // Após preencher os dados base, chamar preencherResultados para popular os campos calculados
             // Isso requer que 'obterDadosFormulario' seja chamado novamente ou que os resultados sejam recalculados
             // A chamada a 'calcular(tipo)' dentro de 'carregarRegistroParaEdicao' já cuida disso.
        }

        // Inicialização
        function init() {
            // A configuração dos cálculos automáticos já é feita no módulo de cálculos
            // A configuração dos botões é feita ao carregar o formulário
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
            carregarRegistroParaEdicao
            // Não precisa expor calcular, preencherDadosFormulario, configurarBotoes, etc.
        };
    })();

    // Inicializar integração se necessário (pode ser feito pelo app.js)
    // window.calculadora.formIntegration.init();
});

