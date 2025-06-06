 document.addEventListener('DOMContentLoaded', () => {
  const loginContainer = document.getElementById('login-container');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const recoverForm = document.getElementById('recover-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const tabRecover = document.getElementById('tab-recover');
  const forgotLink = document.getElementById('forgot-password');

   const header = document.querySelector('header');
   const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  const sidebar = document.querySelector('.sidebar');
  const logoutBtn = document.getElementById('logout-btn');

  function activateTab(tab) {
    [tabLogin, tabRegister, tabRecover].forEach(t => t.classList.remove('active'));
    if (tab) tab.classList.add('active');
  }

  function showForm(form) {
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    recoverForm.style.display = 'none';
    form.style.display = 'block';
    if (form === loginForm) activateTab(tabLogin);
    if (form === registerForm) activateTab(tabRegister);
    if (form === recoverForm) activateTab(tabRecover);
  }

  tabLogin.addEventListener('click', e => {
    e.preventDefault();
    showForm(loginForm);
  });

  tabRegister.addEventListener('click', e => {
    e.preventDefault();
    showForm(registerForm);
  });

  tabRecover.addEventListener('click', e => {
    e.preventDefault();
    showForm(recoverForm);
  });

  if (forgotLink) {
    forgotLink.addEventListener('click', e => {
      e.preventDefault();
      showForm(recoverForm);
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

  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    registrar();
  });

  function logar() {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(u, p)
      .catch(() => alert('Usuário ou senha inválidos'));
  }

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    logar();
  });

  function recuperar() {
    const u = document.getElementById('recover-username').value.trim();
    if (!u) return alert('Informe o e-mail');
    auth.sendPasswordResetEmail(u)
      .then(() => alert('Email de recuperação enviado'))
      .catch(err => alert('Erro: ' + err.message));
  }

  recoverForm.addEventListener('submit', e => {
    e.preventDefault();
    recuperar();
  });

  logoutBtn.addEventListener('click', () => {
    auth.signOut();
  });

  header.style.display = 'none';
  sidebar.style.display = 'none';
  main.style.display = 'none';
  footer.style.display = 'none';
  loginContainer.style.display = 'flex';
  showForm(loginForm);

  auth.onAuthStateChanged(user => {
    if (user) {
      window.location.href = 'index.html';
    } else {
      header.style.display = 'none';
      sidebar.style.display = 'none';
      main.style.display = 'none';
      footer.style.display = 'none';
      loginContainer.style.display = 'flex';
      showForm(loginForm);
    }
  });
 });
