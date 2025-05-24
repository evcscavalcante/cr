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
            try {
                // Criar elemento canvas para desenhar o PDF
                const canvas = document.createElement('canvas');
                canvas.width = 595; // A4 width in pixels at 72 dpi
                canvas.height = 842; // A4 height in pixels at 72 dpi
                document.body.appendChild(canvas);
                
                // Obter contexto 2D
                const ctx = canvas.getContext('2d');
                
                // Desenhar fundo branco
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Desenhar cabeçalho
                desenharCabecalho(ctx, dados);
                
                // Desenhar conteúdo específico por tipo
                switch (tipo) {
                    case 'in-situ':
                        desenharDensidadeInSitu(ctx, dados);
                        break;
                    case 'real':
                        desenharDensidadeReal(ctx, dados);
                        break;
                    case 'max-min':
                        desenharDensidadeMaxMin(ctx, dados);
                        break;
                    default:
                        throw new Error(`Tipo de ensaio inválido: ${tipo}`);
                }
                
                // Desenhar rodapé
                desenharRodape(ctx, dados);
                
                // Converter canvas para PDF
                const imgData = canvas.toDataURL('image/png');
                
                // Criar PDF usando jsPDF
                const pdf = new jspdf.jsPDF();
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297); // A4 size in mm
                
                // Salvar PDF
                const nomeArquivo = `${tipo}_${dados.registro || 'sem_registro'}.pdf`;
                pdf.save(nomeArquivo);
                
                // Remover canvas
                document.body.removeChild(canvas);
                
                resolve(nomeArquivo);
            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
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
    
    // Desenhar densidade in situ
    function desenharDensidadeInSitu(ctx, dados) {
        // Título da seção
        ctx.font = 'bold 14px Arial';
        ctx.fillText('DENSIDADE IN SITU', 50, 130);
        
        // Informações gerais
        ctx.font = '12px Arial';
        ctx.fillText(`Responsável: ${dados.responsavel || ''}`, 50, 150);
        ctx.fillText(`Verificador: ${dados.verificador || ''}`, 300, 150);
        ctx.fillText(`Norte: ${dados.norte || ''}`, 50, 170);
        ctx.fillText(`Este: ${dados.este || ''}`, 300, 170);
        ctx.fillText(`Cota: ${dados.cota || ''}`, 50, 190);
        ctx.fillText(`Quadrante: ${dados.quadrante || ''}`, 300, 190);
        ctx.fillText(`Camada: ${dados.camada || ''}`, 50, 210);
        ctx.fillText(`Hora: ${dados.hora || ''}`, 300, 210);
        
        // Dispositivos
        ctx.fillText(`Balança: ${dados.balanca || ''}`, 50, 230);
        ctx.fillText(`Estufa: ${dados.estufa || ''}`, 300, 230);
        
        // Referências
        ctx.fillText(`Registro Densidade Real: ${dados.registroDensidadeReal || ''}`, 50, 250);
        ctx.fillText(`Registro Densidade Máx/Mín: ${dados.registroDensidadeMaxMin || ''}`, 300, 250);
        
        // Densidade in situ
        ctx.font = 'bold 14px Arial';
        ctx.fillText('DENSIDADE IN SITU', 50, 280);
        
        // Tabela de densidade in situ
        ctx.font = '12px Arial';
        ctx.fillText(`Número do Cilindro: ${dados.numeroCilindro || ''}`, 50, 300);
        ctx.fillText(`Molde + Solo (g): ${dados.moldeSolo || ''}`, 50, 320);
        ctx.fillText(`Molde (g): ${dados.molde || ''}`, 300, 320);
        ctx.fillText(`Solo (g): ${dados.solo || ''}`, 50, 340);
        ctx.fillText(`Volume (cm³): ${dados.volume || ''}`, 300, 340);
        ctx.fillText(`γ nat (g/cm³): ${dados.gamaNat || ''}`, 50, 360);
        
        // Umidade - Topo
        ctx.font = 'bold 14px Arial';
        ctx.fillText('UMIDADE - TOPO', 50, 390);
        
        // Tabela de umidade - topo
        ctx.font = '12px Arial';
        ctx.fillText(`Cápsula: ${dados.capsulaTopo || ''}`, 50, 410);
        ctx.fillText(`Solo Úmido + Tara (g): ${dados.soloUmidoTaraTopo || ''}`, 50, 430);
        ctx.fillText(`Solo Seco + Tara (g): ${dados.soloSecoTaraTopo || ''}`, 300, 430);
        ctx.fillText(`Tara (g): ${dados.taraTopo || ''}`, 50, 450);
        ctx.fillText(`Solo Seco (g): ${dados.soloSecoTopo || ''}`, 300, 450);
        ctx.fillText(`Água (g): ${dados.aguaTopo || ''}`, 50, 470);
        ctx.fillText(`Umidade (%): ${dados.umidadeTopo || ''}`, 300, 470);
        
        // Umidade - Base
        ctx.font = 'bold 14px Arial';
        ctx.fillText('UMIDADE - BASE', 50, 500);
        
        // Tabela de umidade - base
        ctx.font = '12px Arial';
        ctx.fillText(`Cápsula: ${dados.capsulaBase || ''}`, 50, 520);
        ctx.fillText(`Solo Úmido + Tara (g): ${dados.soloUmidoTaraBase || ''}`, 50, 540);
        ctx.fillText(`Solo Seco + Tara (g): ${dados.soloSecoTaraBase || ''}`, 300, 540);
        ctx.fillText(`Tara (g): ${dados.taraBase || ''}`, 50, 560);
        ctx.fillText(`Solo Seco (g): ${dados.soloSecoBase || ''}`, 300, 560);
        ctx.fillText(`Água (g): ${dados.aguaBase || ''}`, 50, 580);
        ctx.fillText(`Umidade (%): ${dados.umidadeBase || ''}`, 300, 580);
        
        // Resultados
        ctx.font = 'bold 14px Arial';
        ctx.fillText('RESULTADOS', 50, 610);
        
        // Tabela de resultados
        ctx.font = '12px Arial';
        ctx.fillText(`γd Topo (g/cm³): ${dados.gamadTopo || ''}`, 50, 630);
        ctx.fillText(`γd Base (g/cm³): ${dados.gamadBase || ''}`, 300, 630);
        ctx.fillText(`Índice de Vazios Topo: ${dados.indiceVaziosTopo || ''}`, 50, 650);
        ctx.fillText(`Índice de Vazios Base: ${dados.indiceVaziosBase || ''}`, 300, 650);
        ctx.fillText(`CR Topo (%): ${dados.crTopo || ''}`, 50, 670);
        ctx.fillText(`CR Base (%): ${dados.crBase || ''}`, 300, 670);
        
        // Status
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Status: ${dados.status || 'AGUARDANDO CÁLCULO'}`, 50, 700);
    }
    
    // Desenhar densidade real
    function desenharDensidadeReal(ctx, dados) {
        // Título da seção
        ctx.font = 'bold 14px Arial';
        ctx.fillText('DENSIDADE REAL DOS GRÃOS', 50, 130);
        
        // Umidade
        ctx.font = 'bold 14px Arial';
        ctx.fillText('TEOR DE UMIDADE', 50, 160);
        
        // Tabela de umidade
        ctx.font = '12px Arial';
        
        // Cabeçalho da tabela
        ctx.fillText('Determinação', 50, 180);
        ctx.fillText('1', 250, 180);
        ctx.fillText('2', 350, 180);
        ctx.fillText('3', 450, 180);
        
        // Linhas da tabela
        const linhasUmidade = [
            { label: 'Cápsula Nº', valores: [dados.capsulaReal1 || '', dados.capsulaReal2 || '', dados.capsulaReal3 || ''] },
            { label: 'Solo Úmido + Tara (g)', valores: [dados.soloUmidoTaraReal1 || '', dados.soloUmidoTaraReal2 || '', dados.soloUmidoTaraReal3 || ''] },
            { label: 'Solo Seco + Tara (g)', valores: [dados.soloSecoTaraReal1 || '', dados.soloSecoTaraReal2 || '', dados.soloSecoTaraReal3 || ''] },
            { label: 'Tara (g)', valores: [dados.taraReal1 || '', dados.taraReal2 || '', dados.taraReal3 || ''] },
            { label: 'Solo Seco (g)', valores: [dados.soloSecoReal1 || '', dados.soloSecoReal2 || '', dados.soloSecoReal3 || ''] },
            { label: 'Água (g)', valores: [dados.aguaReal1 || '', dados.aguaReal2 || '', dados.aguaReal3 || ''] },
            { label: 'Umidade (%)', valores: [dados.umidadeReal1 || '', dados.umidadeReal2 || '', dados.umidadeReal3 || ''] }
        ];
        
        let y = 200;
        linhasUmidade.forEach(linha => {
            ctx.fillText(linha.label, 50, y);
            ctx.fillText(linha.valores[0], 250, y);
            ctx.fillText(linha.valores[1], 350, y);
            ctx.fillText(linha.valores[2], 450, y);
            y += 20;
        });
        
        // Umidade média
        ctx.fillText(`Umidade Média (%): ${dados.umidadeMediaReal || ''}`, 50, y + 20);
        
        // Picnômetro
        ctx.font = 'bold 14px Arial';
        ctx.fillText('PICNÔMETRO', 50, y + 60);
        
        // Tabela de picnômetro
        ctx.font = '12px Arial';
        
        // Cabeçalho da tabela
        ctx.fillText('Determinação', 50, y + 80);
        ctx.fillText('1', 350, y + 80);
        ctx.fillText('2', 450, y + 80);
        
        // Linhas da tabela
        const linhasPicnometro = [
            { label: 'Picnômetro Nº', valores: [dados.picnometro1 || '', dados.picnometro2 || ''] },
            { label: 'Massa do Picnômetro (g)', valores: [dados.massaPic1 || '', dados.massaPic2 || ''] },
            { label: 'Massa Pic+Amostra+Água (g)', valores: [dados.massaPicAmostraAgua1 || '', dados.massaPicAmostraAgua2 || ''] },
            { label: 'Temperatura (°C)', valores: [dados.temperatura1 || '', dados.temperatura2 || ''] },
            { label: 'Massa Pic+Água (g)', valores: [dados.massaPicAgua1 || '', dados.massaPicAgua2 || ''] },
            { label: 'Densidade da Água (g/cm³)', valores: [dados.densidadeAgua1 || '', dados.densidadeAgua2 || ''] },
            { label: 'Massa do Solo Úmido (g)', valores: [dados.massaSoloUmido1 || '', dados.massaSoloUmido2 || ''] },
            { label: 'Massa do Solo Seco (g)', valores: [dados.massaSoloSeco1 || '', dados.massaSoloSeco2 || ''] },
            { label: 'Densidade Real (g/cm³)', valores: [dados.densidadeReal1 || '', dados.densidadeReal2 || ''] }
        ];
        
        y += 100;
        linhasPicnometro.forEach(linha => {
            ctx.fillText(linha.label, 50, y);
            ctx.fillText(linha.valores[0], 350, y);
            ctx.fillText(linha.valores[1], 450, y);
            y += 20;
        });
        
        // Resultados
        ctx.font = 'bold 14px Arial';
        ctx.fillText('RESULTADOS', 50, y + 20);
        
        // Tabela de resultados
        ctx.font = '12px Arial';
        ctx.fillText(`Diferença (%): ${dados.diferencaReal || ''}`, 50, y + 40);
        ctx.fillText(`Média Densidade Real (g/cm³): ${dados.mediaDensidadeReal || ''}`, 50, y + 60);
    }
    
    // Desenhar densidade máxima e mínima
    function desenharDensidadeMaxMin(ctx, dados) {
        // Título da seção
        ctx.font = 'bold 14px Arial';
        ctx.fillText('DENSIDADE MÁXIMA E MÍNIMA', 50, 130);
        
        // Densidade máxima
        ctx.font = 'bold 14px Arial';
        ctx.fillText('DENSIDADE MÁXIMA', 50, 160);
        
        // Tabela de densidade máxima
        ctx.font = '12px Arial';
        
        // Cabeçalho da tabela
        ctx.fillText('Determinação', 50, 180);
        ctx.fillText('1', 250, 180);
        ctx.fillText('2', 350, 180);
        ctx.fillText('3', 450, 180);
        
        // Linhas da tabela
        const linhasMax = [
            { label: 'Molde + Solo (g)', valores: [dados.moldeSoloMax1 || '', dados.moldeSoloMax2 || '', dados.moldeSoloMax3 || ''] },
            { label: 'Molde (g)', valores: [dados.moldeMax1 || '', dados.moldeMax2 || '', dados.moldeMax3 || ''] },
            { label: 'Solo (g)', valores: [dados.soloMax1 || '', dados.soloMax2 || '', dados.soloMax3 || ''] },
            { label: 'Volume (cm³)', valores: [dados.volumeMax1 || '', dados.volumeMax2 || '', dados.volumeMax3 || ''] },
            { label: 'γd (g/cm³)', valores: [dados.gamadMax1 || '', dados.gamadMax2 || '', dados.gamadMax3 || ''] },
            { label: 'w (%)', valores: [dados.wMax1 || '', dados.wMax2 || '', dados.wMax3 || ''] },
            { label: 'γs (g/cm³)', valores: [dados.gamasMax1 || '', dados.gamasMax2 || '', dados.gamasMax3 || ''] }
        ];
        
        let y = 200;
        linhasMax.forEach(linha => {
            ctx.fillText(linha.label, 50, y);
            ctx.fillText(linha.valores[0], 250, y);
            ctx.fillText(linha.valores[1], 350, y);
            ctx.fillText(linha.valores[2], 450, y);
            y += 20;
        });
        
        // Média da densidade máxima
        ctx.fillText(`γd máx (g/cm³): ${dados.gamadMax || ''}`, 50, y + 20);
        
        // Densidade mínima
        ctx.font = 'bold 14px Arial';
        ctx.fillText('DENSIDADE MÍNIMA', 50, y + 60);
        
        // Tabela de densidade mínima
        ctx.font = '12px Arial';
        
        // Cabeçalho da tabela
        ctx.fillText('Determinação', 50, y + 80);
        ctx.fillText('1', 250, y + 80);
        ctx.fillText('2', 350, y + 80);
        ctx.fillText('3', 450, y + 80);
        
        // Linhas da tabela
        const linhasMin = [
            { label: 'Número do Cilindro', valores: [dados.numeroCilindroMin1 || '', dados.numeroCilindroMin2 || '', dados.numeroCilindroMin3 || ''] },
            { label: 'Molde + Solo (g)', valores: [dados.moldeSoloMin1 || '', dados.moldeSoloMin2 || '', dados.moldeSoloMin3 || ''] },
            { label: 'Molde (g)', valores: [dados.moldeMin1 || '', dados.moldeMin2 || '', dados.moldeMin3 || ''] },
            { label: 'Solo (g)', valores: [dados.soloMin1 || '', dados.soloMin2 || '', dados.soloMin3 || ''] },
            { label: 'Volume (cm³)', valores: [dados.volumeMin1 || '', dados.volumeMin2 || '', dados.volumeMin3 || ''] },
            { label: 'γd (g/cm³)', valores: [dados.gamadMin1 || '', dados.gamadMin2 || '', dados.gamadMin3 || ''] },
            { label: 'w (%)', valores: [dados.wMin1 || '', dados.wMin2 || '', dados.wMin3 || ''] },
            { label: 'γs (g/cm³)', valores: [dados.gamasMin1 || '', dados.gamasMin2 || '', dados.gamasMin3 || ''] }
        ];
        
        y += 100;
        linhasMin.forEach(linha => {
            ctx.fillText(linha.label, 50, y);
            ctx.fillText(linha.valores[0], 250, y);
            ctx.fillText(linha.valores[1], 350, y);
            ctx.fillText(linha.valores[2], 450, y);
            y += 20;
        });
        
        // Média da densidade mínima
        ctx.fillText(`γd mín (g/cm³): ${dados.gamadMin || ''}`, 50, y + 20);
    }
    
    // Desenhar rodapé
    function desenharRodape(ctx, dados) {
        // Definir estilo
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        // Desenhar linha horizontal
        ctx.beginPath();
        ctx.moveTo(50, 800);
        ctx.lineTo(545, 800);
        ctx.stroke();
        
        // Desenhar texto do rodapé
        ctx.fillText('Calculadora de Compacidade - Versão 2.0', 297, 820);
        ctx.fillText(`Gerado em: ${new Date().toLocaleString()}`, 297, 835);
    }
    
    // API pública
    return {
        gerarPDF
    };
})();

// Adicionar jsPDF ao documento
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se jsPDF já está carregado
    if (typeof jspdf === 'undefined') {
        // Carregar jsPDF
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.async = true;
        document.head.appendChild(script);
    }
});
