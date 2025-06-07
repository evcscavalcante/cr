// Módulo de exportação de dados refatorado para usar ES modules
// Este módulo é responsável por exportar dados em diferentes formatos

// Namespace para a calculadora
window.calculadora = window.calculadora || {};

// Classe DataExporter
class DataExporter {
  /**
   * Exporta dados para CSV
   * @param {Array<Object>} data - Array de objetos com os dados a serem exportados
   * @param {string} filename - Nome do arquivo a ser gerado
   * @returns {string} - URL do arquivo gerado
   */
  exportToCSV(data, filename = 'dados_exportados.csv') {
    if (!data || !data.length) {
      console.error('Nenhum dado para exportar');
      return null;
    }

    try {
      // Obtém os cabeçalhos a partir das chaves do primeiro objeto
      const headers = Object.keys(data[0]);
      
      // Cria a linha de cabeçalho
      let csvContent = headers.join(',') + '\n';
      
      // Adiciona as linhas de dados
      data.forEach(item => {
        const row = headers.map(header => {
          // Trata valores que podem conter vírgulas ou aspas
          const value = item[header] === null || item[header] === undefined ? '' : item[header];
          const valueStr = String(value);
          
          // Se o valor contém vírgulas, aspas ou quebras de linha, envolve em aspas
          if (valueStr.includes(',') || valueStr.includes('"') || valueStr.includes('\n')) {
            return `"${valueStr.replace(/"/g, '""')}"`;
          }
          return valueStr;
        }).join(',');
        
        csvContent += row + '\n';
      });
      
      // Cria um Blob com o conteúdo CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Cria uma URL para o Blob
      const url = URL.createObjectURL(blob);
      
      // Cria um link para download e simula o clique
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return url;
    } catch (error) {
      console.error('Erro ao exportar para CSV:', error);
      throw error;
    }
  }

  /**
   * Exporta dados para JSON
   * @param {Array<Object>|Object} data - Dados a serem exportados
   * @param {string} filename - Nome do arquivo a ser gerado
   * @returns {string} - URL do arquivo gerado
   */
  exportToJSON(data, filename = 'dados_exportados.json') {
    if (!data) {
      console.error('Nenhum dado para exportar');
      return null;
    }

    try {
      // Converte os dados para string JSON formatada
      const jsonContent = JSON.stringify(data, null, 2);
      
      // Cria um Blob com o conteúdo JSON
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      
      // Cria uma URL para o Blob
      const url = URL.createObjectURL(blob);
      
      // Cria um link para download e simula o clique
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return url;
    } catch (error) {
      console.error('Erro ao exportar para JSON:', error);
      throw error;
    }
  }

  /**
   * Exporta dados para Excel (XLSX)
   * @param {Array<Object>} data - Array de objetos com os dados a serem exportados
   * @param {string} filename - Nome do arquivo a ser gerado
   * @returns {string} - URL do arquivo gerado
   */
  exportToExcel(data, filename = 'dados_exportados.xlsx') {
    // Esta função requer uma biblioteca externa como SheetJS (xlsx)
    // Como não temos essa dependência instalada, vamos exportar como CSV
    console.warn('Exportação para Excel não implementada. Exportando como CSV...');
    return this.exportToCSV(data, filename.replace('.xlsx', '.csv'));
  }
}

// Cria uma instância do DataExporter
const dataExporter = new DataExporter();

// Exporta a instância para o namespace global
window.calculadora.dataExporter = dataExporter;

// Exporta a classe e a instância para uso com ES modules
export { DataExporter, dataExporter };

