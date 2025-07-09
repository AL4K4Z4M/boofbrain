// server.js
require('dotenv').config();
const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const mysql        = require('mysql2/promise');
const bcrypt       = require('bcrypt');
const jwt          = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const multer       = require('multer');
const path         = require('path');

const app        = express();
const httpServer = http.createServer(app);
const io         = new Server(httpServer, {
  cors: { origin: true, credentials: true }
});

const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
if (!JWT_SECRET || !DB_HOST || !DB_USER || !DB_PASS || !DB_NAME) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// MySQL pool
const db = mysql.createPool({
  host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME,
  waitForConnections: true, connectionLimit: 10, queueLimit: 0,
});

// Static / uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// Middleware
app.use(cors({ origin: (o, cb) => cb(null, o), credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Multer for profile pics
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename:    (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// JWT guard
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.sendStatus(401);
    req.user = payload;
    next();
  });
}

// Register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).send('Missing fields');
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hash]
    );
    const token = jwt.sign({ id: result.insertId, username }, JWT_SECRET, { expiresIn: '7d' });
    res
      .cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7*24*60*60*1000 })
      .status(201)
      .json({ id: result.insertId, username });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).send('Username or email taken');
    console.error(err);
    res.sendStatus(500);
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing fields');
  try {
    const [rows] = await db.execute(
      'SELECT id, username, password_hash FROM users WHERE username = ? AND is_active = 1',
      [username]
    );
    if (!rows.length) return res.status(401).send('Invalid credentials');
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).send('Invalid credentials');
    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
    await db.execute('UPDATE users SET last_active = NOW() WHERE id = ?', [user.id]);
    res
      .cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7*24*60*60*1000 })
      .json({ id: user.id, username });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Logout
app.post('/api/logout', (_req, res) => {
  res.clearCookie('token').sendStatus(204);
});

// Who am I
app.get('/api/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, username, display_name, profile_pic FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.sendStatus(404);
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Onboarding
app.post('/api/onboard', verifyToken, upload.single('profile_pic'), async (req, res) => {
  const { display_name } = req.body;
  const picPath = req.file ? `uploads/${req.file.filename}` : null;
  if (!display_name || !picPath) return res.status(400).send('Name and picture required');
  try {
    await db.execute(
      'UPDATE users SET display_name = ?, profile_pic = ? WHERE id = ?',
      [display_name, picPath, req.user.id]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Stats
app.get('/api/stats', async (_req, res) => {
  try {
    const [[{ total }]]  = await db.execute('SELECT COUNT(*) AS total FROM users');
    const [[{ online }]] = await db.execute(
      'SELECT COUNT(*) AS online FROM users WHERE last_active > (NOW() - INTERVAL 5 MINUTE)'
    );
    res.json({ total, online });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// List active users
app.get('/api/users', verifyToken, async (_req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, username FROM users WHERE is_active = 1 ORDER BY username'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Send message
app.post('/api/messages', verifyToken, async (req, res) => {
  const { recipientId, content } = req.body;
  if (!recipientId || !content) return res.status(400).send('Missing fields');
  try {
    await db.execute(
      'INSERT INTO messages (sender_id, recipient_id, content) VALUES (?, ?, ?)',
      [req.user.id, recipientId, content]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Inbox list
app.get('/api/messages/inbox', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT m.id, m.sender_id, u.username AS sender, m.content, m.is_read, m.created_at
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE recipient_id = ?
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Mark read
app.post('/api/messages/:id/read', verifyToken, async (req, res) => {
  const msgId = Number(req.params.id);
  try {
    await db.execute(
      'UPDATE messages SET is_read = 1 WHERE id = ? AND recipient_id = ?',
      [msgId, req.user.id]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Live chat
const chatHistory = [];
io.on('connection', socket => {
  socket.emit('history', chatHistory.slice(-50));
  socket.on('message', msg => {
    const author = String(msg.author).slice(0, 50);
    const text   = String(msg.text).slice(0, 500);
    const m = { author, text, ts: Date.now() };
    chatHistory.push(m);
    io.emit('message', m);
  });
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
