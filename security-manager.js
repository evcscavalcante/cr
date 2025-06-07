// Módulo de segurança refatorado para usar ES modules
// Este módulo implementa uma Content Security Policy (CSP) para a aplicação

// Namespace para a calculadora
window.calculadora = window.calculadora || {};

// Classe SecurityManager
class SecurityManager {
  constructor() {
    this.cspEnabled = false;
  }

  /**
   * Inicializa o gerenciador de segurança
   */
  init() {
    this.setupCSP();
    this.monitorXSS();
    console.log('Gerenciador de segurança inicializado');
  }

  /**
   * Configura a Content Security Policy (CSP)
   */
  setupCSP() {
    // Verifica se já existe uma meta tag CSP
    let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    // Se não existir, cria uma nova
    if (!cspMeta) {
      cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      
      // Define a política CSP
      const cspContent = [
        "default-src 'self'",
        "script-src 'self' https://cdnjs.cloudflare.com https://www.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
        "img-src 'self' data: blob:",
        "font-src 'self' https://cdnjs.cloudflare.com",
        "connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'"
      ].join('; ');
      
      cspMeta.content = cspContent;
      document.head.appendChild(cspMeta);
      
      this.cspEnabled = true;
      console.log('Content Security Policy configurada');
    } else {
      this.cspEnabled = true;
      console.log('Content Security Policy já configurada');
    }
  }

  /**
   * Monitora tentativas de XSS
   */
  monitorXSS() {
    // Adiciona um listener para erros de CSP
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error('Violação de CSP detectada:', {
        directive: e.violatedDirective,
        blockedURI: e.blockedURI,
        originalPolicy: e.originalPolicy
      });
      
      // Registra a violação
      if (window.calculadora.apiClient) {
        window.calculadora.apiClient.registrarAuditoria('csp_violation', {
          directive: e.violatedDirective,
          blockedURI: e.blockedURI,
          originalPolicy: e.originalPolicy,
          referrer: document.referrer,
          userAgent: navigator.userAgent
        }).catch(err => console.error('Erro ao registrar violação de CSP:', err));
      }
    });
  }

  /**
   * Sanitiza uma string HTML
   * @param {string} html - String HTML a ser sanitizada
   * @returns {string} - String HTML sanitizada
   */
  sanitizeHTML(html) {
    // Usa DOMPurify se disponível
    if (window.DOMPurify) {
      return window.DOMPurify.sanitize(html);
    }
    
    // Implementação básica de sanitização
    const tempDiv = document.createElement('div');
    tempDiv.textContent = html;
    return tempDiv.innerHTML;
  }

  /**
   * Verifica se uma URL é segura
   * @param {string} url - URL a ser verificada
   * @returns {boolean} - true se a URL for segura, false caso contrário
   */
  isSafeURL(url) {
    try {
      const parsedURL = new URL(url);
      
      // Lista de protocolos permitidos
      const allowedProtocols = ['https:', 'http:', 'data:', 'blob:'];
      if (!allowedProtocols.includes(parsedURL.protocol)) {
        return false;
      }
      
      // Lista de domínios permitidos
      const allowedDomains = [
        window.location.hostname,
        'cdnjs.cloudflare.com',
        'firestore.googleapis.com',
        'identitytoolkit.googleapis.com',
        'www.gstatic.com'
      ];
      
      // Se for http: ou https:, verifica o domínio
      if (parsedURL.protocol === 'http:' || parsedURL.protocol === 'https:') {
        return allowedDomains.some(domain => parsedURL.hostname === domain);
      }
      
      // Se for data: ou blob:, permite
      return true;
    } catch (error) {
      console.error('URL inválida:', url);
      return false;
    }
  }
}

// Cria uma instância do SecurityManager
const securityManager = new SecurityManager();

// Exporta a instância para o namespace global
window.calculadora.securityManager = securityManager;

// Exporta a classe e a instância para uso com ES modules
export { SecurityManager, securityManager };

