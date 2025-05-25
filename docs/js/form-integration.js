
document.addEventListener('DOMContentLoaded', () => {
    window.calculadora = window.calculadora || {};

    window.calculadora.formIntegration = (() => {

        function configurarBotoes(tipo) {
            const btnCalcular = document.querySelector('.btn-calcular');
            if (btnCalcular) {
                btnCalcular.addEventListener('click', () => calcular(tipo));
            }
        }

        function calcular(tipo) {
            if (!window.calculadora.calculos) {
                console.error('Módulo de cálculos não disponível');
                return;
            }

            let dados = {};

            if (tipo === 'in-situ') {
                dados = {
                    moldeSolo: Number(document.getElementById('moldeSolo')?.value),
                    molde: Number(document.getElementById('molde')?.value),
                    volume: Number(document.getElementById('volume')?.value),
                    soloUmidoTaraTopo: Number(document.getElementById('soloUmidoTaraTopo')?.value),
                    soloSecoTaraTopo: Number(document.getElementById('soloSecoTaraTopo')?.value),
                    taraTopo: Number(document.getElementById('taraTopo')?.value),
                    soloUmidoTaraBase: Number(document.getElementById('soloUmidoTaraBase')?.value),
                    soloSecoTaraBase: Number(document.getElementById('soloSecoTaraBase')?.value),
                    taraBase: Number(document.getElementById('taraBase')?.value),
                    densidadeReal: Number(document.getElementById('densidadeRealRef')?.value),
                    gamadMax: Number(document.getElementById('densidadeMaximaRef')?.value),
                    gamadMin: Number(document.getElementById('densidadeMinimaRef')?.value)
                };
                window.calculadora.calculos.calcularDensidadeInSitu(dados);

            } else if (tipo === 'real') {
                if (window.calculadora.calculos.calcularDensidadeReal) {
                    window.calculadora.calculos.calcularDensidadeReal();
                }
            } else if (tipo === 'max-min') {
                if (window.calculadora.calculos.calcularDensidadeMaxMin) {
                    window.calculadora.calculos.calcularDensidadeMaxMin();
                }
            } else {
                console.warn('Tipo de cálculo desconhecido:', tipo);
            }
        }

        function carregarFormulario(tipo) {
            const calculadora = document.getElementById('calculadora');
            if (!calculadora) return;

            calculadora.innerHTML = '';
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

            const conteudo = template.content.cloneNode(true);
            calculadora.appendChild(conteudo);
            configurarBotoes(tipo);
        }

        // Configurar botões principais
        document.getElementById('btn-densidade-in-situ')?.addEventListener('click', () => carregarFormulario('in-situ'));
        document.getElementById('btn-densidade-real')?.addEventListener('click', () => carregarFormulario('real'));
        document.getElementById('btn-densidade-max-min')?.addEventListener('click', () => carregarFormulario('max-min'));

        return { carregarFormulario };
    })();
});
