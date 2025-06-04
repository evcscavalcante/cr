 document.addEventListener('DOMContentLoaded', () => {
   const loginContainer = document.getElementById('login-container');
   const loginForm = document.getElementById('login-form');
   const registerForm = document.getElementById('register-form');
   const recoverForm = document.getElementById('recover-form');

   const header = document.querySelector('header');
   const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  const sidebar = document.querySelector('.sidebar');
  const logoutBtn = document.getElementById('logout-btn');

   function showForm(form) {
     loginForm.style.display = 'none';
     registerForm.style.display = 'none';
     recoverForm.style.display = 'none';
     form.style.display = 'block';
   }

   document.getElementById('show-register').addEventListener('click', e => {
     e.preventDefault();
     showForm(registerForm);
   });
   document.getElementById('show-recover').addEventListener('click', e => {
     e.preventDefault();
     showForm(recoverForm);
   });
   document.querySelectorAll('.back-to-login').forEach(el => el.addEventListener('click', e => {
     e.preventDefault();
     showForm(loginForm);
   }));

   function getUsers() {
     try { return JSON.parse(localStorage.getItem('users')) || {}; } catch { return {}; }
   }
   function saveUsers(users) {
     localStorage.setItem('users', JSON.stringify(users));
   }

   document.getElementById('register-btn').addEventListener('click', () => {
     const u = document.getElementById('register-username').value.trim();
     const p = document.getElementById('register-password').value;
     if (!u || !p) return alert('Preencha todos os campos');
     const users = getUsers();
     if (users[u]) return alert('Usuário já existe');
     users[u] = { password: btoa(p) };
     saveUsers(users);
     alert('Conta criada com sucesso');
     showForm(loginForm);
   });

   document.getElementById('login-btn').addEventListener('click', () => {
     const u = document.getElementById('login-username').value.trim();
     const p = document.getElementById('login-password').value;
     const users = getUsers();
    if (users[u] && users[u].password === btoa(p)) {
      loginContainer.style.display = 'none';
      header.style.display = 'block';
      sidebar.style.display = 'block';
      main.style.display = 'block';
      footer.style.display = 'block';
     } else {
       alert('Usuário ou senha inválidos');
     }
   });

  document.getElementById('recover-btn').addEventListener('click', () => {
    const u = document.getElementById('recover-username').value.trim();
    const newP = document.getElementById('recover-password').value;
     const users = getUsers();
     if (!users[u]) return alert('Usuário não encontrado');
     users[u].password = btoa(newP);
     saveUsers(users);
    alert('Senha atualizada');
    showForm(loginForm);
  });

  logoutBtn.addEventListener('click', () => {
    header.style.display = 'none';
    sidebar.style.display = 'none';
    main.style.display = 'none';
    footer.style.display = 'none';
    loginContainer.style.display = 'flex';
    showForm(loginForm);
  });

  header.style.display = 'none';
  sidebar.style.display = 'none';
  main.style.display = 'none';
  footer.style.display = 'none';
   loginContainer.style.display = 'flex';
   showForm(loginForm);
 });
