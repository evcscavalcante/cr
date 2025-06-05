document.addEventListener('DOMContentLoaded', () => {
  window.calculadora = window.calculadora || {};

  window.calculadora.equipamentos = (() => {
    const STORAGE_KEY = 'equipamentos';

    function carregar() {
      try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (data && typeof data === 'object') {
          return {
            cilindros: Array.isArray(data.cilindros) ? data.cilindros : [],
            capsulas: Array.isArray(data.capsulas) ? data.capsulas : []
          };
        }
      } catch (e) {
        console.error('Erro ao carregar equipamentos:', e);
      }
      return { cilindros: [], capsulas: [] };
    }

    let dados = carregar();

    function salvar() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    }

    function adicionarCilindro(numero, peso, volume) {
      const cil = { numero, peso, volume };
      dados.cilindros.push(cil);
      salvar();
      return cil;
    }

    function listarCilindros() {
      return [...dados.cilindros];
    }

    function adicionarCapsula(numero, peso) {
      const cap = { numero, peso };
      dados.capsulas.push(cap);
      salvar();
      return cap;
    }

    function listarCapsulas() {
      return [...dados.capsulas];
    }

    return {
      adicionarCilindro,
      listarCilindros,
      adicionarCapsula,
      listarCapsulas
    };
  })();
});
