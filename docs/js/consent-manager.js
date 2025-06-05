class ConsentManager {
  constructor() {
    this.consentTypes = {
      dataCollection: 'coleta_dados',
      analytics: 'analytics',
      cloudStorage: 'armazenamento_nuvem'
    };
  }

  hasConsent(type) {
    return localStorage.getItem(`consent_${type}`) === 'true';
  }

  setConsent(type, value, metadata = {}) {
    localStorage.setItem(`consent_${type}`, value);
    if (window.api && window.api.registerConsent) {
      window.api.registerConsent(type, value, {
        timestamp: new Date().toISOString(),
        ...metadata
      });
    }
    return value;
  }

  showConsentBanner() {
    const banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.innerHTML = `
      <h3>Política de Privacidade e Consentimento</h3>
      <p>Este aplicativo coleta e processa dados pessoais para fornecer seus serviços. Por favor, revise nossa <a href="privacy-policy.html" id="privacy-policy-link">Política de Privacidade</a>.</p>
      <div class="consent-options">
        <div class="consent-option">
          <input type="checkbox" id="consent-data-collection" checked>
          <label for="consent-data-collection">Coleta de dados necessários para funcionamento</label>
        </div>
        <div class="consent-option">
          <input type="checkbox" id="consent-cloud-storage">
          <label for="consent-cloud-storage">Armazenamento em nuvem (Firebase)</label>
        </div>
      </div>
      <div class="consent-actions">
        <button id="accept-consent">Aceitar Selecionados</button>
        <button id="reject-all-consent">Rejeitar Todos</button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('accept-consent').addEventListener('click', () => {
      this.setConsent(this.consentTypes.dataCollection,
        document.getElementById('consent-data-collection').checked);
      this.setConsent(this.consentTypes.cloudStorage,
        document.getElementById('consent-cloud-storage').checked);
      banner.remove();
    });

    document.getElementById('reject-all-consent').addEventListener('click', () => {
      Object.values(this.consentTypes).forEach(type => {
        this.setConsent(type, false);
      });
      banner.remove();
    });
  }
}

window.ConsentManager = ConsentManager;
