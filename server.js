const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'docs')));

const USERS_FILE = path.join(__dirname, 'users.json');
const DATA_FILE = path.join(__dirname, 'server-data.json');

function loadJSON(file, def) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch (e) {
    return def;
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Dados inválidos' });
  }
  const users = loadJSON(USERS_FILE, {});
  if (users[username]) {
    return res.status(409).json({ message: 'Usuário já existe' });
  }
  users[username] = { password: bcrypt.hashSync(password, 10) };
  saveJSON(USERS_FILE, users);
  res.json({ message: 'Registrado com sucesso' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadJSON(USERS_FILE, {});
  const user = users[username];
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Usuário ou senha inválidos' });
  }
  res.json({ message: 'Login realizado' });
});

app.post('/api/recover', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Dados inválidos' });
  }
  const users = loadJSON(USERS_FILE, {});
  if (!users[username]) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  users[username].password = bcrypt.hashSync(password, 10);
  saveJSON(USERS_FILE, users);
  res.json({ message: 'Senha redefinida' });
});

app.post('/api/data/sync', (req, res) => {
  const data = loadJSON(DATA_FILE, []);
  data.push({ timestamp: Date.now(), payload: req.body });
  saveJSON(DATA_FILE, data);
  res.json({ message: 'Dados sincronizados' });
});

app.get('/api/data', (req, res) => {
  const data = loadJSON(DATA_FILE, []);
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
