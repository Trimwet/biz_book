'use strict';

const { pool } = require('../utils');
const xss = require('xss');
const sanitize = (v) => (typeof v === 'string' ? xss(v.trim()) : v);

const ALLOWED_EVENTS = ['view_item', 'add_watchlist', 'open_chat', 'search_query', 'click_recommendation'];

async function personalizationRoutes(fastify) {
  fastify.post('/events', async (request, reply) => {
    try {
      const { type, productId, metadata } = request.body || {};
      if (!type || typeof type !== 'string') return reply.code(400).send({ error: 'type is required' });
      const eventType = sanitize(type);
      if (!ALLOWED_EVENTS.includes(eventType)) return reply.code(400).send({ error: 'Unsupported event type' });

      const userId = request.user?.userId || null;
      const product_id = Number.isFinite(parseInt(productId)) ? parseInt(productId) : null;
      const meta = metadata && typeof metadata === 'object' ? metadata : null;

      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_events (
          id SERIAL PRIMARY KEY, user_id INTEGER NULL, product_id INTEGER NULL,
          type VARCHAR(64) NOT NULL, metadata JSONB NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      await pool.query('INSERT INTO user_events (user_id, product_id, type, metadata) VALUES ($1,$2,$3,$4)', [userId, product_id, eventType, meta]);
      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to record event' });
    }
  });

  fastify.get('/recommendations', async (request, reply) => {
    try {
      const limit = Math.min(24, Math.max(1, parseInt(request.query.limit || '12')));
      const productId = parseInt(request.query.productId);

      let baseCategory = null;
      if (Number.isFinite(productId)) {
        const { rows } = await pool.query('SELECT category FROM products WHERE id = $1', [productId]);
        baseCategory = rows[0]?.category || null;
      }

      const params = [];
      let whereSql = '';
      if (baseCategory) { params.push(baseCategory); whereSql = `WHERE p.category = $${params.length}`; }

      const { rows } = await pool.query(`
        SELECT p.id, p.name AS title, p.description, p.price, p.category,
               (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true ORDER BY display_order LIMIT 1) AS cover_image,
               COALESCE(uv.view_count, 0) AS view_score
        FROM products p
        LEFT JOIN (SELECT product_id, COUNT(*) AS view_count FROM user_events WHERE type = 'view_item' AND created_at >= NOW() - INTERVAL '30 days' GROUP BY product_id) uv ON uv.product_id = p.id
        ${whereSql}
        ORDER BY view_score DESC, p.created_at DESC
        LIMIT $${params.length + 1}
      `, [...params, limit]);

      let items = rows;
      if (!items.length) {
        const fb = await pool.query(`SELECT p.id, p.name AS title, p.description, p.price, p.category, (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true ORDER BY display_order LIMIT 1) AS cover_image FROM products p ${whereSql} ORDER BY p.created_at DESC LIMIT $${params.length + 1}`, [...params, limit]);
        items = fb.rows;
      }

      const filtered = Number.isFinite(productId) ? items.filter(i => i.id !== productId) : items;
      return reply.send({ items: filtered });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to fetch recommendations' });
    }
  });
}

module.exports = personalizationRoutes;
