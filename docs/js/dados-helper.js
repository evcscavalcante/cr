// Funções auxiliares de formatação para números e datas
// Disponibiliza APIs via window.calculadora.dadosHelper

document.addEventListener('DOMContentLoaded', () => {
  window.calculadora = window.calculadora || {};

  window.calculadora.dadosHelper = (() => {
    function formatarNumero(valor, casas = 2) {
      const numero = typeof valor === 'number' ? valor : parseFloat(valor);
      if (isNaN(numero)) return '';
      return numero.toLocaleString('pt-BR', {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
      });
    }

    function formatarData(dataStr) {
      if (!dataStr) return '';
      const data = new Date(dataStr);
      if (isNaN(data)) return dataStr;
      return data.toLocaleDateString('pt-BR');
    }

    // API pública
    return {
      formatarNumero,
      formatarData
    };
  })();

  // Suporte a testes Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.calculadora.dadosHelper;
  }
});
