// js/side-menu.js
// Gerencia a navegação do menu lateral (Solos, Asfalto, Concreto)

document.addEventListener('DOMContentLoaded', () => {
  const btnSolos = document.getElementById('btn-menu-solos');
  const btnAsfalto = document.getElementById('btn-menu-asfalto');
  const btnConcreto = document.getElementById('btn-menu-concreto');
  const toggleBtn = document.getElementById('toggle-sidebar');

  if (window.innerWidth < 768) {
    document.body.classList.add('sidebar-hidden');
  } else {
    document.body.classList.add('sidebar-visible');
  }

  toggleBtn?.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-hidden');
    document.body.classList.toggle('sidebar-visible');
  });

  const menuPrincipal = document.querySelector('.menu-principal');
  const secaoLista = document.getElementById('secao-lista-ensaios');
  const secaoAsfalto = document.getElementById('placeholder-asfalto');
  const secaoConcreto = document.getElementById('placeholder-concreto');

  function exibirSecao(secao) {
    if (menuPrincipal) menuPrincipal.style.display = secao === menuPrincipal ? 'block' : 'none';
    if (secaoLista) secaoLista.style.display = secao === menuPrincipal ? secaoLista.style.display : 'none';
    if (secaoAsfalto) secaoAsfalto.style.display = secao === secaoAsfalto ? 'block' : 'none';
    if (secaoConcreto) secaoConcreto.style.display = secao === secaoConcreto ? 'block' : 'none';

    [btnSolos, btnAsfalto, btnConcreto].forEach(btn => btn?.classList.remove('active'));
    if (secao === menuPrincipal) btnSolos?.classList.add('active');
    if (secao === secaoAsfalto) btnAsfalto?.classList.add('active');
    if (secao === secaoConcreto) btnConcreto?.classList.add('active');
  }

  btnSolos?.addEventListener('click', () => exibirSecao(menuPrincipal));
  btnAsfalto?.addEventListener('click', () => exibirSecao(secaoAsfalto));
  btnConcreto?.addEventListener('click', () => exibirSecao(secaoConcreto));

  // exibe menu principal por padrão
  exibirSecao(menuPrincipal);
});
