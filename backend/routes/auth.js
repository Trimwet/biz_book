'use strict';

const bcrypt = require('bcrypt');
const validator = require('validator');
const xss = require('xss');
const { pool } = require('../utils');
const {
  generateAccessToken, generateRefreshToken, hashRefreshToken,
  storeRefreshToken, refreshUserSession, invalidateUserTokens,
  validatePasswordSecurity, logSecurityEvent,
} = require('../utils/auth');

const validateEmail = (e) => validator.isEmail(e) && e.length <= 254;
const sanitize = (v) => (typeof v === 'string' ? xss(v.trim()) : v);
const validatePhone = (p) => /^(\+234|234|0)?[789][01]\d{8}$/.test(String(p).replace(/\s+/g, ''));

async function authRoutes(fastify) {
  // ── Vendor signup ──────────────────────────────────────────────────────────
  fastify.post('/signup/vendor', async (request, reply) => {
    try {
      const { businessName, email, password, category, location, phone } = request.body || {};
      if (!businessName || !email || !password || !category || !location || !phone)
        return reply.code(400).send({ error: 'All fields are required', code: 'MISSING_REQUIRED_FIELDS' });
      if (!validateEmail(email))
        return reply.code(400).send({ error: 'Please provide a valid email address', code: 'INVALID_EMAIL_FORMAT' });

      const pwCheck = validatePasswordSecurity(password);
      if (!pwCheck.isValid)
        return reply.code(400).send({ error: 'Password does not meet security requirements', code: 'WEAK_PASSWORD', details: pwCheck.errors });
      if (!validatePhone(phone))
        return reply.code(400).send({ error: 'Please provide a valid Nigerian phone number', code: 'INVALID_PHONE_NUMBER' });

      const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (userCheck.rows.length > 0)
        return reply.code(409).send({ error: 'An account with this email already exists', code: 'EMAIL_ALREADY_EXISTS' });

      const hashedPassword = await bcrypt.hash(password, 12);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const newUser = await client.query(
          'INSERT INTO users (email, password_hash, user_type, created_at) VALUES ($1,$2,$3,NOW()) RETURNING id, email, user_type, created_at',
          [email.toLowerCase(), hashedPassword, 'vendor']
        );
        const newVendor = await client.query(
          'INSERT INTO vendors (business_name, category, location, phone, user_id, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *',
          [sanitize(businessName), sanitize(category), sanitize(location), sanitize(phone), newUser.rows[0].id]
        );
        await client.query('COMMIT');

        const accessToken = generateAccessToken({ userId: newUser.rows[0].id, email: email.toLowerCase(), userType: 'vendor' });
        const refreshToken = generateRefreshToken({ userId: newUser.rows[0].id, email: email.toLowerCase(), userType: 'vendor' });
        await storeRefreshToken(newUser.rows[0].id, refreshToken, hashRefreshToken(refreshToken));
        await logSecurityEvent('USER_REGISTERED', { email: email.toLowerCase(), userType: 'vendor', ip: request.ip, userAgent: request.headers['user-agent'] }, newUser.rows[0].id);

        return reply.code(201).send({ message: 'Vendor account created successfully!', user: newUser.rows[0], vendor: newVendor.rows[0], accessToken, refreshToken });
      } catch (e) { await client.query('ROLLBACK'); throw e; }
      finally { client.release(); }
    } catch (err) {
      if (err.code === '23505') return reply.code(409).send({ error: 'An account with this email already exists', code: 'EMAIL_ALREADY_EXISTS' });
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to create account. Please try again later.', code: 'REGISTRATION_FAILED' });
    }
  });

  // ── Shopper signup ─────────────────────────────────────────────────────────
  fastify.post('/signup/shopper', async (request, reply) => {
    try {
      const { fullName, email, password, location } = request.body || {};
      if (!fullName || !email || !password)
        return reply.code(400).send({ error: 'Full name, email, and password are required', code: 'MISSING_REQUIRED_FIELDS' });
      if (!validateEmail(email))
        return reply.code(400).send({ error: 'Please provide a valid email address', code: 'INVALID_EMAIL_FORMAT' });

      const pwCheck = validatePasswordSecurity(password);
      if (!pwCheck.isValid)
        return reply.code(400).send({ error: 'Password does not meet security requirements', code: 'WEAK_PASSWORD', details: pwCheck.errors });

      const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (userCheck.rows.length > 0)
        return reply.code(409).send({ error: 'An account with this email already exists', code: 'EMAIL_ALREADY_EXISTS' });

      const hashedPassword = await bcrypt.hash(password, 12);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const newUser = await client.query(
          'INSERT INTO users (email, password_hash, user_type, created_at) VALUES ($1,$2,$3,NOW()) RETURNING id, email, user_type, created_at',
          [email.toLowerCase(), hashedPassword, 'shopper']
        );
        const newShopper = await client.query(
          'INSERT INTO shoppers (user_id, full_name, address, phone_number, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *',
          [newUser.rows[0].id, sanitize(fullName), sanitize(location || ''), '']
        );
        await client.query('COMMIT');

        const accessToken = generateAccessToken({ userId: newUser.rows[0].id, email: email.toLowerCase(), userType: 'shopper' });
        const refreshToken = generateRefreshToken({ userId: newUser.rows[0].id, email: email.toLowerCase(), userType: 'shopper' });
        await storeRefreshToken(newUser.rows[0].id, refreshToken, hashRefreshToken(refreshToken));
        await logSecurityEvent('USER_REGISTERED', { email: email.toLowerCase(), userType: 'shopper', ip: request.ip, userAgent: request.headers['user-agent'] }, newUser.rows[0].id);

        return reply.code(201).send({ message: 'Shopper account created successfully!', user: newUser.rows[0], shopper: newShopper.rows[0], accessToken, refreshToken });
      } catch (e) { await client.query('ROLLBACK'); throw e; }
      finally { client.release(); }
    } catch (err) {
      if (err.code === '23505') return reply.code(409).send({ error: 'An account with this email already exists', code: 'EMAIL_ALREADY_EXISTS' });
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to create account. Please try again later.', code: 'REGISTRATION_FAILED' });
    }
  });

  // ── Login ──────────────────────────────────────────────────────────────────
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body || {};
    try {
      const userResult = await pool.query(`
        SELECT u.*, v.business_name, v.business_description, v.location, v.phone as vendor_phone, v.website
        FROM users u LEFT JOIN vendors v ON u.id = v.user_id WHERE u.email = $1
      `, [email.toLowerCase()]);

      if (userResult.rows.length === 0) {
        await logSecurityEvent('LOGIN_FAILED', { email: email.toLowerCase(), reason: 'USER_NOT_FOUND', ip: request.ip, userAgent: request.headers['user-agent'] });
        return reply.code(401).send({ error: 'Invalid email or password' });
      }

      const user = userResult.rows[0];
      if (!await bcrypt.compare(password, user.password_hash)) {
        await logSecurityEvent('LOGIN_FAILED', { email: email.toLowerCase(), reason: 'INVALID_PASSWORD', ip: request.ip, userAgent: request.headers['user-agent'] });
        return reply.code(401).send({ error: 'Invalid email or password' });
      }

      const accessToken = generateAccessToken({ userId: user.id, email: user.email.toLowerCase(), userType: user.user_type });
      const refreshToken = generateRefreshToken({ userId: user.id, email: user.email.toLowerCase(), userType: user.user_type });
      await storeRefreshToken(user.id, refreshToken, hashRefreshToken(refreshToken));

      const responseUser = { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, user_type: user.user_type, created_at: user.created_at };
      if (user.user_type === 'vendor' && user.business_name) {
        responseUser.vendor_profile = { business_name: user.business_name, business_description: user.business_description, location: user.location, phone: user.vendor_phone, website: user.website };
      } else if (user.user_type === 'shopper') {
        const sp = await pool.query('SELECT full_name, address, phone_number FROM shoppers WHERE user_id = $1', [user.id]);
        if (sp.rows.length > 0) responseUser.shopper_profile = sp.rows[0];
      }

      await logSecurityEvent('LOGIN_SUCCESS', { email: email.toLowerCase(), userType: user.user_type, ip: request.ip, userAgent: request.headers['user-agent'] }, user.id);
      return reply.send({ message: 'Login successful!', user: responseUser, accessToken, refreshToken });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // ── Get current user ───────────────────────────────────────────────────────
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const result = await pool.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.user_type, u.created_at,
               v.business_name, v.business_description, v.location, v.phone as vendor_phone, v.website
        FROM users u LEFT JOIN vendors v ON u.id = v.user_id WHERE u.id = $1
      `, [request.user.userId]);
      if (result.rows.length === 0) return reply.code(404).send({ error: 'User not found' });

      const user = result.rows[0];
      const responseUser = { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, user_type: user.user_type, created_at: user.created_at };
      if (user.user_type === 'vendor' && user.business_name) {
        responseUser.vendor_profile = { business_name: user.business_name, business_description: user.business_description, location: user.location, phone: user.vendor_phone, website: user.website };
      } else if (user.user_type === 'shopper') {
        const sp = await pool.query('SELECT full_name, address, phone_number FROM shoppers WHERE user_id = $1', [request.user.userId]);
        if (sp.rows.length > 0) responseUser.shopper_profile = sp.rows[0];
      }
      return reply.send(responseUser);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(401).send({ error: 'Invalid token' });
    }
  });

  // ── Update profile ─────────────────────────────────────────────────────────
  fastify.put('/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { email, first_name, last_name } = request.body || {};
      if (!email) return reply.code(400).send({ error: 'Email is required' });

      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), request.user.userId]);
      if (emailCheck.rows.length > 0) return reply.code(400).send({ error: 'Email is already taken' });

      const result = await pool.query(
        'UPDATE users SET email=$1, first_name=$2, last_name=$3, updated_at=NOW() WHERE id=$4 RETURNING id, email, first_name, last_name, user_type, created_at',
        [email, first_name, last_name, request.user.userId]
      );
      if (result.rows.length === 0) return reply.code(404).send({ error: 'User not found' });

      const userResult = await pool.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.user_type, u.created_at,
               v.business_name, v.business_description, v.location, v.phone as vendor_phone, v.website
        FROM users u LEFT JOIN vendors v ON u.id = v.user_id WHERE u.id = $1
      `, [request.user.userId]);
      const user = userResult.rows[0];
      const responseUser = { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, user_type: user.user_type, created_at: user.created_at };
      if (user.user_type === 'vendor' && user.business_name) {
        responseUser.vendor_profile = { business_name: user.business_name, business_description: user.business_description, location: user.location, phone: user.vendor_phone, website: user.website };
      } else if (user.user_type === 'shopper') {
        const sp = await pool.query('SELECT full_name, address, phone_number FROM shoppers WHERE user_id = $1', [request.user.userId]);
        if (sp.rows.length > 0) responseUser.shopper_profile = sp.rows[0];
      }
      return reply.send({ message: 'Profile updated successfully', user: responseUser });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update profile' });
    }
  });

  // ── Update vendor profile ──────────────────────────────────────────────────
  fastify.put('/vendor-profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { business_name, business_description, location, phone, website } = request.body || {};
      if (!business_name) return reply.code(400).send({ error: 'Business name is required' });

      const userCheck = await pool.query('SELECT user_type FROM users WHERE id = $1', [request.user.userId]);
      if (userCheck.rows.length === 0 || userCheck.rows[0].user_type !== 'vendor')
        return reply.code(403).send({ error: 'Access denied. Vendor account required.' });

      const result = await pool.query(
        'UPDATE vendors SET business_name=$1, business_description=$2, location=$3, phone=$4, website=$5, updated_at=NOW() WHERE user_id=$6 RETURNING *',
        [business_name, business_description, location, phone, website, request.user.userId]
      );
      if (result.rows.length === 0) return reply.code(404).send({ error: 'Vendor profile not found' });

      const userResult = await pool.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.user_type, u.created_at,
               v.business_name, v.business_description, v.location, v.phone as vendor_phone, v.website
        FROM users u LEFT JOIN vendors v ON u.id = v.user_id WHERE u.id = $1
      `, [request.user.userId]);
      const user = userResult.rows[0];
      return reply.send({ message: 'Business profile updated successfully', user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, user_type: user.user_type, created_at: user.created_at, vendor_profile: { business_name: user.business_name, business_description: user.business_description, location: user.location, phone: user.vendor_phone, website: user.website } } });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update business profile' });
    }
  });

  // ── Change password ────────────────────────────────────────────────────────
  fastify.put('/change-password', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { currentPassword, newPassword } = request.body || {};
      if (!currentPassword || !newPassword) return reply.code(400).send({ error: 'Current password and new password are required' });

      const pwCheck = validatePasswordSecurity(newPassword);
      if (!pwCheck.isValid) return reply.code(400).send({ error: 'New password does not meet security requirements', code: 'WEAK_PASSWORD', details: pwCheck.errors });

      const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [request.user.userId]);
      if (userResult.rows.length === 0) return reply.code(404).send({ error: 'User not found' });
      if (!await bcrypt.compare(currentPassword, userResult.rows[0].password_hash)) {
        await logSecurityEvent('PASSWORD_CHANGE_FAILED', { reason: 'INVALID_CURRENT_PASSWORD', ip: request.ip, userAgent: request.headers['user-agent'] }, request.user.userId);
        return reply.code(400).send({ error: 'Current password is incorrect' });
      }

      await pool.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [await bcrypt.hash(newPassword, 12), request.user.userId]);
      await invalidateUserTokens(request.user.userId);
      await logSecurityEvent('PASSWORD_CHANGED', { ip: request.ip, userAgent: request.headers['user-agent'] }, request.user.userId);
      return reply.send({ message: 'Password changed successfully. Please login again.' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to change password' });
    }
  });

  // ── Refresh token ──────────────────────────────────────────────────────────
  fastify.post('/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body || {};
      if (!refreshToken) return reply.code(400).send({ error: 'Refresh token is required', code: 'MISSING_REFRESH_TOKEN' });

      const result = await refreshUserSession(refreshToken);
      await logSecurityEvent('TOKEN_REFRESHED', { userId: result.user.id, email: result.user.email, ip: request.ip, userAgent: request.headers['user-agent'] }, result.user.id);
      return reply.send({ message: 'Token refreshed successfully', accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
    } catch (err) {
      await logSecurityEvent('TOKEN_REFRESH_FAILED', { reason: err.message, ip: request.ip, userAgent: request.headers['user-agent'] });
      if (err.message.includes('expired')) return reply.code(401).send({ error: 'Refresh token expired', code: 'REFRESH_TOKEN_EXPIRED' });
      return reply.code(401).send({ error: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }
  });

  // ── Logout ─────────────────────────────────────────────────────────────────
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      await invalidateUserTokens(request.user.userId);
      await logSecurityEvent('USER_LOGOUT', { email: request.user.email, ip: request.ip, userAgent: request.headers['user-agent'] }, request.user.userId);
      return reply.send({ message: 'Logged out successfully' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to logout' });
    }
  });

  // ── Logout all devices ─────────────────────────────────────────────────────
  fastify.post('/logout-all', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      await invalidateUserTokens(request.user.userId);
      await logSecurityEvent('USER_LOGOUT_ALL', { email: request.user.email, ip: request.ip, userAgent: request.headers['user-agent'] }, request.user.userId);
      return reply.send({ message: 'Logged out from all devices successfully' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to logout from all devices' });
    }
  });

  // ── Security logs (admin) ──────────────────────────────────────────────────
  fastify.get('/security-logs', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userResult = await pool.query('SELECT user_type FROM users WHERE id = $1', [request.user.userId]);
      if (userResult.rows.length === 0 || userResult.rows[0].user_type !== 'admin')
        return reply.code(403).send({ error: 'Access denied. Admin privileges required.' });

      const result = await pool.query(`
        SELECT sl.*, u.email as user_email FROM security_logs sl
        LEFT JOIN users u ON sl.user_id = u.id ORDER BY sl.created_at DESC LIMIT 100
      `);
      return reply.send(result.rows);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch security logs' });
    }
  });
}

module.exports = authRoutes;
