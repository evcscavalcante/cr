document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-sidebar');
  const menuButtons = document.querySelectorAll('.sidebar-btn');

  if (window.innerWidth < 768) {
    document.body.classList.add('sidebar-hidden');
  } else {
    document.body.classList.add('sidebar-visible');
  }

  toggleBtn?.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-hidden');
    document.body.classList.toggle('sidebar-visible');
  });

  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      menuButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});
