document.addEventListener('DOMContentLoaded', () => {
  const menuPrincipal = document.querySelector('.menu-principal');
  const secaoLista = document.getElementById('secao-lista-ensaios');

  const btnSolo = document.getElementById('btn-menu-solo');
  const btnAsfalto = document.getElementById('btn-menu-asfalto');
  const btnConcreto = document.getElementById('btn-menu-concreto');

  btnSolo?.addEventListener('click', () => {
    window.calculadora?.navegacao?.navegarParaMenu?.();
    if (menuPrincipal) menuPrincipal.style.display = 'block';
  });

  btnAsfalto?.addEventListener('click', () => {
    if (menuPrincipal) menuPrincipal.style.display = 'none';
    if (secaoLista) secaoLista.style.display = 'none';
    alert('Funcionalidade de Asfalto ainda não implementada');
  });

  btnConcreto?.addEventListener('click', () => {
    if (menuPrincipal) menuPrincipal.style.display = 'none';
    if (secaoLista) secaoLista.style.display = 'none';
    alert('Funcionalidade de Concreto ainda não implementada');
  });
});
