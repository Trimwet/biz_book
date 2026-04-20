'use strict';
const { pool } = require('../utils');

async function shopperRoutes(fastify) {
  async function authenticateShopper(request, reply) {
    if (!request.user?.userId) {
      return reply.code(401).send({ error: 'Authentication required.', code: 'NO_TOKEN' });
    }

    const uc = await pool.query('SELECT user_type, can_sell FROM users WHERE id = $1', [request.user.userId]);
    if (uc.rows.length === 0) return reply.code(403).send({ error: 'Access denied.', code: 'NOT_SHOPPER' });

    const { user_type, can_sell } = uc.rows[0];
    if (user_type !== 'shopper' && !can_sell) {
      return reply.code(403).send({ error: 'Access denied. Shopper account required.', code: 'NOT_SHOPPER' });
    }

    const sr = await pool.query('SELECT id FROM shoppers WHERE user_id = $1', [request.user.userId]);
    if (sr.rows.length === 0) {
      return reply.code(404).send({
        error: 'Shopper profile not found.',
        code: 'SHOPPER_NOT_FOUND',
        action: 'CREATE_PROFILE',
      });
    }

    request.shopperId = sr.rows[0].id;
  }

  const formatNaira = (amount) => {
    const normalized = Math.max(0, Math.floor(Number(amount) || 0));
    return `₦${new Intl.NumberFormat('en-NG').format(normalized)}`;
  };

  async function getShopperStats(userId, shopperId) {
    const stats = { money_saved: 0, comparisons_count: 0, reviews_count: 0, watchlist_count: 0 };

    // comparisons (by shopper_id)
    try {
      const comp = await pool.query('SELECT COUNT(*)::int as c FROM comparisons WHERE shopper_id = $1', [shopperId]);
      stats.comparisons_count = comp.rows[0]?.c || 0;

      const save = await pool.query(
        'SELECT COALESCE(SUM(money_saved),0)::numeric as total FROM comparisons WHERE shopper_id = $1',
        [shopperId]
      );
      stats.money_saved = Math.floor(parseFloat(save.rows[0]?.total || 0));
    } catch (e) {
      fastify.log.warn('comparisons query failed:', e.message);
    }

    // reviews: try user_id then shopper_id
    try {
      const rev = await pool.query('SELECT COUNT(*)::int as c FROM reviews WHERE user_id = $1', [userId]);
      stats.reviews_count = rev.rows[0]?.c || 0;
    } catch (e) {
      fastify.log.warn('reviews user_id query failed, trying shopper_id:', e.message);
      try {
        const rev2 = await pool.query('SELECT COUNT(*)::int as c FROM reviews WHERE shopper_id = $1', [shopperId]);
        stats.reviews_count = rev2.rows[0]?.c || 0;
      } catch (e2) {
        fastify.log.warn('reviews shopper_id query failed:', e2.message);
      }
    }

    // wishlist/watchlist: try shopper_id then user_id
    try {
      const watch = await pool.query('SELECT COUNT(*)::int as c FROM wishlist WHERE shopper_id = $1', [shopperId]);
      stats.watchlist_count = watch.rows[0]?.c || 0;
    } catch (e) {
      fastify.log.warn('wishlist shopper_id query failed, trying user_id:', e.message);
      try {
        const watch2 = await pool.query('SELECT COUNT(*)::int as c FROM wishlist WHERE user_id = $1', [userId]);
        stats.watchlist_count = watch2.rows[0]?.c || 0;
      } catch (e2) {
        fastify.log.warn('wishlist user_id query failed:', e2.message);
      }
    }

    return stats;
  }

  async function getRecentActivity(userId, shopperId) {
    const allActivity = [];

    try {
      const comparisons = await pool.query(
        `SELECT c.id, c.created_at, COALESCE(c.money_saved, 0)::numeric AS money_saved, p.name AS product_name
         FROM comparisons c
         LEFT JOIN products p ON p.id = c.product_id
         WHERE c.shopper_id = $1
         ORDER BY c.created_at DESC
         LIMIT 6`,
        [shopperId]
      );

      for (const row of comparisons.rows) {
        const savedValue = Number(row.money_saved || 0);
        allActivity.push({
          id: `comparison-${row.id}`,
          type: 'deal_found',
          title: 'Deal Found',
          description: row.product_name
            ? `Compared prices for ${row.product_name}`
            : 'Compared products and found a better deal',
          value: savedValue > 0 ? formatNaira(savedValue) : 'Compared',
          occurred_at: row.created_at,
          target_route: '/compare',
          style_token: 'primary',
        });
      }
    } catch (e) {
      fastify.log.warn('comparison activity query failed:', e.message);
      try {
        const comparisonsFallback = await pool.query(
          `SELECT c.id, c.created_at
           FROM comparisons c
           WHERE c.shopper_id = $1
           ORDER BY c.created_at DESC
           LIMIT 6`,
          [shopperId]
        );

        for (const row of comparisonsFallback.rows) {
          allActivity.push({
            id: `comparison-${row.id}`,
            type: 'deal_found',
            title: 'Deal Found',
            description: 'Compared products and found a better deal',
            value: 'Compared',
            occurred_at: row.created_at,
            target_route: '/compare',
            style_token: 'primary',
          });
        }
      } catch (fallbackErr) {
        fastify.log.warn('comparison fallback activity query failed:', fallbackErr.message);
      }
    }

    try {
      const reviews = await pool.query(
        `SELECT r.id, r.created_at, r.rating, p.name AS product_name
         FROM reviews r
         LEFT JOIN products p ON p.id = r.product_id
         WHERE r.shopper_id = $1
         ORDER BY r.created_at DESC
         LIMIT 6`,
        [shopperId]
      );

      for (const row of reviews.rows) {
        allActivity.push({
          id: `review-${row.id}`,
          type: 'review_posted',
          title: 'Review Added',
          description: row.product_name ? `You reviewed ${row.product_name}` : 'You posted a product review',
          value: row.rating ? `⭐ ${row.rating}/5` : 'Review',
          occurred_at: row.created_at,
          target_route: '/social',
          style_token: 'amber',
        });
      }
    } catch (e) {
      fastify.log.warn('reviews activity query failed, trying user_id fallback:', e.message);
      try {
        const reviewsFallback = await pool.query(
          `SELECT r.id, r.created_at, r.rating, p.name AS product_name
           FROM reviews r
           LEFT JOIN products p ON p.id = r.product_id
           WHERE r.user_id = $1
           ORDER BY r.created_at DESC
           LIMIT 6`,
          [userId]
        );

        for (const row of reviewsFallback.rows) {
          allActivity.push({
            id: `review-${row.id}`,
            type: 'review_posted',
            title: 'Review Added',
            description: row.product_name ? `You reviewed ${row.product_name}` : 'You posted a product review',
            value: row.rating ? `⭐ ${row.rating}/5` : 'Review',
            occurred_at: row.created_at,
            target_route: '/social',
            style_token: 'amber',
          });
        }
      } catch (fallbackErr) {
        fastify.log.warn('reviews fallback activity query failed:', fallbackErr.message);
      }
    }

    try {
      const watchlist = await pool.query(
        `SELECT w.id, w.created_at, p.name AS product_name
         FROM wishlist w
         LEFT JOIN products p ON p.id = w.product_id
         WHERE w.shopper_id = $1
         ORDER BY w.created_at DESC
         LIMIT 6`,
        [shopperId]
      );

      for (const row of watchlist.rows) {
        allActivity.push({
          id: `watchlist-${row.id}`,
          type: 'watchlist_addition',
          title: 'Watchlist Addition',
          description: row.product_name
            ? `${row.product_name} added to your watchlist`
            : 'A product was added to your watchlist',
          value: 'Tracking',
          occurred_at: row.created_at,
          target_route: '/watchlist',
          style_token: 'rose',
        });
      }
    } catch (e) {
      fastify.log.warn('watchlist activity query failed, trying user_id fallback:', e.message);
      try {
        const watchlistFallback = await pool.query(
          `SELECT w.id, w.created_at, p.name AS product_name
           FROM wishlist w
           LEFT JOIN products p ON p.id = w.product_id
           WHERE w.user_id = $1
           ORDER BY w.created_at DESC
           LIMIT 6`,
          [userId]
        );

        for (const row of watchlistFallback.rows) {
          allActivity.push({
            id: `watchlist-${row.id}`,
            type: 'watchlist_addition',
            title: 'Watchlist Addition',
            description: row.product_name
              ? `${row.product_name} added to your watchlist`
              : 'A product was added to your watchlist',
            value: 'Tracking',
            occurred_at: row.created_at,
            target_route: '/watchlist',
            style_token: 'rose',
          });
        }
      } catch (fallbackErr) {
        fastify.log.warn('watchlist fallback activity query failed:', fallbackErr.message);
      }
    }

    return allActivity
      .filter((item) => item.occurred_at)
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
      .slice(0, 8);
  }

  fastify.post('/shopper/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { full_name, address, phone_number } = request.body || {};
      const existing = await pool.query('SELECT id FROM shoppers WHERE user_id = $1', [request.user.userId]);
      if (existing.rows.length > 0) {
        return reply.code(409).send({ error: 'Shopper profile already exists', code: 'SHOPPER_EXISTS' });
      }

      const uc = await pool.query('SELECT user_type FROM users WHERE id = $1', [request.user.userId]);
      if (uc.rows.length === 0 || uc.rows[0].user_type !== 'shopper') {
        return reply.code(403).send({ error: 'Access denied. Shopper account required.', code: 'NOT_SHOPPER' });
      }

      const result = await pool.query(
        'INSERT INTO shoppers (user_id, full_name, address, phone_number) VALUES ($1,$2,$3,$4) RETURNING id',
        [request.user.userId, full_name || '', address || '', phone_number || '']
      );
      return reply.code(201).send({ message: 'Shopper profile created successfully', shopper_id: result.rows[0].id });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to create shopper profile', code: 'CREATE_SHOPPER_ERROR' });
    }
  });

  // Compatibility: check if shopper profile exists (used by frontend)
  fastify.get('/shopper/profile/exists', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const sr = await pool.query('SELECT id FROM shoppers WHERE user_id = $1', [request.user.userId]);
      const hasProfile = sr.rows.length > 0;
      return reply.send({ hasProfile, shopperId: hasProfile ? sr.rows[0].id : null });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to check shopper profile', code: 'CHECK_PROFILE_ERROR' });
    }
  });

  // Compatibility: get shopper profile (returns profile details)
  fastify.get('/shopper/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const r = await pool.query(
        'SELECT id, full_name, address, phone_number FROM shoppers WHERE user_id = $1',
        [request.user.userId]
      );
      if (!r.rows[0]) return reply.code(404).send({ error: 'Shopper profile not found', code: 'SHOPPER_NOT_FOUND' });
      return reply.send({ profile: r.rows[0] });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch shopper profile', code: 'FETCH_PROFILE_ERROR' });
    }
  });

  fastify.get('/shopper/dashboard', { preHandler: [fastify.authenticate, authenticateShopper] }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const shopperId = request.shopperId;

      const profile = await pool.query(
        `SELECT u.email, s.full_name
         FROM users u
         LEFT JOIN shoppers s ON s.user_id = u.id
         WHERE u.id = $1
         LIMIT 1`,
        [userId]
      );

      const stats = await getShopperStats(userId, shopperId);
      const activity = await getRecentActivity(userId, shopperId);
      const displayName = profile.rows[0]?.full_name || profile.rows[0]?.email || 'Shopper';

      fastify.log.info(
        { shopperId, userId, activityCount: activity.length },
        'served shopper dashboard payload'
      );

      return reply.send({
        summary: {
          display_name: displayName,
          subtitle: 'Ready to discover amazing deals today?',
          badges: {
            shopper: 'Smart Shopper',
            presence: 'Online',
          },
          stats,
          updated_at: new Date().toISOString(),
        },
        activity,
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch shopper dashboard', code: 'DASHBOARD_ERROR' });
    }
  });

  fastify.get('/shopper/stats', { preHandler: [fastify.authenticate, authenticateShopper] }, async (request, reply) => {
    try {
      const stats = await getShopperStats(request.user.userId, request.shopperId);
      return reply.send(stats);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch shopper stats', code: 'STATS_ERROR' });
    }
  });

  fastify.get('/shopper/watchlist', { preHandler: [fastify.authenticate, authenticateShopper] }, async (request, reply) => {
    try {
      const result = await pool.query(
        'SELECT w.id as wishlist_id, w.created_at as added_at, p.id as product_id, p.name, p.price, p.description, p.category, p.image_url, v.business_name as vendor_name, v.location as vendor_location FROM wishlist w JOIN products p ON w.product_id = p.id JOIN vendors v ON p.vendor_id = v.id WHERE w.shopper_id = $1 ORDER BY w.created_at DESC',
        [request.shopperId]
      );
      return reply.send({ watchlist: result.rows, count: result.rows.length });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch watchlist', code: 'WATCHLIST_ERROR' });
    }
  });

  fastify.post('/shopper/watchlist', { preHandler: [fastify.authenticate, authenticateShopper] }, async (request, reply) => {
    try {
      const { product_id } = request.body || {};
      if (!product_id) return reply.code(400).send({ error: 'Product ID is required', code: 'MISSING_PRODUCT_ID' });

      const pc = await pool.query('SELECT id FROM products WHERE id = $1', [product_id]);
      if (pc.rows.length === 0) return reply.code(404).send({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });

      const ec = await pool.query('SELECT id FROM wishlist WHERE shopper_id = $1 AND product_id = $2', [request.shopperId, product_id]);
      if (ec.rows.length > 0) return reply.code(400).send({ error: 'Product already in watchlist', code: 'ALREADY_IN_WATCHLIST' });

      const result = await pool.query(
        'INSERT INTO wishlist (shopper_id, product_id, created_at) VALUES ($1,$2,NOW()) RETURNING id',
        [request.shopperId, product_id]
      );
      return reply.code(201).send({ message: 'Product added to watchlist', wishlist_id: result.rows[0].id });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to add to watchlist', code: 'ADD_WATCHLIST_ERROR' });
    }
  });

  fastify.delete('/shopper/watchlist/:productId', { preHandler: [fastify.authenticate, authenticateShopper] }, async (request, reply) => {
    try {
      const result = await pool.query('DELETE FROM wishlist WHERE shopper_id = $1 AND product_id = $2 RETURNING id', [request.shopperId, request.params.productId]);
      if (result.rows.length === 0) return reply.code(404).send({ error: 'Product not in watchlist', code: 'NOT_IN_WATCHLIST' });
      return reply.send({ message: 'Product removed from watchlist' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to remove from watchlist', code: 'REMOVE_WATCHLIST_ERROR' });
    }
  });
}

module.exports = shopperRoutes;
