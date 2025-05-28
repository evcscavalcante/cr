// Módulo de geração de PDF para a Calculadora de Compacidade
// Implementa a geração de relatórios em PDF conforme o modelo fornecido

// Namespace para calculadora
window.calculadora = window.calculadora || {};

// Módulo de geração de PDF
window.calculadora.pdfGenerator = (() => {
    // Gerar PDF
    function gerarPDF(tipo, dados) {
        console.log(`Gerando PDF para ${tipo}:`, dados);

        return new Promise((resolve, reject) => {
            // Adicionar verificação de jsPDF
            if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
                console.error("jsPDF não está carregado. Verifique a inclusão da biblioteca.");
                return reject(new Error("jsPDF não está carregado."));
            }

            try {
                // Criar elemento canvas para desenhar o PDF
                const canvas = document.createElement("canvas");
                canvas.width = 595; // A4 width in pixels at 72 dpi
                canvas.height = 842; // A4 height in pixels at 72 dpi
                // Anexar ao body temporariamente pode ser necessário para alguns contextos de renderização
                canvas.style.position = 'absolute';
                canvas.style.left = '-9999px';
                document.body.appendChild(canvas);

                // Obter contexto 2D
                const ctx = canvas.getContext("2d");

                // Desenhar fundo branco
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Desenhar conteúdo específico por tipo
                switch (tipo) {
                    case "in-situ":
                        desenharDensidadeInSitu(ctx, dados);
                        break;
                    case "real":
                        desenharDensidadeReal(ctx, dados);
                        break;
                    case "max-min":
                        desenharDensidadeMaxMin(ctx, dados);
                        break;
                    default:
                        // Limpar canvas e rejeitar
                        document.body.removeChild(canvas);
                        return reject(new Error(`Tipo de ensaio inválido: ${tipo}`));
                }

                // Converter canvas para PDF
                const imgData = canvas.toDataURL("image/png");

                // Criar PDF usando jsPDF
                const pdf = new jspdf.jsPDF();
                pdf.addImage(imgData, "PNG", 0, 0, 210, 297); // A4 size in mm

                // *** REVERTIDO: Salvar o arquivo PDF diretamente ***
                const nomeArquivo = `${tipo}_${dados.registro || "sem_registro"}.pdf`;
                pdf.save(nomeArquivo);

                // Remover canvas
                document.body.removeChild(canvas);

                // Resolver indicando sucesso
                resolve(true);

            } catch (error) {
                console.error("Erro ao gerar PDF:", error);
                // Tentar remover o canvas mesmo em caso de erro
                if (canvas && canvas.parentNode === document.body) {
                    document.body.removeChild(canvas);
                }
                reject(error);
            }
        });
    }

    // Função auxiliar para formatar valor numérico ou retornar ''
    function formatValue(value, precision) {
        if (typeof value === 'number' && !isNaN(value)) {
            return value.toFixed(precision);
        }
        return '';
    }

    // Desenhar densidade in situ
    function desenharDensidadeInSitu(ctx, dados) {
        // Configurações de estilo
        const corFundo = '#f5f5f5';
        const corBorda = '#000000';
        const fonteTitulo = 'bold 16px Arial';
        const fonteSubtitulo = 'bold 14px Arial';
        const fonteCabecalho = 'bold 10px Arial';
        const fonteNormal = '10px Arial';
        const fontePequena = '9px Arial';
        
        // Função para desenhar células de tabela
        function desenharCelula(x, y, largura, altura, texto, fonte, alinhamento = 'center', preenchimento = false) {
            // Desenhar borda e fundo
            ctx.strokeStyle = corBorda;
            ctx.lineWidth = 0.5;
            ctx.fillStyle = preenchimento ? corFundo : 'white';
            ctx.fillRect(x, y, largura, altura);
            ctx.strokeRect(x, y, largura, altura);
            
            // Desenhar texto
            ctx.fillStyle = 'black';
            ctx.font = fonte;
            ctx.textAlign = alinhamento;
            
            // Posição do texto baseada no alinhamento
            let textX;
            if (alinhamento === 'center') {
                textX = x + largura / 2;
            } else if (alinhamento === 'left') {
                textX = x + 5; // 5px de margem à esquerda
            } else { // right
                textX = x + largura - 5; // 5px de margem à direita
            }
            
            ctx.fillText(texto, textX, y + altura / 2 + 4); // +4 para centralizar verticalmente
        }
        
        // Função para desenhar linha de tabela
        function desenharLinha(x, y, larguras, altura, textos, fontes, alinhamentos, preenchimentos) {
            let currentX = x;
            for (let i = 0; i < textos.length; i++) {
                desenharCelula(
                    currentX, 
                    y, 
                    larguras[i], 
                    altura, 
                    textos[i], 
                    fontes[i] || fonteNormal, 
                    alinhamentos[i] || 'center', 
                    preenchimentos[i] || false
                );
                currentX += larguras[i];
            }
            return y + altura;
        }
        
        // Título principal
        ctx.fillStyle = 'black';
        ctx.font = fonteTitulo;
        ctx.textAlign = 'center';
        ctx.fillText('DETERMINAÇÃO DA COMPACIDADE RELATIVA', 297, 30);
        ctx.fillText('NBR 6457:2024; NBR 9813:2016.', 297, 50);
        
        // Variáveis para controle de posição
        let y = 70;
        const margemEsquerda = 50;
        const larguraTotal = 495;
        
        // Informações gerais - primeira linha
        const largurasCabecalho = [123.75, 123.75, 123.75, 123.75];
        y = desenharLinha(
            margemEsquerda, y, largurasCabecalho, 20,
            ['OPERADOR:', 'NORTE:', 'CAMADA Nº:', 'PVS:'],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['left', 'left', 'left', 'left'],
            [true, true, true, true]
        );
        
        y = desenharLinha(
            margemEsquerda, y, largurasCabecalho, 20,
            [dados.operador || 'ALEXANDRO', dados.norte || '7.795.656.315', dados.camada || '18"', dados.pvs || '114'],
            [fonteNormal, fonteNormal, fonteNormal, fonteNormal],
            ['center', 'center', 'center', 'center'],
            [false, false, false, false]
        );
        
        // Informações gerais - segunda linha
        y = desenharLinha(
            margemEsquerda, y, largurasCabecalho, 20,
            ['RESPONSÁVEL PELO CÁLCULO:', 'ESTE:', 'MATERIAL:', ''],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['left', 'left', 'left', 'left'],
            [true, true, true, true]
        );
        
        y = desenharLinha(
            margemEsquerda, y, largurasCabecalho, 20,
            [dados.responsavel || 'KLAMERTY', dados.este || '686.747.219', dados.material || 'REJEITO FILTRADO', ''],
            [fonteNormal, fonteNormal, fonteNormal, fonteNormal],
            ['center', 'center', 'center', 'center'],
            [false, false, false, false]
        );
        
        // Informações gerais - terceira linha
        y = desenharLinha(
            margemEsquerda, y, largurasCabecalho, 20,
            ['VERIFICADOR:', 'COTA:', 'ORDEM:', ''],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['left', 'left', 'left', 'left'],
            [true, true, true, true]
        );
        
        y = desenharLinha(
            margemEsquerda, y, largurasCabecalho, 20,
            [dados.verificador || 'EVANDRO', dados.cota || '796.628', dados.ordem || 'EDVC', ''],
            [fonteNormal, fonteNormal, fonteNormal, fonteNormal],
            ['center', 'center', 'center', 'center'],
            [false, false, false, false]
        );
        
        // Informações gerais - quarta linha
        y = desenharLinha(
            margemEsquerda, y, largurasCabecalho, 20,
            ['DATA:', 'QUADRANTE:', 'REGISTRO:', ''],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['left', 'left', 'left', 'left'],
            [true, true, true, true]
        );
        
        y = desenharLinha(
            margemEsquerda, y, largurasCabecalho, 20,
            [dados.data || '27/05/2025', dados.quadrante || 'C. FAIXA 1 - PIEZÔMETRO', 'CR: ' + (dados.registro || '233'), ''],
            [fonteNormal, fonteNormal, fonteNormal, fonteNormal],
            ['center', 'center', 'center', 'center'],
            [false, false, false, false]
        );
        
        // Espaçamento
        y += 5;
        
        // Tempo
        desenharCelula(margemEsquerda, y, larguraTotal, 20, 'TEMPO', fonteCabecalho, 'center', true);
        y += 20;
        
        const largurasTempo = [123.75, 123.75, 123.75, 123.75];
        y = desenharLinha(
            margemEsquerda, y, largurasTempo, 20,
            ['SOL FORTE', 'CHUVA FRACA', 'CHUVA FORTE', 'NUBLADO'],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['center', 'center', 'center', 'center'],
            [true, true, true, true]
        );
        
        // Marcar a opção selecionada (SOL FORTE)
        y = desenharLinha(
            margemEsquerda, y, largurasTempo, 20,
            ['X', '', '', ''],
            [fonteNormal, fonteNormal, fonteNormal, fonteNormal],
            ['center', 'center', 'center', 'center'],
            [false, false, false, false]
        );
        
        // Espaçamento
        y += 5;
        
        // Camada recompactada
        const largurasCamada = [247.5, 123.75, 123.75];
        y = desenharLinha(
            margemEsquerda, y, largurasCamada, 20,
            ['CAMADA RECOMPACTADA:', 'SIM', 'NÃO'],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['left', 'center', 'center'],
            [true, true, true]
        );
        
        // Marcar a opção selecionada (SIM)
        y = desenharLinha(
            margemEsquerda, y, largurasCamada, 20,
            ['', 'X', ''],
            [fonteNormal, fonteNormal, fonteNormal],
            ['center', 'center', 'center'],
            [false, false, false]
        );
        
        // Espaçamento
        y += 5;
        
        // Dispositivos de precisão
        const largurasDispositivos = [247.5, 123.75, 123.75];
        y = desenharLinha(
            margemEsquerda, y, largurasDispositivos, 20,
            ['DISPOSITIVOS DE PRECISÃO', 'BALANÇA:', 'ESTUFA:'],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['center', 'center', 'center'],
            [true, true, true]
        );
        
        y = desenharLinha(
            margemEsquerda, y, largurasDispositivos, 20,
            ['', dados.balanca || '46516', dados.estufa || '718'],
            [fonteNormal, fonteNormal, fonteNormal],
            ['center', 'center', 'center'],
            [false, false, false]
        );
        
        // Espaçamento
        y += 5;
        
        // Densidade seca máxima
        desenharCelula(margemEsquerda, y, larguraTotal, 20, 'DENSIDADE SECA MÁXIMA', fonteCabecalho, 'center', true);
        y += 20;
        
        // Cabeçalho da tabela de densidade máxima
        const largurasMaxima = [123.75, 123.75, 123.75, 123.75];
        y = desenharLinha(
            margemEsquerda, y, largurasMaxima, 20,
            ['DETERMINAÇÃO Nº', '1', '1', '1'],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['center', 'center', 'center', 'center'],
            [true, true, true, true]
        );
        
        // Dados da tabela de densidade máxima
        const dadosMaxima = [
            ['MOLDE + SOLO (g)', '6034', '6030', '6032'],
            ['MOLDE (g)', '4114', '4114', '4114'],
            ['SOLO (g)', '1920', '1916', '1918'],
            ['VOLUME (cm³)', '1007', '1007', '1007'],
            ['yd(g/cm³)', '1.907', '1.903', '1.905'],
            ['e (%)', '0.1', '0.1', '0.1'],
            ['ys(g/cm³)', '1.905', '1.901', '1.903']
        ];
        
        for (const linha of dadosMaxima) {
            y = desenharLinha(
                margemEsquerda, y, largurasMaxima, 20,
                linha,
                [fonteNormal, fonteNormal, fonteNormal, fonteNormal],
                ['center', 'center', 'center', 'center'],
                [false, false, false, false]
            );
        }
        
        // Valor médio da densidade máxima
        y = desenharLinha(
            margemEsquerda, y, [371.25, 123.75], 20,
            ['ydmax(g/cm³)', '1.903'],
            [fonteCabecalho, fonteNormal],
            ['center', 'center'],
            [false, false]
        );
        
        // Espaçamento
        y += 5;
        
        // Densidade seca mínima
        desenharCelula(margemEsquerda, y, larguraTotal, 20, 'DENSIDADE SECA MÍNIMA', fonteCabecalho, 'center', true);
        y += 20;
        
        // Cabeçalho da tabela de densidade mínima
        const largurasMinima = [123.75, 123.75, 123.75, 123.75];
        y = desenharLinha(
            margemEsquerda, y, largurasMinima, 20,
            ['NÚMERO DO CILINDRO', '1', '1', '1'],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['center', 'center', 'center', 'center'],
            [true, true, true, true]
        );
        
        // Dados da tabela de densidade mínima
        const dadosMinima = [
            ['MOLDE + SOLO (g)', '5676', '5679', '5681'],
            ['MOLDE (g)', '4114', '4114', '4114'],
            ['SOLO (g)', '1562', '1565', '1567'],
            ['VOLUME (cm³)', '1007', '1007', '1007'],
            ['yd(g/cm³)', '1.551', '1.554', '1.556'],
            ['e (%)', '0.1', '0.1', '0.1'],
            ['ys(g/cm³)', '1.550', '1.553', '1.555']
        ];
        
        for (const linha of dadosMinima) {
            y = desenharLinha(
                margemEsquerda, y, largurasMinima, 20,
                linha,
                [fonteNormal, fonteNormal, fonteNormal, fonteNormal],
                ['center', 'center', 'center', 'center'],
                [false, false, false, false]
            );
        }
        
        // Valor médio da densidade mínima
        y = desenharLinha(
            margemEsquerda, y, [371.25, 123.75], 20,
            ['ydmin(g/cm³)', '1.552'],
            [fonteCabecalho, fonteNormal],
            ['center', 'center'],
            [false, false]
        );
        
        // Espaçamento
        y += 5;
        
        // Densidade in situ
        desenharCelula(margemEsquerda, y, larguraTotal, 20, 'DENSIDADE "IN SITU" - CILINDRO DE CRAVAÇÃO', fonteCabecalho, 'center', true);
        y += 20;
        
        desenharCelula(margemEsquerda, y, larguraTotal, 20, 'NBR 9813:2016', fonteCabecalho, 'center', false);
        y += 20;
        
        // Cabeçalho da tabela de densidade in situ
        const largurasInSitu = [247.5, 123.75, 123.75];
        y = desenharLinha(
            margemEsquerda, y, largurasInSitu, 20,
            ['NÚMERO DO CILINDRO', '3', '4'],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['center', 'center', 'center'],
            [true, true, true]
        );
        
        // Dados da tabela de densidade in situ
        const dadosInSitu = [
            ['MOLDE + SOLO (g)', '3132', '3074'],
            ['MOLDE (g)', '1092', '1114'],
            ['SOLO (g)', '2040', '1960'],
            ['VOLUME (cm³)', '997', '999'],
            ['yd (g/cm³)', '2.046', '1.962'],
            ['ys (g/cm³)', '1.838', '1.825']
        ];
        
        for (const linha of dadosInSitu) {
            y = desenharLinha(
                margemEsquerda, y, largurasInSitu, 20,
                linha,
                [fonteNormal, fonteNormal, fonteNormal],
                ['center', 'center', 'center'],
                [false, false, false]
            );
        }
        
        // Valor médio da densidade in situ
        y = desenharLinha(
            margemEsquerda, y, [247.5, 247.5], 20,
            ['ys (g/cm³) Média', '1.832'],
            [fonteCabecalho, fonteNormal],
            ['center', 'center'],
            [false, false]
        );
        
        // Espaçamento
        y += 5;
        
        // Teor de umidade
        const largurasUmidadeCabecalho = [123.75, 123.75, 247.5];
        y = desenharLinha(
            margemEsquerda, y, largurasUmidadeCabecalho, 20,
            ['TEOR DE UMIDADE', 'TOPO', 'BASE'],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['center', 'center', 'center'],
            [true, true, true]
        );
        
        // Cabeçalho da tabela de umidade
        const largurasUmidade = [70.7, 70.7, 70.7, 70.7, 70.7, 70.7, 70.7];
        y = desenharLinha(
            margemEsquerda, y, largurasUmidade, 20,
            ['CÁPSULA Nº', '46', '37', '55', '8', '9', '7'],
            [fonteCabecalho, fonteCabecalho, fonteCabecalho, fonteCabecalho, fonteCabecalho, fonteCabecalho, fonteCabecalho],
            ['center', 'center', 'center', 'center', 'center', 'center', 'center'],
            [true, true, true, true, true, true, true]
        );
        
        // Dados da tabela de umidade
        const dadosUmidade = [
            ['SOLO ÚMIDO + TARA (g)', '250.16', '251.80', '251.78', '253.26', '251.57', '252.29'],
            ['SOLO SECO + TARA (g)', '228.60', '229.53', '229.80', '237.55', '236.70', '237.40'],
            ['TARA (g)', '32.52', '37.05', '36.64', '37.88', '32.88', '35.29'],
            ['SOLO SECO (g)', '196.08', '192.48', '193.16', '199.67', '203.82', '202.11'],
            ['ÁGUA (g)', '21.56', '22.27', '21.98', '15.71', '14.87', '14.89'],
            ['UMIDADE (%)', '11.0', '11.6', '11.4', '7.9', '7.3', '7.4']
        ];
        
        for (const linha of dadosUmidade) {
            y = desenharLinha(
                margemEsquerda, y, largurasUmidade, 20,
                linha,
                [fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal],
                ['center', 'center', 'center', 'center', 'center', 'center', 'center'],
                [false, false, false, false, false, false, false]
            );
        }
        
        // Umidade média
        const largurasUmidadeMedia = [247.5, 123.75, 123.75];
        y = desenharLinha(
            margemEsquerda, y, largurasUmidadeMedia, 20,
            ['UMIDADE MÉDIA (%)', '11.3', '7.5'],
            [fonteCabecalho, fonteNormal, fonteNormal],
            ['center', 'center', 'center'],
            [false, false, false]
        );
        
        // Título TOPO
        y += 10;
        ctx.fillStyle = 'black';
        ctx.font = fonteSubtitulo;
        ctx.textAlign = 'center';
        ctx.fillText('TOPO', 297, y);
        y += 20;
        
        // Massa específica real dos grãos - TOPO
        const largurasMassaEspecifica = [247.5, 82.5, 10, 82.5, 10, 82.5, 10, 82.5];
        y = desenharLinha(
            margemEsquerda, y, [247.5, 247.5], 20,
            ['MASSA ESPECÍFICA REAL DOS GRÃOS (g/cm³):', ''],
            [fonteCabecalho, fonteNormal],
            ['left', 'center'],
            [true, false]
        );
        
        // Fórmula - primeira linha
        y = desenharLinha(
            margemEsquerda, y, largurasMassaEspecifica, 20,
            ['', '( 1.838', '-', '1.552 )', 'X', '1.903', '=', '0.544'],
            [fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal],
            ['center', 'right', 'center', 'left', 'center', 'center', 'center', 'center'],
            [false, false, false, false, false, false, false, false]
        );
        
        // Fórmula - segunda linha
        y = desenharLinha(
            margemEsquerda, y, largurasMassaEspecifica, 20,
            ['', '( 1.903', '-', '1.552 )', 'X', '1.838', '=', '0.644'],
            [fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal],
            ['center', 'right', 'center', 'left', 'center', 'center', 'center', 'center'],
            [false, false, false, false, false, false, false, false]
        );
        
        // Resultados TOPO
        y = desenharLinha(
            margemEsquerda, y, [412.5, 82.5], 20,
            ['CR', 'IV'],
            [fonteCabecalho, fonteCabecalho],
            ['center', 'center'],
            [false, false]
        );
        
        y = desenharLinha(
            margemEsquerda, y, [412.5, 82.5], 20,
            ['84.4%', '0.72'],
            [fonteNormal, fonteNormal],
            ['center', 'center'],
            [false, false]
        );
        
        // Título BASE
        y += 10;
        ctx.fillStyle = 'black';
        ctx.font = fonteSubtitulo;
        ctx.textAlign = 'center';
        ctx.fillText('BASE', 297, y);
        y += 20;
        
        // Massa específica real dos grãos - BASE
        y = desenharLinha(
            margemEsquerda, y, [247.5, 247.5], 20,
            ['MASSA ESPECÍFICA REAL DOS GRÃOS (g/cm³):', ''],
            [fonteCabecalho, fonteNormal],
            ['left', 'center'],
            [true, false]
        );
        
        // Fórmula - primeira linha
        y = desenharLinha(
            margemEsquerda, y, largurasMassaEspecifica, 20,
            ['', '( 1.825', '-', '1.552 )', 'X', '1.903', '=', '0.519'],
            [fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal],
            ['center', 'right', 'center', 'left', 'center', 'center', 'center', 'center'],
            [false, false, false, false, false, false, false, false]
        );
        
        // Fórmula - segunda linha
        y = desenharLinha(
            margemEsquerda, y, largurasMassaEspecifica, 20,
            ['', '( 1.903', '-', '1.552 )', 'X', '1.825', '=', '0.640'],
            [fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal, fonteNormal],
            ['center', 'right', 'center', 'left', 'center', 'center', 'center', 'center'],
            [false, false, false, false, false, false, false, false]
        );
        
        // Resultados BASE
        y = desenharLinha(
            margemEsquerda, y, [412.5, 82.5], 20,
            ['CR', 'IV'],
            [fonteCabecalho, fonteCabecalho],
            ['center', 'center'],
            [false, false]
        );
        
        y = desenharLinha(
            margemEsquerda, y, [412.5, 82.5], 20,
            ['81.1%', '0.73'],
            [fonteNormal, fonteNormal],
            ['center', 'center'],
            [false, false]
        );
        
        // Observações
        y += 10;
        desenharCelula(margemEsquerda, y, larguraTotal, 20, 'OBSERVAÇÕES: ENSAIO ACOMPANHADO PELO FISCAL GERMANO OLIVEIRA ( ENG ).', fonteCabecalho, 'left', false);
    }

    // Desenhar densidade real
    function desenharDensidadeReal(ctx, dados) {
        let y = 130;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('DENSIDADE REAL DOS GRÃOS', 50, y); y += 30;

        // Umidade
        ctx.font = 'bold 12px Arial';
        ctx.fillText('TEOR DE UMIDADE', 50, y); y += 20;
        ctx.font = '10px Arial';
        ctx.fillText('Det.', 50, y);
        ctx.fillText('Cáps. Nº', 90, y);
        ctx.fillText('Solo Úmido+Tara(g)', 160, y);
        ctx.fillText('Solo Seco+Tara(g)', 280, y);
        ctx.fillText('Tara(g)', 390, y);
        ctx.fillText('Solo Seco(g)', 450, y);
        ctx.fillText('Água(g)', 510, y);
        ctx.fillText('Umidade(%)', 560, y); y += 15;
        if (dados.determinacoesUmidadeReal) {
            dados.determinacoesUmidadeReal.forEach((det, index) => {
                ctx.fillText(`${index + 1}`, 50, y);
                ctx.fillText(det.capsula || '', 90, y);
                ctx.fillText(formatValue(det.soloUmidoTara, 1), 160, y);
                ctx.fillText(formatValue(det.soloSecoTara, 1), 280, y);
                ctx.fillText(formatValue(det.tara, 1), 390, y);
                ctx.fillText(formatValue(det.soloSeco, 1), 450, y);
                ctx.fillText(formatValue(det.agua, 1), 510, y);
                ctx.fillText(formatValue(det.umidade, 1), 560, y); y += 15;
            });
        }
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`Umidade Média (%): ${formatValue(dados.umidadeMedia, 1)}`, 450, y); y += 30;

        // Picnômetro
        ctx.font = 'bold 12px Arial';
        ctx.fillText('PICNÔMETRO', 50, y); y += 20;
        ctx.font = '10px Arial';
        // Cabeçalho da tabela
        ctx.fillText('Determinação', 50, y);
        ctx.fillText('1', 350, y);
        ctx.fillText('2', 450, y); y += 15;
        // Linhas da tabela
        const linhasPicnometro = [
            { label: 'Picnômetro Nº', key1: 'picnometro', precision: null },
            { label: 'Massa do Picnômetro (g)', key1: 'massaPic', precision: 1 },
            { label: 'Massa Pic+Amostra+Água (g)', key1: 'massaPicAmostraAgua', precision: 1 },
            { label: 'Temperatura (°C)', key1: 'temperatura', precision: 1 },
            { label: 'Massa Pic+Água (g)', key1: 'massaPicAgua', precision: 1 },
            { label: 'Densidade da Água (g/cm³)', key1: 'densidadeAgua', precision: 4 },
            { label: 'Massa do Solo Úmido (g)', key1: 'massaSoloUmido', precision: 1 },
            { label: 'Massa do Solo Seco (g)', key1: 'massaSoloSeco', precision: 1 },
            { label: 'Densidade Real (g/cm³)', key1: 'densidadeReal', precision: 3 }
        ];
        if (dados.determinacoesPicnometro) {
            linhasPicnometro.forEach(linha => {
                ctx.fillText(linha.label, 50, y);
                const val1 = dados.determinacoesPicnometro[0] ? dados.determinacoesPicnometro[0][linha.key1] : null;
                const val2 = dados.determinacoesPicnometro[1] ? dados.determinacoesPicnometro[1][linha.key1] : null;
                ctx.fillText(linha.precision !== null ? formatValue(val1, linha.precision) : (val1 || ''), 350, y);
                ctx.fillText(linha.precision !== null ? formatValue(val2, linha.precision) : (val2 || ''), 450, y);
                y += 15;
            });
        } else { y += linhasPicnometro.length * 15; }
        y += 15; // Espaço extra

        // Resultados
        ctx.font = 'bold 14px Arial';
        ctx.fillText('RESULTADOS', 50, y); y += 25;
        ctx.font = '12px Arial';
        ctx.fillText(`Diferença (%): ${formatValue(dados.diferenca, 1)}`, 50, y);
        ctx.fillText(`Média Densidade Real (g/cm³): ${formatValue(dados.mediaDensidadeReal, 3)}`, 50, y + 20);
    }

    // Desenhar densidade máxima e mínima
    function desenharDensidadeMaxMin(ctx, dados) {
        let y = 130;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('DENSIDADE MÁXIMA E MÍNIMA', 50, y); y += 30;

        // Densidade máxima
        ctx.font = 'bold 12px Arial';
        ctx.fillText('DENSIDADE MÁXIMA', 50, y); y += 20;
        ctx.font = '10px Arial';
        // Cabeçalho
        ctx.fillText('Det.', 50, y);
        ctx.fillText('Molde+Solo(g)', 100, y);
        ctx.fillText('Molde(g)', 200, y);
        ctx.fillText('Solo(g)', 280, y);
        ctx.fillText('Volume(cm³)', 350, y);
        ctx.fillText('γd(g/cm³)', 430, y);
        ctx.fillText('w(%)', 500, y);
        ctx.fillText('γs(g/cm³)', 560, y); y += 15;
        // Linhas
        if (dados.determinacoesMax) {
            dados.determinacoesMax.forEach((det, index) => {
                ctx.fillText(`${index + 1}`, 50, y);
                ctx.fillText(formatValue(det.moldeSolo, 1), 100, y);
                ctx.fillText(formatValue(det.molde, 1), 200, y);
                ctx.fillText(formatValue(det.solo, 1), 280, y);
                ctx.fillText(formatValue(det.volume, 1), 350, y);
                ctx.fillText(formatValue(det.gamad, 3), 430, y);
                ctx.fillText(formatValue(det.w, 1), 500, y);
                ctx.fillText(formatValue(det.gamas, 3), 560, y); y += 15;
            });
        }
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`γdmax (g/cm³): ${formatValue(dados.gamadMax, 3)}`, 450, y); y += 30;

        // Densidade mínima
        ctx.font = 'bold 12px Arial';
        ctx.fillText('DENSIDADE MÍNIMA', 50, y); y += 20;
        ctx.font = '10px Arial';
        // Cabeçalho
        ctx.fillText('Det.', 50, y);
        ctx.fillText('Molde+Solo(g)', 100, y);
        ctx.fillText('Molde(g)', 200, y);
        ctx.fillText('Solo(g)', 280, y);
        ctx.fillText('Volume(cm³)', 350, y);
        ctx.fillText('γd(g/cm³)', 430, y);
        ctx.fillText('w(%)', 500, y);
        ctx.fillText('γs(g/cm³)', 560, y); y += 15;
        // Linhas
        if (dados.determinacoesMin) {
            dados.determinacoesMin.forEach((det, index) => {
                ctx.fillText(`${index + 1}`, 50, y);
                ctx.fillText(formatValue(det.moldeSolo, 1), 100, y);
                ctx.fillText(formatValue(det.molde, 1), 200, y);
                ctx.fillText(formatValue(det.solo, 1), 280, y);
                ctx.fillText(formatValue(det.volume, 1), 350, y);
                ctx.fillText(formatValue(det.gamad, 3), 430, y);
                ctx.fillText(formatValue(det.w, 1), 500, y);
                ctx.fillText(formatValue(det.gamas, 3), 560, y); y += 15;
            });
        }
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`γdmin (g/cm³): ${formatValue(dados.gamadMin, 3)}`, 450, y); y += 30;

        // Resultados
        ctx.font = 'bold 14px Arial';
        ctx.fillText('RESULTADOS', 50, y); y += 25;
        ctx.font = '12px Arial';
        ctx.fillText(`Índice de Vazios Máximo (emax): ${formatValue(dados.eMax, 3)}`, 50, y); y += 20;
        ctx.fillText(`Índice de Vazios Mínimo (emin): ${formatValue(dados.eMin, 3)}`, 50, y); y += 20;
        ctx.fillText(`Densidade Relativa Máxima: ${formatValue(dados.drMax, 1)}%`, 50, y); y += 20;
        ctx.fillText(`Densidade Relativa Mínima: ${formatValue(dados.drMin, 1)}%`, 50, y);
    }

    // API pública
    return {
        gerarPDF
    };
})();
