// Módulo de cálculo da densidade da água em função da temperatura
// Implementa interpolação linear para obter valores precisos

window.calculadora = window.calculadora || {};

window.calculadora.densidadeAgua = (() => {
    // Tabela de densidade da água em função da temperatura
    const tabelaDensidadeAgua = [
        { temperatura: 15, densidade: 0.9991 },
        { temperatura: 16, densidade: 0.9989 },
        { temperatura: 17, densidade: 0.9988 },
        { temperatura: 18, densidade: 0.9986 },
        { temperatura: 19, densidade: 0.9984 },
        { temperatura: 20, densidade: 0.9982 },
        { temperatura: 21, densidade: 0.9980 },
        { temperatura: 22, densidade: 0.9978 },
        { temperatura: 23, densidade: 0.9975 },
        { temperatura: 24, densidade: 0.9973 },
        { temperatura: 25, densidade: 0.9970 },
        { temperatura: 26, densidade: 0.9968 },
        { temperatura: 27, densidade: 0.9965 },
        { temperatura: 28, densidade: 0.9962 },
        { temperatura: 29, densidade: 0.9959 },
        { temperatura: 30, densidade: 0.9956 },
        { temperatura: 31, densidade: 0.9953 },
        { temperatura: 32, densidade: 0.9949 },
        { temperatura: 33, densidade: 0.9946 },
        { temperatura: 34, densidade: 0.9942 },
        { temperatura: 35, densidade: 0.9939 }
    ];

    // Função para obter a densidade da água em função da temperatura
    function obterDensidade(temperatura) {
        // Verificar se a temperatura está dentro dos limites da tabela
        if (temperatura < tabelaDensidadeAgua[0].temperatura) {
            console.warn(`Temperatura ${temperatura}°C abaixo do limite mínimo da tabela. Usando valor mínimo.`);
            return tabelaDensidadeAgua[0].densidade;
        }
        
        if (temperatura > tabelaDensidadeAgua[tabelaDensidadeAgua.length - 1].temperatura) {
            console.warn(`Temperatura ${temperatura}°C acima do limite máximo da tabela. Usando valor máximo.`);
            return tabelaDensidadeAgua[tabelaDensidadeAgua.length - 1].densidade;
        }
        
        // Verificar se a temperatura está exatamente em um dos pontos da tabela
        const pontoExato = tabelaDensidadeAgua.find(ponto => ponto.temperatura === temperatura);
        if (pontoExato) {
            return pontoExato.densidade;
        }
        
        // Encontrar os pontos para interpolação
        let i = 0;
        while (i < tabelaDensidadeAgua.length - 1 && tabelaDensidadeAgua[i + 1].temperatura < temperatura) {
            i++;
        }
        
        const ponto1 = tabelaDensidadeAgua[i];
        const ponto2 = tabelaDensidadeAgua[i + 1];
        
        // Interpolação linear
        const fator = (temperatura - ponto1.temperatura) / (ponto2.temperatura - ponto1.temperatura);
        const densidade = ponto1.densidade + fator * (ponto2.densidade - ponto1.densidade);
        
        return parseFloat(densidade.toFixed(4));
    }

    // API pública
    return {
        obterDensidade
    };
})();
