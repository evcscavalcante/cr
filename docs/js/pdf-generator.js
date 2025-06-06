// Módulo de geração de PDF para a Calculadora de Compacidade
// Implementa a geração de relatórios em PDF conforme o modelo fornecido

// Namespace para calculadora
window.calculadora = window.calculadora || {};

// Módulo de geração de PDF
window.calculadora.pdfGenerator = (() => {
    // === Nova geração de PDF utilizando o próprio HTML do formulário ===
    function gerarPDF(tipo, dados) {
        console.log(`Gerando PDF via HTML para ${tipo}:`, dados);

        // Para o ensaio "in-situ" usamos um template dedicado para evitar
        // quebra incorreta do cabeçalho no PDF.
        if (tipo === 'in-situ') {
            return gerarPDFInSituHTML(dados);
        }

        return new Promise((resolve, reject) => {
            if (typeof html2pdf === 'undefined') {
                return reject(new Error('html2pdf não carregado'));
            }

            const form = document.querySelector('#calculadora .calculadora-container');
            if (!form) {
                return reject(new Error('Formulário não encontrado'));
            }

            const clone = form.cloneNode(true);

            // Remove botões de ação
            clone.querySelectorAll('button').forEach(b => b.remove());

            // Congela campos de entrada para aparecerem como texto
            clone.querySelectorAll('input, select, textarea').forEach(el => {
                el.setAttribute('readonly', true);
                el.style.border = 'none';
                el.style.outline = 'none';
                el.style.background = 'transparent';
            });

            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.appendChild(clone);
            document.body.appendChild(container);

            const opt = {
                margin: 10,
                filename: `${tipo}_${dados.registro || 'sem_registro'}.pdf`,
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(clone).save().then(() => {
                document.body.removeChild(container);
                resolve(true);
            }).catch(err => {
                document.body.removeChild(container);
                reject(err);
            });
        });
    }

    // Mantém a versão antiga caso seja necessário utilizar o canvas
    function gerarPDFAntigo(tipo, dados) {
        return new Promise(async (resolve, reject) => {
            if (typeof html2pdf === 'undefined') {
                return reject(new Error('html2pdf não carregado'));
            }

            let canvas;
            try {
                // Criar elemento canvas para desenhar o PDF com maior resolução
                const DPI = 150; // aumenta qualidade final
                canvas = document.createElement("canvas");
                canvas.width = Math.round(8.27 * DPI);  // largura A4 em polegadas
                canvas.height = Math.round(11.69 * DPI); // altura A4 em polegadas
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

                const opt = {
                    margin: 0,
                    filename: `${tipo}_${dados.registro || 'sem_registro'}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                await html2pdf().set(opt).from(canvas).save();

                // Remover canvas
                document.body.removeChild(canvas);

                // Resolver indicando sucesso
                resolve(true);

            } catch (error) {
                console.error("Erro ao gerar PDF:", error);
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
        ctx.fillText(`Diferença (g/cm³): ${formatValue(dados.diferenca, 3)}`, 50, y);
        ctx.fillText(`Média Densidade Real (g/cm³): ${formatValue(dados.mediaDensidadeReal, 3)}`, 50, y + 20);
        ctx.fillText(`Status: ${dados.status || 'N/A'}`, 300, y + 20);
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

    // === Novo gerador via HTML para Densidade In Situ ===
    function gerarPDFInSituHTML(dados) {
        return new Promise((resolve, reject) => {
            if (typeof html2pdf === 'undefined') {
                return reject(new Error('html2pdf não carregado'));
            }

            const container = document.createElement('div');
            container.innerHTML = buildInSituHtml(dados);
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            document.body.appendChild(container);

            const opt = {
                margin:       0,
                filename:     `in-situ_${dados.registro || 'sem_registro'}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['css', 'legacy'] }
            };

            html2pdf().set(opt).from(container).save().then(() => {
                document.body.removeChild(container);
                resolve(true);
            }).catch(err => {
                document.body.removeChild(container);
                reject(err);
            });
        });
    }

    function buildInSituHtml(dados) {
        const f = (v, p=0) => (typeof v === 'number' && !isNaN(v)) ? v.toFixed(p).replace('.', ',') : (v || '');

        const maxRows = (dados.determinacoesMax || []).map(det =>
            `<tr>
                <td>${f(det.moldeSolo, 0)}</td>
                <td>${f(det.molde, 0)}</td>
                <td>${f(det.solo, 0)}</td>
                <td>${f(det.volume, 0)}</td>
                <td>${f(det.gamaNat, 3)}</td>
                <td>${f(det.w, 1)}</td>
                <td>${f(det.gamad, 3)}</td>
            </tr>`).join('');

        const minRows = (dados.determinacoesMin || []).map(det =>
            `<tr>
                <td>${det.numeroCilindro || ''}</td>
                <td>${f(det.moldeSolo, 0)}</td>
                <td>${f(det.molde, 0)}</td>
                <td>${f(det.solo, 0)}</td>
                <td>${f(det.volume, 0)}</td>
                <td>${f(det.gamad, 3)}</td>
                <td>${f(det.w, 1)}</td>
            </tr>`).join('');

        const inSituRows = (dados.determinacoesInSitu || []).map(det =>
            `<tr>
                <td>${det.numeroCilindro || ''}</td>
                <td>${f(det.moldeSolo, 0)}</td>
                <td>${f(det.molde, 0)}</td>
                <td>${f(det.solo, 0)}</td>
                <td>${f(det.volume, 0)}</td>
                <td>${f(det.gamaNat, 3)}</td>
            </tr>`).join('');

        const umidTopoRows = (dados.determinacoesUmidadeTopo || []).map(det =>
            `<tr>
                <td>${det.capsula || ''}</td>
                <td>${f(det.soloUmidoTara, 2)}</td>
                <td>${f(det.soloSecoTara, 2)}</td>
                <td>${f(det.tara, 2)}</td>
                <td>${f(det.soloSeco, 2)}</td>
                <td>${f(det.agua, 2)}</td>
                <td>${f(det.umidade, 1)}</td>
            </tr>`).join('');

        const umidBaseRows = (dados.determinacoesUmidadeBase || []).map(det =>
            `<tr>
                <td>${det.capsula || ''}</td>
                <td>${f(det.soloUmidoTara, 2)}</td>
                <td>${f(det.soloSecoTara, 2)}</td>
                <td>${f(det.tara, 2)}</td>
                <td>${f(det.soloSeco, 2)}</td>
                <td>${f(det.agua, 2)}</td>
                <td>${f(det.umidade, 1)}</td>
            </tr>`).join('');

        return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8" />
<style>
body{font-family:Arial, sans-serif;font-size:11px;margin:20px auto;max-width:900px;color:#000;}
h1,h2,h3{margin:0;padding:0}
.center{text-align:center}
.section{border:1px dashed #000;padding:10px 15px;margin-bottom:20px}
.inline-fields{display:flex;justify-content:space-between;margin-bottom:6px}
.inline-fields div{width:32%;white-space:nowrap}
.small-space{margin-bottom:6px}
table{width:100%;border-collapse:collapse;margin-top:8px}
th,td{border:1px dashed #000;padding:4px 6px;text-align:center;font-size:11px}
th{background:#eee;font-weight:bold}
.table-caption{text-align:center;font-size:12px;font-weight:bold;margin-bottom:4px}
.footer-text{font-size:9px;text-align:center;margin-top:20px}
.pagebreak{page-break-before:always}
</style></head><body>
<div class="section">
<div class="center"><h2>DETERMINAÇÃO DA COMPACTAÇÃO RELATIVA</h2><p style="font-size:10px;font-style:italic;">NBR 6457:2024 – NBR 9813:2016</p></div>
<div class="inline-fields"><div><span class="label-bold">OPERADOR:</span> ${dados.operador || ''}</div><div><span class="label-bold">NORTE:</span> ${f(dados.norte,3)}</div><div><span class="label-bold">CAMADA N°:</span> ${dados.camada || ''}</div></div>
<div class="inline-fields"><div><span class="label-bold">RESPONSÁVEL PELO CÁLCULO:</span> ${dados.responsavel || ''}</div><div><span class="label-bold">ESTE:</span> ${f(dados.este,3)}</div><div><span class="label-bold">MATERIAL:</span> ${dados.material || ''}</div></div>
<div class="inline-fields"><div><span class="label-bold">VERIFICADOR:</span> ${dados.verificador || ''}</div><div><span class="label-bold">COTA:</span> ${f(dados.cota,3)}</div><div><span class="label-bold">ORIGEM:</span> ${dados.origem || ''}</div></div>
<div class="inline-fields small-space"><div><span class="label-bold">DATA:</span> ${dados.data || ''}</div><div><span class="label-bold">QUADRANTE:</span> ${dados.quadrante || ''}</div><div><span class="label-bold">REGISTRO:</span> ${dados.registro || ''}</div></div>
<div class="inline-fields"><div><span class="label-bold">HORA:</span> ${dados.hora || ''}</div></div>
<div class="inline-fields small-space"><div><span class="label-bold">DISPOSITIVOS</span></div><div><span class="label-bold">BALANÇA:</span> ${dados.balanca || ''} <span class="label-bold">ESTUFA:</span> ${dados.estufa || ''}</div></div>
<div class="table-caption">DENSIDADE SECA MÁXIMA</div>
<table><thead><tr><th>Molde+Solo(g)</th><th>Molde(g)</th><th>Solo(g)</th><th>Volume(cm³)</th><th>γnat</th><th>w(%)</th><th>γd</th></tr></thead><tbody>${maxRows}</tbody></table>
<div class="table-caption">DENSIDADE SECA MÍNIMA</div>
<table><thead><tr><th>Cil Nº</th><th>Molde+Solo(g)</th><th>Molde(g)</th><th>Solo(g)</th><th>Volume(cm³)</th><th>γd</th><th>w(%)</th></tr></thead><tbody>${minRows}</tbody></table>
<div class="pagebreak"></div>
<div class="table-caption">DENSIDADE "IN SITU" – CILINDRO DE CRAVAÇÃO</div>
<table><thead><tr><th>Cil Nº</th><th>Molde+Solo(g)</th><th>Molde(g)</th><th>Solo(g)</th><th>Volume(cm³)</th><th>γnat</th></tr></thead><tbody>${inSituRows}</tbody></table>
<div class="table-caption">UMIDADE - TOPO</div>
<table><thead><tr><th>Cápsula Nº</th><th>Solo Úmido+Tara(g)</th><th>Solo Seco+Tara(g)</th><th>Tara(g)</th><th>Solo Seco(g)</th><th>Água(g)</th><th>Umidade(%)</th></tr></thead><tbody>${umidTopoRows}</tbody></table>
<div class="table-caption">UMIDADE - BASE</div>
<table><thead><tr><th>Cápsula Nº</th><th>Solo Úmido+Tara(g)</th><th>Solo Seco+Tara(g)</th><th>Tara(g)</th><th>Solo Seco(g)</th><th>Água(g)</th><th>Umidade(%)</th></tr></thead><tbody>${umidBaseRows}</tbody></table>
<div class="footer-text">Documento gerado pelo Sistema de Calculadora de Compacidade</div>
</div></body></html>`;
    }

    // API pública
    return {
        gerarPDF,
        gerarPDFAntigo
    };
})();

