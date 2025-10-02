const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3001;

const resolveNumericEnv = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: resolveNumericEnv(process.env.DB_PORT, 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'boofbrain',
  waitForConnections: true,
  connectionLimit: resolveNumericEnv(
    process.env.DB_POOL ?? process.env.DB_CONNECTION_LIMIT,
    10
  ),
  queueLimit: 0
});

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.warn(
    'Warning: JWT_SECRET is not defined. Login functionality will not work without it.'
  );
}

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const isValidEmail = (value) =>
  typeof value === 'string' &&
  value.length <= 255 &&
  /.+@.+\..+/.test(value);

const isValidUsername = (value) =>
  typeof value === 'string' &&
  value.length >= 3 &&
  value.length <= 50 &&
  /^[A-Za-z0-9_]+$/.test(value);

const parseBooleanFlag = (value) => {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    return ['1', 'true', 'on', 'yes'].includes(value.toLowerCase());
  }

  return false;
};

app.post('/api/register', async (req, res) => {
  const {
    email,
    username,
    password,
    ageVerified,
    termsAgreed
  } = req.body || {};

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      error: 'Password must be a string with at least 8 characters.'
    });
  }

  const hasEmail = typeof email === 'string' && email.trim() !== '';
  const hasUsername = typeof username === 'string' && username.trim() !== '';

  if (!hasEmail && !hasUsername) {
    return res.status(400).json({
      error: 'Either an email or username must be provided.'
    });
  }

  if (hasEmail && !isValidEmail(email.trim())) {
    return res.status(400).json({
      error: 'Email format is invalid.'
    });
  }

  if (hasUsername && !isValidUsername(username.trim())) {
    return res.status(400).json({
      error:
        'Username must be 3-50 characters and contain only letters, numbers, or underscores.'
    });
  }

  const normalizedEmail = hasEmail ? email.trim().toLowerCase() : null;
  const normalizedUsername = hasUsername ? username.trim() : null;
  const passwordHash = await bcrypt.hash(password, 12);

  const ageFlag = parseBooleanFlag(ageVerified) ? 1 : 0;
  const termsFlag = parseBooleanFlag(termsAgreed) ? 1 : 0;
  const now = new Date();

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO users (
        email,
        username,
        password_hash,
        age_verified,
        age_verified_at,
        terms_agreed,
        terms_agreed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const insertValues = [
      normalizedEmail,
      normalizedUsername,
      passwordHash,
      ageFlag,
      ageFlag ? now : null,
      termsFlag,
      termsFlag ? now : null
    ];

    const [result] = await connection.execute(insertQuery, insertValues);

    await connection.commit();

    res.status(201).json({
      id: result.insertId,
      email: normalizedEmail,
      username: normalizedUsername
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    if (error && error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        error: 'Email or username already exists.'
      });
      return;
    }

    console.error('Registration error:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.post('/api/login', async (req, res) => {
  const { email, username, password } = req.body || {};

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      error: 'Password is required.'
    });
  }

  const hasEmail = typeof email === 'string' && email.trim() !== '';
  const hasUsername = typeof username === 'string' && username.trim() !== '';

  if (!hasEmail && !hasUsername) {
    return res.status(400).json({
      error: 'Either an email or username must be provided.'
    });
  }

  if (!jwtSecret) {
    return res.status(500).json({
      error: 'Authentication is not configured.'
    });
  }

  const normalizedEmail = hasEmail ? email.trim().toLowerCase() : null;
  const normalizedUsername = hasUsername ? username.trim() : null;

  const identifierField = hasEmail ? 'email' : 'username';
  const identifierValue = hasEmail ? normalizedEmail : normalizedUsername;

  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `SELECT id, email, username, password_hash, role, status FROM users WHERE ${identifierField} = ? LIMIT 1`,
      [identifierValue]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = rows[0];

    if (user.status === 'banned') {
      return res.status(403).json({
        error: 'Account is banned.'
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash || '');

    if (!passwordMatches) {
      await connection.execute(
        'UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ?',
        [user.id]
      );

      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const now = new Date();

    await connection.execute(
      'UPDATE users SET login_count = login_count + 1, failed_attempts = 0, last_login_at = ? WHERE id = ?',
      [now, user.id]
    );

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
