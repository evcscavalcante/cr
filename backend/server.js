require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login. Tente novamente mais tarde.'
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
}

function generateTokens(user) {
  const accessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '30m' });
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  db.collection('refresh_tokens').add({
    token: refreshToken,
    userId: user.uid,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  return { accessToken, refreshToken };
}

function auditLog(userId, action, resource, details) {
  return db.collection('audit_logs').add({
    userId,
    action,
    resource,
    details,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

// Endpoints de autenticação
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    // Em ambiente real, validar senha com firebase auth custom
    const tokens = generateTokens({ uid: userRecord.uid, email });
    auditLog(userRecord.uid, 'login', 'auth', {});
    res.json({ ...tokens, user: { uid: userRecord.uid, email } });
  } catch (err) {
    res.status(401).json({ message: 'Credenciais inválidas' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token requerido' });
  try {
    const doc = await db.collection('refresh_tokens').where('token', '==', refreshToken).get();
    if (doc.empty) return res.status(403).json({ message: 'Refresh token inválido' });
    const tokenDoc = doc.docs[0];
    const userId = tokenDoc.data().userId;
    const newTokens = generateTokens({ uid: userId });
    await tokenDoc.ref.delete();
    res.json({ accessToken: newTokens.accessToken });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao renovar token' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  auditLog(req.user.uid, 'logout', 'auth', {});
  res.json({ success: true });
});

// CRUD básico
app.get('/api/data/:collection/:id', authenticateToken, async (req, res) => {
  const { collection, id } = req.params;
  try {
    const doc = await db.collection(collection).doc(id).get();
    if (!doc.exists) return res.status(404).json({ message: 'Não encontrado' });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar dado' });
  }
});

app.post('/api/data/:collection', authenticateToken, async (req, res) => {
  const { collection } = req.params;
  const data = req.body;
  try {
    await db.collection(collection).doc(String(data.registro)).set(data);
    auditLog(req.user.uid, 'create', collection, { registro: data.registro });
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar dado' });
  }
});

app.put('/api/data/:collection/:id', authenticateToken, async (req, res) => {
  const { collection, id } = req.params;
  const data = req.body;
  try {
    await db.collection(collection).doc(id).update(data);
    auditLog(req.user.uid, 'update', collection, { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar dado' });
  }
});

app.delete('/api/data/:collection/:id', authenticateToken, async (req, res) => {
  const { collection, id } = req.params;
  try {
    await db.collection(collection).doc(id).delete();
    auditLog(req.user.uid, 'delete', collection, { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir dado' });
  }
});

// logs e consentimento
app.post('/api/audit/logs', authenticateToken, async (req, res) => {
  const logs = req.body.logs || [];
  const batch = db.batch();
  logs.forEach(log => {
    const ref = db.collection('audit_logs').doc();
    batch.set(ref, { ...log, serverTime: admin.firestore.FieldValue.serverTimestamp() });
  });
  await batch.commit();
  res.json({ success: true });
});

app.post('/api/consent/register', authenticateToken, async (req, res) => {
  const { type, value, metadata } = req.body;
  await db.collection('user_consents').add({
    userId: req.user.uid,
    type,
    value,
    metadata,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
