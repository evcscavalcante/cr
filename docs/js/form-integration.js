// Módulo de integração de formulários com o banco de dados e cálculos

window.calculadora = window.calculadora || {};

window.calculadora.formIntegration = (() => {
    const estado = {
        ultimoEnsaioCarregado: {},
        ultimosResultados: {}
    };

    // Função para exibir notificações
    function exibirNotificacao(mensagem, tipo = "info") { // info, success, error, warning
        const container = document.getElementById("notificacoes-container");
        if (!container) {
            console.warn("Container de notificações não encontrado.");
            return;
        }
        const notificacao = document.createElement("div");
        notificacao.className = `notificacao ${tipo}`;
        notificacao.textContent = mensagem;
        container.appendChild(notificacao);
        // Remover após 5 segundos
        setTimeout(() => {
            notificacao.style.opacity = "0";
            setTimeout(() => notificacao.remove(), 500);
        }, 5000);
    }

    // Função auxiliar para obter valor float de um campo
    function getFloatValue(selector) {
        const element = document.querySelector(selector);
        // LOG ADICIONAL para depurar leitura
        if (!element) {
            console.warn(`[LOG][getFloatValue] Elemento NÃO encontrado para o seletor: ${selector}`);
            return 0;
        }
        const rawValue = element.value;
        const cleanedValue = rawValue.replace(/\s/g, ").replace(",", ".");
        const floatValue = parseFloat(cleanedValue);
        // LOG ADICIONAL
        // console.log(`[LOG][getFloatValue] Seletor: ${selector}, Raw: '${rawValue}', Cleaned: '${cleanedValue}', Parsed: ${floatValue}`);
        return isNaN(floatValue) ? 0 : floatValue;
    }

    // Função auxiliar para obter valor string de um campo
    function getStringValue(selector) {
        const element = document.querySelector(selector);
         // LOG ADICIONAL para depurar leitura
        if (!element) {
            console.warn(`[LOG][getStringValue] Elemento NÃO encontrado para o seletor: ${selector}`);
            return "";
        }
        // LOG ADICIONAL
        // console.log(`[LOG][getStringValue] Seletor: ${selector}, Value: '${element.value.trim()}'`);
        return element.value.trim();
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
            const idSuffix = tipo === "in-situ" ? "" : `-${tipo}`;
            // Ajuste para tipo max-min que não tem sufixo nos campos gerais
            const commonSuffix = (tipo === "max-min" || tipo === "real") ? `-${tipo}` : "";
            console.log(`[LOG][obterDadosFormulario] Lendo campos comuns com sufixo: '${commonSuffix}'`);
            dados.registro = getStringValue(`#registro${commonSuffix}`);
            dados.data = getStringValue(`#data${commonSuffix}`);
            dados.operador = getStringValue(`#operador${commonSuffix}`);
            dados.material = getStringValue(`#material${commonSuffix}`);
            dados.origem = getStringValue(`#origem${commonSuffix}`);
            console.log(`[LOG][obterDadosFormulario] Campos comuns lidos:`, JSON.stringify({ registro: dados.registro, data: dados.data, operador: dados.operador, material: dados.material, origem: dados.origem }));

            // Obter valores específicos por tipo (apenas inputs)
            switch (tipo) {
                case "in-situ":
                    // ... (código inalterado para in-situ)
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
                    // ... (código inalterado para real)
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
                    console.log("[LOG][obterDadosFormulario] Lendo dados para tipo: max-min");
                    dados.determinacoesMax = [];
                    for (let i = 1; i <= 3; i++) {
                        console.log(`[LOG][obterDadosFormulario] Lendo determinação Max ${i}`);
                        const detMax = {
                            moldeSolo: getFloatValue(`#molde-solo-max-${i}`),
                            molde: getFloatValue(`#molde-max-${i}`),
                            volume: getFloatValue(`#volume-max-${i}`),
                            w: getFloatValue(`#w-max-${i}`)
                        };
                        console.log(`[LOG][obterDadosFormulario] Valores lidos Max ${i}:`, JSON.stringify(detMax));
                        dados.determinacoesMax.push(detMax);
                    }
                    dados.determinacoesMin = [];
                    for (let i = 1; i <= 3; i++) {
                        console.log(`[LOG][obterDadosFormulario] Lendo determinação Min ${i}`);
                        const detMin = {
                            numeroCilindro: getStringValue(`#numero-cilindro-min-${i}`),
                            moldeSolo: getFloatValue(`#molde-solo-min-${i}`),
                            molde: getFloatValue(`#molde-min-${i}`),
                            volume: getFloatValue(`#volume-min-${i}`),
                            w: getFloatValue(`#w-min-${i}`)
                        };
                        console.log(`[LOG][obterDadosFormulario] Valores lidos Min ${i}:`, JSON.stringify(detMin));
                        dados.determinacoesMin.push(detMin);
                    }
                    break;
                default:
                    console.error(`Tipo de ensaio inválido ao obter dados: ${tipo}`);
                    exibirNotificacao(`Erro interno: Tipo de ensaio desconhecido (${tipo}).`, "error");
                    return null;
            }

            // LOG FINAL: Dados lidos da UI (inputs)
            console.log(`[LOG][form-integration.js -> obterDadosFormulario (${tipo})] Dados FINAIS lidos da UI (inputs):`, JSON.stringify(dados));
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
            if (typeof value === "number" && !isNaN(value) && precision !== null) {
                formattedValue = value.toFixed(precision);
            } else if (value === null || value === undefined || (typeof value === "number" && isNaN(value))) {
                // Usar placeholder como default se for numérico, senão vazio
                const placeholderValue = element.placeholder;
                formattedValue = (placeholderValue === "0.0" || placeholderValue === "0.00" || placeholderValue === "0.000" || placeholderValue === "0.0000") ? placeholderValue : "";
            }
            element.value = formattedValue;
        } else {
            // console.warn(`Elemento não encontrado para setFieldValue: ${selector}`);
        }
    }

    // Preencher resultados no formulário (usando dados do estado)
    function preencherResultados(tipo, resultados) {
        // LOG: Resultados a serem preenchidos na UI (vindos do estado)
        console.log(`[LOG][form-integration.js -> preencherResultados (${tipo})] Resultados recebidos para preencher UI:`, JSON.stringify(resultados));

        const form = document.querySelector(".calculadora-container");
        if (!form) return;

        // Se resultados for null (ex: erro no cálculo ou limpar), limpa os campos calculados
        if (!resultados) {
            console.log(`[LOG][preencherResultados (${tipo})] Resultados nulos. Limpando campos readonly.`);
            const calculados = form.querySelectorAll("input[readonly]");
            calculados.forEach(input => {
                const placeholderValue = input.placeholder;
                input.value = (placeholderValue === "0.0" || placeholderValue === "0.00" || placeholderValue === "0.000" || placeholderValue === "0.0000") ? placeholderValue : "";
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
                    // ... (código inalterado)
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
                        statusEnsaio.className = `status-ensaio status-${resultados.status.toLowerCase().replace(/[ /]/g, "-")}`;
                    }
                    break;
                case "real":
                     // ... (código inalterado)
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
                    console.log(`[LOG][preencherResultados (max-min)] Preenchendo campos Max...`);
                    if (resultados.determinacoesMax) {
                        resultados.determinacoesMax.forEach((det, index) => {
                            const i = index + 1;
                            console.log(`[LOG][preencherResultados (max-min)] Preenchendo Max Det ${i}: solo=${det.solo}, gamad=${det.gamad}, gamas=${det.gamas}`);
                            setFieldValue(`#solo-max-${i}`, det.solo, 2);
                            setFieldValue(`#gamad-max-${i}`, det.gamad, 3);
                            setFieldValue(`#gamas-max-${i}`, det.gamas, 3);
                        });
                    }
                    console.log(`[LOG][preencherResultados (max-min)] Preenchendo mediaGamadMax: ${resultados.mediaGamadMax}`);
                    setFieldValue("#gamad-max", resultados.mediaGamadMax, 3);

                    console.log(`[LOG][preencherResultados (max-min)] Preenchendo campos Min...`);
                    if (resultados.determinacoesMin) {
                        resultados.determinacoesMin.forEach((det, index) => {
                            const i = index + 1;
                             console.log(`[LOG][preencherResultados (max-min)] Preenchendo Min Det ${i}: solo=${det.solo}, gamad=${det.gamad}, gamas=${det.gamas}`);
                            setFieldValue(`#solo-min-${i}`, det.solo, 2);
                            setFieldValue(`#gamad-min-${i}`, det.gamad, 3);
                            setFieldValue(`#gamas-min-${i}`, det.gamas, 3);
                        });
                    }
                     console.log(`[LOG][preencherResultados (max-min)] Preenchendo mediaGamadMin: ${resultados.mediaGamadMin}`);
                    setFieldValue("#gamad-min", resultados.mediaGamadMin, 3);
                    break;
                default:
                    console.error(`Tipo de ensaio inválido ao preencher resultados: ${tipo}`);
            }
        } catch (error) {
            console.error(`Erro crítico ao preencher resultados para ${tipo}:`, error);
            exibirNotificacao("Erro ao exibir resultados. Verifique o console.", "error");
        }
    }

    // --- Funções de interação com DB e estado --- (sem alterações significativas)
    async function salvarEnsaioAtual(tipo) {
        // ... (código inalterado)
        const dados = obterDadosFormulario(tipo);
        const resultados = estado.ultimosResultados[tipo];
        if (!dados || !resultados) {
            exibirNotificacao("Não há dados ou resultados válidos para salvar.", "warning");
            return;
        }
        const ensaio = {
            id: estado.ultimoEnsaioCarregado[tipo]?.id || Date.now(), // Reutiliza ID se editando
            tipo: tipo,
            dataSalvo: new Date().toISOString(),
            dados: dados,
            resultados: resultados
        };
        try {
            await window.calculadora.db.salvarEnsaio(ensaio);
            estado.ultimoEnsaioCarregado[tipo] = ensaio; // Atualiza o ensaio carregado
            exibirNotificacao("Ensaio salvo com sucesso!", "success");
            // Atualizar lista se estiver visível
            if (window.calculadora.navegacao && window.calculadora.navegacao.getEstadoAtual().aba === "lista-ensaios") {
                window.calculadora.navegacao.ativarAba("lista-ensaios"); // Força recarregamento
            }
        } catch (error) {
            console.error("Erro ao salvar ensaio:", error);
            exibirNotificacao("Erro ao salvar ensaio no banco de dados.", "error");
        }
    }

    function carregarEnsaioParaFormulario(tipo, ensaio) {
        // ... (código inalterado)
        if (!ensaio || !ensaio.dados) return;
        estado.ultimoEnsaioCarregado[tipo] = ensaio; // Armazena o ensaio carregado
        const form = document.querySelector(".calculadora-container");
        if (!form) return;

        // Preencher campos comuns
        const commonSuffix = (tipo === "max-min" || tipo === "real") ? `-${tipo}` : "";
        setFieldValue(`#registro${commonSuffix}`, ensaio.dados.registro);
        setFieldValue(`#data${commonSuffix}`, ensaio.dados.data);
        setFieldValue(`#operador${commonSuffix}`, ensaio.dados.operador);
        setFieldValue(`#material${commonSuffix}`, ensaio.dados.material);
        setFieldValue(`#origem${commonSuffix}`, ensaio.dados.origem);

        // Preencher campos específicos (inputs)
        try {
            switch (tipo) {
                case "in-situ":
                    setFieldValue("#responsavel", ensaio.dados.responsavel);
                    setFieldValue("#verificador", ensaio.dados.verificador);
                    setFieldValue("#norte", ensaio.dados.norte);
                    setFieldValue("#este", ensaio.dados.este);
                    setFieldValue("#cota", ensaio.dados.cota);
                    setFieldValue("#quadrante", ensaio.dados.quadrante);
                    setFieldValue("#camada", ensaio.dados.camada);
                    setFieldValue("#hora", ensaio.dados.hora);
                    setFieldValue("#balanca", ensaio.dados.balanca);
                    setFieldValue("#estufa", ensaio.dados.estufa);
                    setFieldValue("#registro-densidade-real", ensaio.dados.registroDensidadeReal);
                    setFieldValue("#registro-densidade-max-min", ensaio.dados.registroDensidadeMaxMin);
                    ensaio.dados.determinacoesInSitu?.forEach((det, index) => {
                        const i = index + 1;
                        setFieldValue(`#numero-cilindro-${i}`, det.numeroCilindro);
                        setFieldValue(`#molde-solo-${i}`, det.moldeSolo, 2);
                        setFieldValue(`#molde-${i}`, det.molde, 2);
                        setFieldValue(`#volume-${i}`, det.volume, 2);
                    });
                    ensaio.dados.determinacoesUmidadeTopo?.forEach((det, index) => {
                        const i = index + 1;
                        setFieldValue(`#capsula-numero-topo-${i}`, det.capsula);
                        setFieldValue(`#solo-umido-tara-topo-${i}`, det.soloUmidoTara, 2);
                        setFieldValue(`#solo-seco-tara-topo-${i}`, det.soloSecoTara, 2);
                        setFieldValue(`#tara-topo-${i}`, det.tara, 2);
                    });
                     ensaio.dados.determinacoesUmidadeBase?.forEach((det, index) => {
                        const i = index + 1;
                        setFieldValue(`#capsula-numero-base-${i}`, det.capsula);
                        setFieldValue(`#solo-umido-tara-base-${i}`, det.soloUmidoTara, 2);
                        setFieldValue(`#solo-seco-tara-base-${i}`, det.soloSecoTara, 2);
                        setFieldValue(`#tara-base-${i}`, det.tara, 2);
                    });
                    break;
                case "real":
                    ensaio.dados.determinacoesUmidadeReal?.forEach((det, index) => {
                        const i = index + 1;
                        setFieldValue(`#capsula-real-${i}`, det.capsula);
                        setFieldValue(`#solo-umido-tara-real-${i}`, det.soloUmidoTara, 2);
                        setFieldValue(`#solo-seco-tara-real-${i}`, det.soloSecoTara, 2);
                        setFieldValue(`#tara-real-${i}`, det.tara, 2);
                    });
                    ensaio.dados.determinacoesPicnometro?.forEach((det, index) => {
                        const i = index + 1;
                        setFieldValue(`#picnometro-${i}`, det.picnometro);
                        setFieldValue(`#massa-pic-${i}`, det.massaPic, 1);
                        setFieldValue(`#massa-pic-amostra-agua-${i}`, det.massaPicAmostraAgua, 2);
                        setFieldValue(`#temperatura-${i}`, det.temperatura, 1);
                        setFieldValue(`#massa-pic-agua-${i}`, det.massaPicAgua, 1);
                        setFieldValue(`#massa-solo-umido-${i}`, det.massaSoloUmido, 2);
                    });
                    break;
                case "max-min":
                    ensaio.dados.determinacoesMax?.forEach((det, index) => {
                        const i = index + 1;
                        setFieldValue(`#molde-solo-max-${i}`, det.moldeSolo, 2);
                        setFieldValue(`#molde-max-${i}`, det.molde, 2);
                        setFieldValue(`#volume-max-${i}`, det.volume, 2);
                        setFieldValue(`#w-max-${i}`, det.w, 1);
                    });
                    ensaio.dados.determinacoesMin?.forEach((det, index) => {
                        const i = index + 1;
                        setFieldValue(`#numero-cilindro-min-${i}`, det.numeroCilindro);
                        setFieldValue(`#molde-solo-min-${i}`, det.moldeSolo, 2);
                        setFieldValue(`#molde-min-${i}`, det.molde, 2);
                        setFieldValue(`#volume-min-${i}`, det.volume, 2);
                        setFieldValue(`#w-min-${i}`, det.w, 1);
                    });
                    break;
            }
            // Preencher resultados calculados
            preencherResultados(tipo, ensaio.resultados);
            // Armazenar os resultados carregados no estado
            estado.ultimosResultados[tipo] = ensaio.resultados;

        } catch (error) {
            console.error(`Erro ao carregar dados do ensaio ${tipo} para o formulário:`, error);
            exibirNotificacao("Erro ao carregar dados do ensaio.", "error");
        }
    }

    function limparFormulario(tipo) {
        // ... (código inalterado)
        const form = document.querySelector(".calculadora-container");
        if (!form) return;
        const inputs = form.querySelectorAll("input:not([readonly])");
        inputs.forEach(input => {
            if (input.type === "date") {
                input.value = new Date().toISOString().split("T")[0];
            } else {
                input.value = "";
            }
        });
        // Limpar campos readonly e estado
        preencherResultados(tipo, null);
        estado.ultimosResultados[tipo] = null;
        estado.ultimoEnsaioCarregado[tipo] = null;
        exibirNotificacao("Formulário limpo.", "info");
    }

    // --- Inicialização e Event Listeners --- (sem alterações)
    function init() {
        // Listener para carregar ensaio quando o formulário é exibido
        document.addEventListener("formLoaded", (ev) => {
            const { tipo, ensaio } = ev.detail;
            if (ensaio) {
                carregarEnsaioParaFormulario(tipo, ensaio);
            } else {
                limparFormulario(tipo); // Limpa se for um novo ensaio
                // Define a data atual para novos ensaios
                const commonSuffix = (tipo === "max-min" || tipo === "real") ? `-${tipo}` : "";
                const dataField = document.querySelector(`#data${commonSuffix}`);
                if (dataField) dataField.value = new Date().toISOString().split("T")[0];
            }
        });
    }

    // Garante que a inicialização ocorra após o carregamento completo do DOM
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init(); // Chamar init imediatamente se o DOM já estiver carregado
    }

    // Exportar funções públicas
    return {
        obterDadosFormulario,
        preencherResultados,
        salvarEnsaioAtual,
        limparFormulario,
        setUltimosResultados: (tipo, resultados) => { estado.ultimosResultados[tipo] = resultados; },
        getUltimosResultados: (tipo) => estado.ultimosResultados[tipo],
        exibirNotificacao
    };
})();

