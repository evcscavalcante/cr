document.addEventListener('DOMContentLoaded', () => {
  const userName = localStorage.getItem('userName') || 'Usuário';
  const userNameEl = document.getElementById('user-name');
  if (userNameEl) userNameEl.textContent = userName;

  document.querySelectorAll('.menu-item').forEach(link => {
    link.addEventListener('click', async e => {
      e.preventDefault();
      const { lista, calculadora, ensaio } = link.dataset;
      const content = document.getElementById('content');
      if (!content) return;
      content.innerHTML = '<p>Carregando...</p>';
      let url = calculadora || lista;
      if (url) {
        try {
          const resp = await fetch(url);
          const html = await resp.text();
          content.innerHTML = html;
        } catch (err) {
          content.textContent = 'Erro ao carregar conteúdo.';
        }
      } else if (ensaio === 'relatorios') {
        content.innerHTML = '<p>Seção de relatórios em desenvolvimento.</p>';
      }
    });
  });

  document.getElementById('logout-link')?.addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem('userName');
    location.reload();
  });
});
