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

// List conversations (partners)
app.get('/api/conversations', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const query = `
      SELECT DISTINCT u.id, u.username
      FROM users u
      JOIN messages m ON u.id = m.sender_id OR u.id = m.recipient_id
      WHERE (m.sender_id = ? OR m.recipient_id = ?) AND u.id != ?
      ORDER BY u.username;
    `;
    const [rows] = await db.execute(query, [currentUserId, currentUserId, currentUserId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.sendStatus(500);
  }
});

// Get message thread with a specific user
app.get('/api/messages/thread/:otherId', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = Number(req.params.otherId);
    if (isNaN(otherUserId)) {
      return res.status(400).send('Invalid user ID.');
    }

    const query = `
      SELECT m.id, m.sender_id, m.recipient_id, m.content, m.created_at, m.is_read
      FROM messages m
      WHERE (m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?)
      ORDER BY m.created_at ASC;
    `;
    const [rows] = await db.execute(query, [currentUserId, otherUserId, otherUserId, currentUserId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching thread:', err);
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

// Update Profile
app.post('/api/profile', verifyToken, upload.single('profile_pic'), async (req, res) => {
  const { display_name } = req.body;
  const userId = req.user.id;
  let picPath = null;

  if (req.file) {
    picPath = `uploads/${req.file.filename}`;
  }

  if (!display_name && !picPath) {
    return res.status(400).json({ message: 'No profile information provided to update.' });
  }

  try {
    let oldProfilePic = null;
    if (picPath) { // If a new picture is uploaded, get the old one for potential deletion
        const [userRows] = await db.execute('SELECT profile_pic FROM users WHERE id = ?', [userId]);
        if (userRows.length > 0 && userRows[0].profile_pic) {
            oldProfilePic = userRows[0].profile_pic;
        }
    }

    // Construct query dynamically based on what's provided
    const fieldsToUpdate = [];
    const values = [];
    if (display_name) {
      fieldsToUpdate.push('display_name = ?');
      values.push(display_name);
    }
    if (picPath) {
      fieldsToUpdate.push('profile_pic = ?');
      values.push(picPath);
    }
    values.push(userId); // For the WHERE clause

    if (fieldsToUpdate.length === 0) {
        // This case should ideally be caught by the initial check, but as a safeguard:
        return res.status(400).json({ message: "No updatable fields provided." });
    }

    const sql = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    await db.execute(sql, values);

    // If a new profile picture was uploaded and an old one existed, delete the old one from the filesystem
    // This is a simple deletion, doesn't handle errors like file not found gracefully for brevity
    if (oldProfilePic && picPath && oldProfilePic !== picPath) {
        const fs = require('fs').promises;
        try {
            await fs.unlink(path.join(__dirname, oldProfilePic));
            console.log(`Old profile picture ${oldProfilePic} deleted.`);
        } catch (fsErr) {
            // Log error but don't fail the request, as profile update in DB was successful
            console.error(`Failed to delete old profile picture ${oldProfilePic}:`, fsErr);
        }
    }

    // Fetch the updated user information to send back
    const [updatedUserRows] = await db.execute(
      'SELECT id, username, display_name, profile_pic FROM users WHERE id = ?',
      [userId]
    );

    if (updatedUserRows.length === 0) {
        // Should not happen if update was successful, but good to check
        return res.status(404).json({ message: "User not found after update." });
    }

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUserRows[0] });
  } catch (err) {
    console.error('Error updating profile:', err);
    // If the uploaded file caused an error but wasn't processed, try to delete it.
    if (picPath && err.code !== 'ENOENT') { // Avoid trying to delete if fs.unlink caused the error
        const fs = require('fs').promises;
        fs.unlink(path.join(__dirname, picPath)).catch(fsErr => console.error(`Cleanup failed for ${picPath}:`, fsErr));
    }
    res.status(500).json({ message: 'Server error while updating profile.' });
  }
});


// Onboarding (This might be deprecated or changed if /api/profile handles all profile updates)
// For now, let's assume it's still used for a specific first-time setup.
// If it's fully replaced by /api/profile, this route could be removed or modified.
app.post('/api/onboard', verifyToken, upload.single('profile_pic'), async (req, res) => {
  const { display_name } = req.body;
  const picPath = req.file ? `uploads/${req.file.filename}` : null;
  // Original onboarding required both. We can keep this strict for "onboarding"
  // or relax it if /api/profile is the new standard.
  if (!display_name || !picPath) return res.status(400).send('Display name and profile picture are required for onboarding.');
  try {
    await db.execute(
      'UPDATE users SET display_name = ?, profile_pic = ?, onboarded = 1 WHERE id = ?', // Assuming an 'onboarded' flag
      [display_name, picPath, req.user.id]
    );
    // Fetch the updated user to potentially return, similar to /api/profile
     const [userRows] = await db.execute(
      'SELECT id, username, display_name, profile_pic FROM users WHERE id = ?',
      [req.user.id]
    );
    res.status(200).json({ message: 'Onboarding complete', user: userRows[0] });
  } catch (err) {
    console.error('Error during onboarding:', err);
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
