// Módulo de entrada para o index.html
// Este arquivo será o ponto de entrada para o webpack

// Importa os estilos
import '../css/styles.css';

// Importa os módulos principais
import './app';
import './login';
import './navigation';
import './side-menu';
import './dashboard-menu';
import './template-loader';
import './form-integration';
import './event-integration';
import './calculos';
import './densidade-agua';
import './db';
import './validation';
import './pdf-generator';
import './reference-system';
import './equipamentos';
import './secure-backup';
import './audit-logger';
import './consent-manager';
import './api-client';
import './crypto-helper';
import './dados-helper';
import './firebase-init';

// Importa os novos módulos
import './data-visualization';
import './data-exporter';
import './security-manager';

// Importa o módulo de testes
import { executarTestes } from './testes';

// Executa os testes se estiver em modo de teste
if (window.location.search.includes('modo=teste')) {
  console.log('Modo de teste ativado via index.js');
  window.executarTestes = executarTestes;
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log('Aplicação inicializada via módulo ES');
  
  // Inicializa o gerenciador de segurança
  if (window.calculadora.securityManager) {
    window.calculadora.securityManager.init();
  }
});

