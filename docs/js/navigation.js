// js/navigation.js
document.addEventListener('DOMContentLoaded', () => {
  window.calculadora = window.calculadora || {};

  window.calculadora.navegacao = (() => {
    const historico = [];
    let estadoAtual = { tela: 'menu', tipo: null, aba: null };

    const elementos = {
      menuPrincipal:       () => document.querySelector('.menu-principal'),
      secaoListaEnsaios:   () => document.querySelector('#secao-lista-ensaios'),
      calculadoraContent:  () => document.querySelector('#calculadora'),
      listaEnsaiosContent: () => document.querySelector('#lista-ensaios'),
      tabs:                () => document.querySelectorAll('.tab-btn'),
      tabContents:         () => document.querySelectorAll('.tab-content')
    };

    function removerFiltrosDuplicados() {
      const container = elementos.listaEnsaiosContent();
      if (!container) return;
      const filtros = container.querySelectorAll(':scope > .filtros-container');
      filtros.forEach((el, i) => {
        if (i > 0) el.remove();
      });
    }

    function navegarParaMenu() {
      if (estadoAtual.tela !== 'menu') {
        historico.push({ ...estadoAtual });
      }
      estadoAtual = { tela: 'menu', tipo: null, aba: null };

      const menu = elementos.menuPrincipal();
      if (menu) menu.style.display = 'block';

      const secao = elementos.secaoListaEnsaios();
      if (secao) secao.style.display = 'none';

      const calc = elementos.calculadoraContent();
      if (calc) calc.innerHTML = '';
    }

    function navegarParaLista(tipo) {
      if (!['in-situ', 'real', 'max-min'].includes(tipo)) {
        console.error('Tipo inválido:', tipo);
        return;
      }
      historico.push({ ...estadoAtual });
      estadoAtual = { tela: 'lista', tipo, aba: 'lista-ensaios' };

      const menu = elementos.menuPrincipal();
      if (menu) menu.style.display = 'none';

      const secao = elementos.secaoListaEnsaios();
      if (secao) secao.style.display = 'block';

      const calc = elementos.calculadoraContent();
      if (calc) calc.innerHTML = '';

      ativarAba('lista-ensaios');
      removerFiltrosDuplicados();
      carregarListaEnsaios(tipo);
      adicionarBotaoVoltarMenuPrincipal();
    }

    function navegarParaCalculadora(tipo, ensaio = null) {
      if (typeof tipo !== 'string' || !['in-situ', 'real', 'max-min'].includes(tipo)) {
        console.warn('navegarParaCalculadora: tipo inválido, pulando navegação →', tipo);
        return;
      }
      historico.push({ ...estadoAtual });
      estadoAtual = { tela: 'calculadora', tipo, aba: 'calculadora', ensaio };

      const menu = elementos.menuPrincipal();
      if (menu) menu.style.display = 'none';

      const secao = elementos.secaoListaEnsaios();
      if (secao) secao.style.display = 'block';

      ativarAba('calculadora');
      carregarFormularioCalculadora(tipo, ensaio);
      adicionarBotaoVoltarMenuPrincipal();
    }

    function voltar() {
      if (!historico.length) {
        return navegarParaMenu();
      }
      const ultimo = historico.pop();
      estadoAtual = { ...ultimo };

      const menu  = elementos.menuPrincipal();
      const secao = elementos.secaoListaEnsaios();
      const calc  = elementos.calculadoraContent();

      if (estadoAtual.tela === 'menu') {
        if (menu)  menu.style.display = 'block';
        if (secao) secao.style.display = 'none';
        if (calc)  calc.innerHTML = '';
      } else {
        if (menu)  menu.style.display = 'none';
        if (secao) secao.style.display = 'block';

        ativarAba(estadoAtual.aba);
        if (estadoAtual.tela === 'lista') {
          removerFiltrosDuplicados();
          carregarListaEnsaios(estadoAtual.tipo);
        } else {
          carregarFormularioCalculadora(estadoAtual.tipo, estadoAtual.ensaio);
        }
        adicionarBotaoVoltarMenuPrincipal();
      }
    }

    function adicionarBotaoVoltarMenuPrincipal() {
      if (document.querySelector('.btn-voltar-menu-principal')) return;
      const btn = document.createElement('button');
      btn.className = 'btn-voltar-menu-principal';
      btn.innerHTML = '<i class="fas fa-home"></i> Menu Principal';
      btn.addEventListener('click', navegarParaMenu);

      const secao = elementos.secaoListaEnsaios();
      if (secao) {
        secao.insertBefore(btn, secao.firstChild);
      }
    }

    function ativarAba(abaId) {
      estadoAtual.aba = abaId;
      elementos.tabs().forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === abaId);
      });
      elementos.tabContents().forEach(content => {
        content.classList.toggle('active', content.id === abaId);
      });
    }

    function carregarListaEnsaios(tipo) {
      if (!window.calculadora.db) {
        console.error('DB não encontrado');
        return;
      }
      const container = elementos.listaEnsaiosContent();
      const evt = new CustomEvent('listaEnsaiosLoaded', {
        detail: { container, tipo }
      });
      document.dispatchEvent(evt);
    }

    function carregarFormularioCalculadora(tipo, ensaio) {
      if (!['in-situ', 'real', 'max-min'].includes(tipo)) {
        console.error('Tipo inválido:', tipo);
        return;
      }
      const calc = elementos.calculadoraContent();
      if (calc) calc.innerHTML = '';

      const tplId = tipo === 'in-situ'
        ? 'template-densidade-in-situ'
        : `template-densidade-${tipo}`;
      const tpl = document.getElementById(tplId);
      if (!tpl) {
        console.error('Template não encontrado:', tipo);
        return;
      }
      const node = tpl.content.cloneNode(true);

      const formDiv = node.querySelector('.calculadora-container');
      if (formDiv && !formDiv.querySelector('.btn-voltar')) {
        const btn = document.createElement('button');
        btn.className = 'btn-voltar';
        btn.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar';
        btn.addEventListener('click', voltar);
        formDiv.insertBefore(btn, formDiv.firstChild);
      }

      if (calc) calc.appendChild(node);
      document.dispatchEvent(new CustomEvent('formLoaded', {
        detail: { form: calc.querySelector('.calculadora-container'), tipo, ensaio }
      }));
    }

    function configurarEventListeners() {
      document.getElementById('btn-densidade-in-situ')
        ?.addEventListener('click', () => navegarParaLista('in-situ'));
      document.getElementById('btn-densidade-real')
        ?.addEventListener('click', () => navegarParaLista('real'));
      document.getElementById('btn-densidade-max-min')
        ?.addEventListener('click', () => navegarParaLista('max-min'));

      elementos.tabs().forEach(tab => {
        tab.addEventListener('click', () => {
          ativarAba(tab.dataset.tab);
          if (tab.dataset.tab === 'lista-ensaios') {
            removerFiltrosDuplicados();
          }
        });
      });

      // Listener para “Novo Ensaio” e botões de voltar
      document.addEventListener('click', e => {
        if (e.target.matches('.btn-novo-ensaio')) {
          if (!estadoAtual.tipo) {
            console.warn(
              'Novo Ensaio cancelado: tipo de ensaio não definido. Voltando ao menu.'
            );
            navegarParaMenu();
          } else {
            navegarParaCalculadora(estadoAtual.tipo);
          }
          return;
        }
        if (e.target.matches('.btn-voltar') || e.target.matches('.btn-voltar-acoes')) {
          voltar();
        }
      });
    }

    function inicializar() {
      configurarEventListeners();
      navegarParaMenu();
    }

    inicializar();

    return {
      navegarParaMenu,
      navegarParaLista,
      navegarParaCalculadora,
      voltar,
      ativarAba,
      getEstadoAtual: () => ({ ...estadoAtual })
    };
  })();
});
