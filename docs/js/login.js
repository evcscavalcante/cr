 document.addEventListener('DOMContentLoaded', () => {
   const loginContainer = document.getElementById('login-container');
   const loginForm = document.getElementById('login-form');
   const registerForm = document.getElementById('register-form');
   const recoverForm = document.getElementById('recover-form');

   const loginTab = document.getElementById('tab-login');
   const registerTab = document.getElementById('tab-register');
   const recoverTab = document.getElementById('tab-recover');

   const header = document.querySelector('header');
   const main = document.querySelector('main');
   const footer = document.querySelector('footer');
   const sidebar = document.querySelector('.sidebar');
   const logoutBtn = document.getElementById('logout-btn');

   function showForm(form) {
     loginForm.classList.remove('active');
     registerForm.classList.remove('active');
     recoverForm.classList.remove('active');
     form.classList.add('active');

     loginTab.classList.remove('active');
     registerTab.classList.remove('active');
     recoverTab.classList.remove('active');
     if (form === loginForm) loginTab.classList.add('active');
     if (form === registerForm) registerTab.classList.add('active');
     if (form === recoverForm) recoverTab.classList.add('active');
   }

   loginTab.addEventListener('click', e => {
     e.preventDefault();
     showForm(loginForm);
   });

   registerTab.addEventListener('click', e => {
     e.preventDefault();
     showForm(registerForm);
   });

   recoverTab.addEventListener('click', e => {
     e.preventDefault();
     showForm(recoverForm);
   });

   document.getElementById('show-recover').addEventListener('click', e => {
     e.preventDefault();
     showForm(recoverForm);
   });

  document.querySelectorAll('.back-to-login').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    showForm(loginForm);
  }));

  const offlineLink = document.getElementById('offline-link');
  if (offlineLink) {
    offlineLink.addEventListener('click', e => {
      e.preventDefault();
      header.style.display = '';
      sidebar.style.display = '';
      main.style.display = '';
      footer.style.display = '';
      loginContainer.style.display = 'none';
    });
  }

   const auth = window.firebaseAuth;

   function registrar() {
     const u = document.getElementById('register-username').value.trim();
     const p = document.getElementById('register-password').value;
     if (!u || !p) return alert('Preencha todos os campos');
     auth.createUserWithEmailAndPassword(u, p)
       .then(() => {
         alert('Conta criada com sucesso');
         showForm(loginForm);
       })
       .catch(err => alert('Erro ao registrar: ' + err.message));
   }

   document.getElementById('register-btn').addEventListener('click', registrar);
   registerForm.addEventListener('keydown', e => {
     if (e.key === 'Enter') {
       e.preventDefault();
       registrar();
     }
   });

   function logar() {
     const u = document.getElementById('login-username').value.trim();
     const p = document.getElementById('login-password').value;
     auth.signInWithEmailAndPassword(u, p)
       .catch(() => alert('Usuário ou senha inválidos'));
   }

   document.getElementById('login-btn').addEventListener('click', logar);
   loginForm.addEventListener('keydown', e => {
     if (e.key === 'Enter') {
       e.preventDefault();
       logar();
     }
   });

   function recuperar() {
     const u = document.getElementById('recover-username').value.trim();
     if (!u) return alert('Informe o e-mail');
     auth.sendPasswordResetEmail(u)
       .then(() => alert('Email de recuperação enviado'))
       .catch(err => alert('Erro: ' + err.message));
   }

   document.getElementById('recover-btn').addEventListener('click', recuperar);
   recoverForm.addEventListener('keydown', e => {
     if (e.key === 'Enter') {
       e.preventDefault();
       recuperar();
     }
   });

  logoutBtn.addEventListener('click', () => {
    auth.signOut();
  });

  header.style.display = 'none';
  sidebar.style.display = 'none';
  main.style.display = 'none';
  footer.style.display = 'none';
  loginContainer.style.display = 'none';
  showForm(loginForm);

  auth.onAuthStateChanged(user => {
    if (user) {
      header.style.display = '';
      sidebar.style.display = '';
      main.style.display = '';
      footer.style.display = '';
      loginContainer.style.display = 'none';
      const nameEl = document.getElementById('current-user-name');
      if (nameEl) nameEl.textContent = user.email || user.displayName || 'Usuário';
    } else {
      header.style.display = 'none';
      sidebar.style.display = 'none';
      main.style.display = 'none';
      footer.style.display = 'none';
      loginContainer.style.display = 'flex';
      showForm(loginForm);
      const nameEl = document.getElementById('current-user-name');
      if (nameEl) nameEl.textContent = '';
    }
  });
 });
