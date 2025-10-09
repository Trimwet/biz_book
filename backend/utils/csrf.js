const crypto = require('crypto');

/**
 * CSRF Protection Utilities
 */

// Generate a CSRF token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create a CSRF secret for each session
const createCSRFSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash a CSRF token with the secret
const hashCSRFToken = (token, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('hex');
};

// Verify a CSRF token
const verifyCSRFToken = (token, hashedToken, secret) => {
  const expectedHash = hashCSRFToken(token, secret);
  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'hex'),
    Buffer.from(hashedToken, 'hex')
  );
};

// CSRF middleware for Express
const csrfProtection = (req, res, next) => {
  // Skip CSRF for safe methods
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Get CSRF token from header
  const csrfToken = req.headers['x-csrf-token'];
  
  if (!csrfToken) {
    return res.status(403).json({
      error: 'CSRF token is required',
      code: 'MISSING_CSRF_TOKEN'
    });
  }

  // Get CSRF secret from session (you'll need to implement session storage)
  const csrfSecret = req.session?.csrfSecret;
  
  if (!csrfSecret) {
    return res.status(403).json({
      error: 'CSRF secret not found',
      code: 'MISSING_CSRF_SECRET'
    });
  }

  // Get hashed token from session
  const hashedToken = req.session?.csrfHashedToken;
  
  if (!hashedToken) {
    return res.status(403).json({
      error: 'CSRF hashed token not found',
      code: 'MISSING_CSRF_HASHED_TOKEN'
    });
  }

  // Verify the token
  const isValid = verifyCSRFToken(csrfToken, hashedToken, csrfSecret);
  
  if (!isValid) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'INVALID_CSRF_TOKEN'
    });
  }

  next();
};

// Generate and store CSRF tokens in session
const setupCSRF = (req, res, next) => {
  if (!req.session) {
    // You need to implement session middleware first
    return res.status(500).json({
      error: 'Session middleware not found',
      code: 'SESSION_NOT_FOUND'
    });
  }

  // Generate new tokens if not existing
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = createCSRFSecret();
  }
  
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
    req.session.csrfHashedToken = hashCSRFToken(req.session.csrfToken, req.session.csrfSecret);
  }

  // Add CSRF token to response headers for client-side use
  res.setHeader('X-CSRF-Token', req.session.csrfToken);
  
  next();
};

// CSRF token endpoint for forms
const getCSRFToken = (req, res) => {
  if (!req.session?.csrfToken) {
    return res.status(403).json({
      error: 'CSRF token not found',
      code: 'CSRF_TOKEN_NOT_FOUND'
    });
  }

  res.json({
    csrfToken: req.session.csrfToken,
    timestamp: Date.now()
  });
};

// Validate origin for CSRF protection
const validateOrigin = (req, res, next) => {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

  const origin = req.headers.origin;
  
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: 'Origin not allowed',
      code: 'INVALID_ORIGIN'
    });
  }

  next();
};

// SameSite cookie configuration
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Enable HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy (adjust based on your needs)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https:; " +
    "connect-src 'self' http://localhost:3001 https:; " +
    "frame-ancestors 'none';"
  );
  
  next();
};

module.exports = {
  generateCSRFToken,
  createCSRFSecret,
  hashCSRFToken,
  verifyCSRFToken,
  csrfProtection,
  setupCSRF,
  getCSRFToken,
  validateOrigin,
  getCookieOptions,
  securityHeaders
};