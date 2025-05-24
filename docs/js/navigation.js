// js/navigation.js
// Módulo de navegação para a Calculadora de Compacidade
// Implementa navegação consistente entre telas, botão voltar e limpa filtros duplicados

document.addEventListener('DOMContentLoaded', () => {
    // Namespace para navegação
    window.calculadora = window.calculadora || {};
    
    // Módulo de navegação
    window.calculadora.navegacao = (() => {
        const historico = [];
        let estadoAtual = { tela: 'menu', tipo: null, aba: null };
        
        const elementos = {
            menuPrincipal: () => document.querySelector('.menu-principal'),
            secaoListaEnsaios: () => document.querySelector('#secao-lista-ensaios'),
            calculadoraContent: () => document.querySelector('#calculadora'),
            listaEnsaiosContent: () => document.querySelector('#lista-ensaios'),
            tabs: () => document.querySelectorAll('.tab-btn'),
            tabContents: () => document.querySelectorAll('.tab-content')
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
            if (estadoAtual.tela !== 'menu') historico.push({ ...estadoAtual });
            estadoAtual = { tela: 'menu', tipo: null, aba: null };
            elementos.menuPrincipal()?.style.display = 'block';
            elementos.secaoListaEnsaios()?.style.display = 'none';
            elementos.calculadoraContent().innerHTML = '';
        }
        
        function navegarParaLista(tipo) {
            if (!['in-situ','real','max-min'].includes(tipo)) return console.error('Tipo inválido:', tipo);
            historico.push({ ...estadoAtual });
            estadoAtual = { tela: 'lista', tipo, aba: 'lista-ensaios' };
            
            elementos.menuPrincipal()?.style.display = 'none';
            elementos.secaoListaEnsaios()?.style.display = 'block';
            elementos.calculadoraContent().innerHTML = '';
            
            ativarAba('lista-ensaios');
            removerFiltrosDuplicados();
            carregarListaEnsaios(tipo);
            adicionarBotaoVoltarMenuPrincipal();
        }
        
        function navegarParaCalculadora(tipo, ensaio = null) {
            if (!['in-situ','real','max-min'].includes(tipo)) return console.error('Tipo inválido:', tipo);
            historico.push({ ...estadoAtual });
            estadoAtual = { tela: 'calculadora', tipo, aba: 'calculadora', ensaio };
            
            elementos.menuPrincipal()?.style.display = 'none';
            elementos.secaoListaEnsaios()?.style.display = 'block';
            
            ativarAba('calculadora');
            carregarFormularioCalculadora(tipo, ensaio);
            adicionarBotaoVoltarMenuPrincipal();
        }
        
        function voltar() {
            if (!historico.length) return navegarParaMenu();
            const ultimo = historico.pop();
            estadoAtual = { ...ultimo };
            
            if (estadoAtual.tela === 'menu') {
                elementos.menuPrincipal()?.style.display = 'block';
                elementos.secaoListaEnsaios()?.style.display = 'none';
                elementos.calculadoraContent().innerHTML = '';
            } else {
                elementos.menuPrincipal()?.style.display = 'none';
                elementos.secaoListaEnsaios()?.style.display = 'block';
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
            elementos.secaoListaEnsaios()?.insertBefore(btn, elementos.secaoListaEnsaios().firstChild);
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
            if (!window.calculadora.db) return console.error('DB não encontrado');
            const container = elementos.listaEnsaiosContent();
            const evt = new CustomEvent('listaEnsaiosLoaded', {
                detail: { container, tipo }
            });
            document.dispatchEvent(evt);
        }
        
        function carregarFormularioCalculadora(tipo, ensaio) {
            if (!['in-situ','real','max-min'].includes(tipo)) return console.error('Tipo inválido:', tipo);
            const calc = elementos.calculadoraContent();
            calc.innerHTML = '';
            const tpl = document.getElementById(`template-densidade-${tipo === 'in-situ'?'in-situ': tipo}`);
            if (!tpl) return console.error('Template não encontrado:', tipo);
            const node = tpl.content.cloneNode(true);
            // botão voltar dentro do formulário
            const formDiv = node.querySelector('.calculadora-container');
            if (formDiv && !formDiv.querySelector('.btn-voltar')) {
                const btn = document.createElement('button');
                btn.className = 'btn-voltar';
                btn.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar';
                btn.addEventListener('click', voltar);
                formDiv.insertBefore(btn, formDiv.firstChild);
            }
            calc.appendChild(node);
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
                    if (tab.dataset.tab === 'lista-ensaios') removerFiltrosDuplicados();
                });
            });
            
            document.addEventListener('click', e => {
                if (e.target.matches('.btn-novo-ensaio')) {
                    navegarParaCalculadora(estadoAtual.tipo);
                }
                if (e.target.matches('.btn-voltar, .btn-voltar-acoes')) {
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
