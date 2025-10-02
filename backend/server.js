require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3001;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'boofbrain',
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT
    ? Number(process.env.DB_CONNECTION_LIMIT)
    : 10,
  queueLimit: 0
});

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

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
