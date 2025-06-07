(function(){
  window.calculadora = window.calculadora || {};

  async function fetchTemplate(file){
    const resp = await fetch(`./templates/${file}`);
    const text = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const form = doc.querySelector('.calculadora-container');
    return form ? form.outerHTML : '';
  }

  window.calculadora.loadTemplates = async function(){
    const mapping = {
      'in-situ': 'densidade_in_situ.html',
      'real': 'densidade_real.html',
      'max-min': 'densidade_max_min.html'
    };
    window.calculadora.templates = {};
    for(const [key,file] of Object.entries(mapping)){
      try{
        window.calculadora.templates[key] = await fetchTemplate(file);
      }catch(err){
        console.error('Erro ao carregar template', key, err);
        const aviso = 'Falha ao carregar templates. Execute a aplicação via \"npm start\"';
        if (typeof window.showToast === 'function') {
          window.showToast(aviso, 'error', 5000);
        } else {
          alert(aviso);
        }
      }
    }
    window.calculadora.templatesLoaded = true;
    document.dispatchEvent(new Event('templatesLoaded'));
  };
})();
