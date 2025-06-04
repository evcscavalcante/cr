document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const recoverForm = document.getElementById('recover-form');
  const message = document.getElementById('message');

  const send = (url, data) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      username: loginForm.username.value,
      password: loginForm.password.value
    };
    send('/api/login', data).then(res => {
      message.textContent = res.message;
      if (res.message === 'Login realizado') {
        localStorage.setItem('user', data.username);
        window.location.href = 'index.html';
      }
    });
  });

  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      username: registerForm.username.value,
      password: registerForm.password.value
    };
    send('/api/register', data).then(res => {
      message.textContent = res.message;
    });
  });

  recoverForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      username: recoverForm.username.value,
      password: recoverForm.password.value
    };
    send('/api/recover', data).then(res => {
      message.textContent = res.message;
    });
  });
});
