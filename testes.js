// Módulo de testes para verificar as modificações
// Este arquivo será usado para testar as alterações feitas no projeto

// Função para testar a carga dos templates
function testarCargaTemplates() {
  console.log('Testando carga de templates...');
  
  // Array com os templates a serem testados
  const templates = [
    'densidade_in_situ.html',
    'densidade_real.html',
    'densidade_max_min.html'
  ];
  
  // Testa cada template
  templates.forEach(template => {
    fetch(`templates/${template}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro ao carregar o template ${template}: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        console.log(`Template ${template} carregado com sucesso (${html.length} bytes)`);
        // Verifica se o HTML contém elementos essenciais
        if (!html.includes('form class="calculadora-container"')) {
          throw new Error(`Template ${template} não contém a estrutura esperada`);
        }
        console.log(`✓ Template ${template} validado com sucesso`);
      })
      .catch(error => {
        console.error(`✗ Erro no teste do template ${template}:`, error);
      });
  });
}

// Função para testar a integração com o módulo de cálculos
function testarModuloCalculos() {
  console.log('Testando módulo de cálculos...');
  
  // Verifica se o módulo de cálculos está disponível
  if (typeof window.calculadora !== 'undefined' && typeof window.calculadora.calculos !== 'undefined') {
    console.log('✓ Módulo de cálculos encontrado');
    
    // Testa funções específicas do módulo de cálculos
    const funcoes = [
      'calcularDensidadeInSitu',
      'calcularDensidadeReal',
      'calcularDensidadeMaxMin'
    ];
    
    funcoes.forEach(funcao => {
      if (typeof window.calculadora.calculos[funcao] === 'function') {
        console.log(`✓ Função ${funcao} encontrada`);
      } else {
        console.error(`✗ Função ${funcao} não encontrada no módulo de cálculos`);
      }
    });
  } else {
    console.error('✗ Módulo de cálculos não encontrado');
  }
}

// Função para testar a integração com o banco de dados
function testarBancoDados() {
  console.log('Testando módulo de banco de dados...');
  
  // Verifica se o módulo de banco de dados está disponível
  if (typeof window.calculadora !== 'undefined' && typeof window.calculadora.db !== 'undefined') {
    console.log('✓ Módulo de banco de dados encontrado');
    
    // Testa funções específicas do módulo de banco de dados
    const funcoes = [
      'init',
      'salvarRegistro',
      'listarRegistros',
      'obterRegistro',
      'excluirRegistro'
    ];
    
    funcoes.forEach(funcao => {
      if (typeof window.calculadora.db[funcao] === 'function') {
        console.log(`✓ Função ${funcao} encontrada`);
      } else {
        console.error(`✗ Função ${funcao} não encontrada no módulo de banco de dados`);
      }
    });
  } else {
    console.error('✗ Módulo de banco de dados não encontrado');
  }
}

// Função para executar todos os testes
function executarTestes() {
  console.log('Iniciando testes do projeto...');
  
  // Executa os testes em sequência
  testarCargaTemplates();
  
  // Aguarda um pouco para garantir que os módulos estejam carregados
  setTimeout(() => {
    testarModuloCalculos();
    testarBancoDados();
    
    console.log('Testes concluídos!');
  }, 1000);
}

// Exporta as funções de teste
export {
  executarTestes,
  testarCargaTemplates,
  testarModuloCalculos,
  testarBancoDados
};

// Executa os testes automaticamente se estiver em modo de teste
if (window.location.search.includes('modo=teste')) {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Modo de teste ativado');
    executarTestes();
  });
}

