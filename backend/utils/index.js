const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Database connection pool — tuned for production concurrency
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Keep at most 20 open connections (tune with DB_POOL_MAX env var)
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  // Release idle connections after 30s
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  // Fail fast if no connection available within 5s
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT) || 5000,
  // Kill queries running longer than 30s (prevents runaway queries)
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
});

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required', code: 'MISSING_TOKEN' });
  }

  try {
    const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid access token', code: 'INVALID_TOKEN' });
  }
};

module.exports = { pool, authenticateToken };
