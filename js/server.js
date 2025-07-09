// server.js
require('dotenv').config();           // Load environment variables from .env
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer  = require('multer');
const path    = require('path');

const app = express();

// Environment variables
const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const DB_HOST    = process.env.DB_HOST;
const DB_USER    = process.env.DB_USER;
const DB_PASS    = process.env.DB_PASS;
const DB_NAME    = process.env.DB_NAME;

if (!JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET in environment');
  process.exit(1);
}
if (!DB_HOST || !DB_USER || !DB_PASS || !DB_NAME) {
  console.error('❌ Missing one or more DB_ env vars');
  process.exit(1);
}

// Create MariaDB pool
const db = mysql.createPool({
  host:            DB_HOST,
  user:            DB_USER,
  password:        DB_PASS,
  database:        DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit:      0,
});

// Configure uploads
const uploadDir = path.join(__dirname, 'uploads');
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/^image\/(jpeg|png)$/)) {
      return cb(new Error('Only JPG/PNG images allowed'));
    }
    cb(null, true);
  }
});

// Middleware
app.use(cors({
  origin: 'https://boofbrain.com',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadDir));

// Helper: sign JWT
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Auth middleware: verify JWT and update last_active
async function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    await db.execute(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?',
      [payload.id]
    );
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.sendStatus(401);
  }
}

// Routes
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
    const user = { id: result.insertId, username, email };
    const token = signToken(user);
    res.cookie('token', token, {
      httpOnly: true, sameSite: 'lax', maxAge: 7*24*60*60*1000
    });
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    console.error(err);
    res.sendStatus(500);
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user);
    res.cookie('token', token, {
      httpOnly: true, sameSite: 'lax', maxAge: 7*24*60*60*1000
    });
    res.json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.post('/api/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/online', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, username, last_active
         FROM users
        WHERE last_active >= NOW() - INTERVAL 5 MINUTE
        ORDER BY last_active DESC`
    );
    res.json({ online: rows });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Onboarding status
app.get('/api/onboard', authMiddleware, async (req, res) => {
  const [rows] = await db.execute(
    'SELECT onboarded FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json({ onboarded: rows[0].onboarded === 1 });
});

// Submit onboarding: display_name + profile_pic
app.post(
  '/api/onboard',
  authMiddleware,
  upload.single('profile_pic'),
  async (req, res) => {
    const { display_name } = req.body;
    if (!display_name || !req.file) {
      return res.status(400).json({ error: 'Both name and picture are required' });
    }
    const picPath = 'uploads/' + req.file.filename;
    try {
      await db.execute(
        'UPDATE users SET display_name = ?, profile_pic = ?, onboarded = 1 WHERE id = ?',
        [display_name, picPath, req.user.id]
      );
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  }
);

// Serve static frontend files (if needed)
// app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
