// Módulo de visualização de dados refatorado para usar ES modules e Chart.js
// Este módulo é responsável por gerar visualizações gráficas dos dados

// Importa a biblioteca Chart.js
import Chart from 'chart.js/auto';

// Namespace para a calculadora
window.calculadora = window.calculadora || {};

// Classe DataVisualization
class DataVisualization {
  constructor() {
    this.charts = {};
  }

  /**
   * Cria um gráfico de barras
   * @param {string} canvasId - ID do elemento canvas onde o gráfico será renderizado
   * @param {string} title - Título do gráfico
   * @param {Array<string>} labels - Rótulos para o eixo X
   * @param {Array<number>} data - Dados para o eixo Y
   * @param {string} color - Cor das barras
   * @returns {Chart} - Instância do gráfico criado
   */
  createBarChart(canvasId, title, labels, data, color = 'rgba(54, 162, 235, 0.8)') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Elemento canvas com ID ${canvasId} não encontrado`);
      return null;
    }

    // Destrói o gráfico existente, se houver
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: title,
          data,
          backgroundColor: color,
          borderColor: color.replace('0.8', '1'),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: title
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // Armazena a referência do gráfico
    this.charts[canvasId] = chart;

    return chart;
  }

  /**
   * Cria um gráfico de linha
   * @param {string} canvasId - ID do elemento canvas onde o gráfico será renderizado
   * @param {string} title - Título do gráfico
   * @param {Array<string>} labels - Rótulos para o eixo X
   * @param {Array<number>} data - Dados para o eixo Y
   * @param {string} color - Cor da linha
   * @returns {Chart} - Instância do gráfico criado
   */
  createLineChart(canvasId, title, labels, data, color = 'rgba(75, 192, 192, 0.8)') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Elemento canvas com ID ${canvasId} não encontrado`);
      return null;
    }

    // Destrói o gráfico existente, se houver
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: title,
          data,
          backgroundColor: color,
          borderColor: color.replace('0.8', '1'),
          borderWidth: 2,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: title
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });

    // Armazena a referência do gráfico
    this.charts[canvasId] = chart;

    return chart;
  }

  /**
   * Cria um gráfico de dispersão
   * @param {string} canvasId - ID do elemento canvas onde o gráfico será renderizado
   * @param {string} title - Título do gráfico
   * @param {Array<{x: number, y: number}>} data - Pontos para o gráfico
   * @param {string} color - Cor dos pontos
   * @returns {Chart} - Instância do gráfico criado
   */
  createScatterChart(canvasId, title, data, color = 'rgba(255, 99, 132, 0.8)') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Elemento canvas com ID ${canvasId} não encontrado`);
      return null;
    }

    // Destrói o gráfico existente, se houver
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: title,
          data,
          backgroundColor: color,
          borderColor: color.replace('0.8', '1'),
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: title
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom'
          },
          y: {
            beginAtZero: false
          }
        }
      }
    });

    // Armazena a referência do gráfico
    this.charts[canvasId] = chart;

    return chart;
  }

  /**
   * Destrói um gráfico
   * @param {string} canvasId - ID do elemento canvas onde o gráfico foi renderizado
   */
  destroyChart(canvasId) {
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
      delete this.charts[canvasId];
    }
  }

  /**
   * Destrói todos os gráficos
   */
  destroyAllCharts() {
    Object.keys(this.charts).forEach(canvasId => {
      this.charts[canvasId].destroy();
    });
    this.charts = {};
  }
}

// Cria uma instância do DataVisualization
const dataVisualization = new DataVisualization();

// Exporta a instância para o namespace global
window.calculadora.dataVisualization = dataVisualization;

// Exporta a classe e a instância para uso com ES modules
export { DataVisualization, dataVisualization };

