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

                // Desenhar cabeçalho
                desenharCabecalho(ctx, dados);

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

                // Desenhar rodapé
                desenharRodape(ctx, dados);

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

    // Desenhar cabeçalho
    function desenharCabecalho(ctx, dados) {
        // Definir estilo
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';

        // Desenhar título
        ctx.fillText('RELATÓRIO DE ENSAIO - COMPACIDADE', 297, 30);

        // Desenhar linha horizontal
        ctx.beginPath();
        ctx.moveTo(50, 40);
        ctx.lineTo(545, 40);
        ctx.stroke();

        // Desenhar informações gerais
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';

        // Coluna 1
        ctx.fillText(`Registro: ${dados.registro || ''}`, 50, 60);
        ctx.fillText(`Data: ${dados.data || ''}`, 50, 80);
        ctx.fillText(`Operador: ${dados.operador || ''}`, 50, 100);

        // Coluna 2
        ctx.fillText(`Material: ${dados.material || ''}`, 300, 60);
        ctx.fillText(`Origem: ${dados.origem || ''}`, 300, 80);

        // Desenhar linha horizontal
        ctx.beginPath();
        ctx.moveTo(50, 110);
        ctx.lineTo(545, 110);
        ctx.stroke();
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
        let y = 130;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('DENSIDADE IN SITU', 50, y); y += 20;

        // Informações gerais
        ctx.font = '12px Arial';
        ctx.fillText(`Responsável: ${dados.responsavel || ''}`, 50, y);
        ctx.fillText(`Verificador: ${dados.verificador || ''}`, 300, y); y += 20;
        ctx.fillText(`Norte: ${dados.norte || ''}`, 50, y);
        ctx.fillText(`Este: ${dados.este || ''}`, 300, y); y += 20;
        ctx.fillText(`Cota: ${dados.cota || ''}`, 50, y);
        ctx.fillText(`Quadrante: ${dados.quadrante || ''}`, 300, y); y += 20;
        ctx.fillText(`Camada: ${dados.camada || ''}`, 50, y);
        ctx.fillText(`Hora: ${dados.hora || ''}`, 300, y); y += 20;

        // Dispositivos
        ctx.fillText(`Balança: ${dados.balanca || ''}`, 50, y);
        ctx.fillText(`Estufa: ${dados.estufa || ''}`, 300, y); y += 20;

        // Referências
        ctx.fillText(`Registro Densidade Real: ${dados.registroDensidadeReal || ''} (Gs=${formatValue(dados.densidadeRealRef, 3)})`, 50, y);
        ctx.fillText(`Registro Densidade Máx/Mín: ${dados.registroDensidadeMaxMin || ''} (γdmax=${formatValue(dados.gamadMaxRef, 3)}, γdmin=${formatValue(dados.gamadMinRef, 3)})`, 300, y); y += 30;

        // Densidade in situ - Determinações
        ctx.font = 'bold 12px Arial';
        ctx.fillText('DENSIDADE IN SITU - DETERMINAÇÕES', 50, y); y += 20;
        ctx.font = '10px Arial';
        ctx.fillText('Determinação', 50, y);
        ctx.fillText('Cil. Nº', 150, y);
        ctx.fillText('Molde+Solo(g)', 210, y);
        ctx.fillText('Molde(g)', 300, y);
        ctx.fillText('Solo(g)', 370, y);
        ctx.fillText('Volume(cm³)', 430, y);
        ctx.fillText('γ nat(g/cm³)', 510, y); y += 15;
        if (dados.determinacoesInSitu) {
            dados.determinacoesInSitu.forEach((det, index) => {
                ctx.fillText(`${index + 1}`, 50, y);
                ctx.fillText(det.numeroCilindro || '', 150, y);
                ctx.fillText(formatValue(det.moldeSolo, 1), 210, y);
                ctx.fillText(formatValue(det.molde, 1), 300, y);
                ctx.fillText(formatValue(det.solo, 1), 370, y);
                ctx.fillText(formatValue(det.volume, 1), 430, y);
                ctx.fillText(formatValue(det.gamaNat, 3), 510, y); y += 15;
            });
        } else { y += 15; }
        y += 5; // Espaço extra

        // Umidade - Topo
        ctx.font = 'bold 12px Arial';
        ctx.fillText('UMIDADE - TOPO', 50, y); y += 20;
        ctx.font = '10px Arial';
        ctx.fillText('Det.', 50, y);
        ctx.fillText('Cáps. Nº', 90, y);
        ctx.fillText('Solo Úmido+Tara(g)', 160, y);
        ctx.fillText('Solo Seco+Tara(g)', 280, y);
        ctx.fillText('Tara(g)', 390, y);
        ctx.fillText('Solo Seco(g)', 450, y);
        ctx.fillText('Água(g)', 510, y);
        ctx.fillText('Umidade(%)', 560, y); y += 15;
        if (dados.determinacoesUmidadeTopo) {
            dados.determinacoesUmidadeTopo.forEach((det, index) => {
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
        ctx.fillText(`Umidade Média Topo (%): ${formatValue(dados.umidadeMediaTopo, 1)}`, 450, y); y += 20;

        // Umidade - Base
        ctx.font = 'bold 12px Arial';
        ctx.fillText('UMIDADE - BASE', 50, y); y += 20;
        ctx.font = '10px Arial';
        ctx.fillText('Det.', 50, y);
        ctx.fillText('Cáps. Nº', 90, y);
        ctx.fillText('Solo Úmido+Tara(g)', 160, y);
        ctx.fillText('Solo Seco+Tara(g)', 280, y);
        ctx.fillText('Tara(g)', 390, y);
        ctx.fillText('Solo Seco(g)', 450, y);
        ctx.fillText('Água(g)', 510, y);
        ctx.fillText('Umidade(%)', 560, y); y += 15;
        if (dados.determinacoesUmidadeBase) {
            dados.determinacoesUmidadeBase.forEach((det, index) => {
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
        ctx.fillText(`Umidade Média Base (%): ${formatValue(dados.umidadeMediaBase, 1)}`, 450, y); y += 30;

        // Resultados
        ctx.font = 'bold 14px Arial';
        ctx.fillText('RESULTADOS', 50, y); y += 25;
        ctx.font = '12px Arial';
        ctx.fillText(`γd Topo (g/cm³): ${formatValue(dados.gamadTopo, 3)}`, 50, y);
        ctx.fillText(`γd Base (g/cm³): ${formatValue(dados.gamadBase, 3)}`, 300, y); y += 20;
        ctx.fillText(`Índice de Vazios Topo: ${formatValue(dados.indiceVaziosTopo, 3)}`, 50, y);
        ctx.fillText(`Índice de Vazios Base: ${formatValue(dados.indiceVaziosBase, 3)}`, 300, y); y += 20;
        ctx.fillText(`CR Topo (%): ${formatValue(dados.crTopo, 1)}`, 50, y);
        ctx.fillText(`CR Base (%): ${formatValue(dados.crBase, 1)}`, 300, y); y += 30;

        // Status
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Status: ${dados.status || 'N/A'}`, 297, y);
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
        ctx.fillText(`γd máx (g/cm³): ${formatValue(dados.mediaGamadMax, 3)}`, 430, y); y += 30;

        // Densidade mínima
        ctx.font = 'bold 12px Arial';
        ctx.fillText('DENSIDADE MÍNIMA', 50, y); y += 20;
        ctx.font = '10px Arial';
        // Cabeçalho
        ctx.fillText('Det.', 50, y);
        ctx.fillText('Cil. Nº', 100, y);
        ctx.fillText('Molde+Solo(g)', 160, y);
        ctx.fillText('Molde(g)', 260, y);
        ctx.fillText('Solo(g)', 340, y);
        ctx.fillText('Volume(cm³)', 410, y);
        ctx.fillText('γd(g/cm³)', 490, y);
        ctx.fillText('w(%)', 560, y);
        // ctx.fillText('γs(g/cm³)', 560, y); // γs não parece ser calculado/usado aqui
        y += 15;
        // Linhas
        if (dados.determinacoesMin) {
            dados.determinacoesMin.forEach((det, index) => {
                ctx.fillText(`${index + 1}`, 50, y);
                ctx.fillText(det.numeroCilindro || '', 100, y);
                ctx.fillText(formatValue(det.moldeSolo, 1), 160, y);
                ctx.fillText(formatValue(det.molde, 1), 260, y);
                ctx.fillText(formatValue(det.solo, 1), 340, y);
                ctx.fillText(formatValue(det.volume, 1), 410, y);
                ctx.fillText(formatValue(det.gamad, 3), 490, y);
                ctx.fillText(formatValue(det.w, 1), 560, y);
                // ctx.fillText(formatValue(det.gamas, 3), 560, y);
                y += 15;
            });
        }
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`γd mín (g/cm³): ${formatValue(dados.mediaGamadMin, 3)}`, 490, y);
    }

    // Desenhar rodapé
    function desenharRodape(ctx, dados) {
        // Definir estilo
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';

        // Linha horizontal
        ctx.beginPath();
        ctx.moveTo(50, 780);
        ctx.lineTo(545, 780);
        ctx.stroke();

        // Texto do rodapé
        ctx.fillText('Documento gerado pelo Sistema de Calculadora de Compacidade', 297, 800);
        ctx.fillText(`Data de Geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 297, 815);
    }

    // API pública
    return {
        gerarPDF
    };
})();

