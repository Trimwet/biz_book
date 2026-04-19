'use strict';

const { pool } = require('../utils');
const xss = require('xss');
const { onProductMutated } = require('../utils/aiHooks');
const sanitize = (v) => (typeof v === 'string' ? xss(v.trim()) : v);

async function listingsRoutes(fastify) {
  fastify.get('/', async (request, reply) => {
    try {
      const { query: q, category, minPrice, maxPrice, sortBy = 'created_at', sortOrder = 'DESC', page = 1, limit = 20 } = request.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      const allowedSort = ['price', 'created_at', 'name', 'relevance'];
      let chosenSort = allowedSort.includes(sortBy) ? sortBy : 'created_at';
      const finalSortOrder = (sortOrder || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const clauses = [];
      const params = [];
      let useFTS = false, tsParamIndex = 0;

      if (q && q.trim().length >= 2) {
        useFTS = true;
        params.push(sanitize(q));
        tsParamIndex = params.length;
        clauses.push(`to_tsvector('simple', coalesce(p.name,'') || ' ' || coalesce(p.description,'')) @@ plainto_tsquery('simple', $${tsParamIndex})`);
      }
      if (category) { params.push(sanitize(category)); clauses.push(`p.category = $${params.length}`); }
      if (request.query.state) { params.push(`%${sanitize(request.query.state)}%`); clauses.push(`p.state ILIKE $${params.length}`); }
      if (minPrice) { params.push(parseFloat(minPrice)); clauses.push(`p.price >= $${params.length}`); }
      if (maxPrice) { params.push(parseFloat(maxPrice)); clauses.push(`p.price <= $${params.length}`); }

      const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const rankSelect = useFTS ? `, ts_rank(to_tsvector('simple', coalesce(p.name,'') || ' ' || coalesce(p.description,'')), plainto_tsquery('simple', $${tsParamIndex})) AS rank` : '';
      if (!useFTS && chosenSort === 'relevance') chosenSort = 'created_at';
      const orderSql = useFTS ? `ORDER BY rank DESC, p.created_at DESC` : `ORDER BY p.${chosenSort} ${finalSortOrder}`;
      const statusClause = `${whereSql ? whereSql + ' AND' : 'WHERE'} (p.status IN ('published') OR p.status = 'active' OR p.status IS NULL)`;

      params.push(limitNum, offset);
      const sql = `SELECT p.id, p.name AS title, p.description, p.price, p.category, p.status, p.created_at, p.state, p.city, COALESCE(v.business_name,'Unknown') AS vendor_name, COALESCE(v.location,'Unknown') AS vendor_location, (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true ORDER BY display_order LIMIT 1) AS cover_image ${rankSelect} FROM products p LEFT JOIN vendors v ON p.vendor_id = v.id ${statusClause} ${orderSql} LIMIT $${params.length - 1} OFFSET $${params.length}`;
      const countSql = `SELECT COUNT(*)::int AS total FROM products p ${whereSql}`;

      const [rowsRes, countRes] = await Promise.all([pool.query(sql, params), pool.query(countSql, params.slice(0, -2))]);
      const items = rowsRes.rows.map(r => ({ id: r.id, title: r.title, description: r.description, price: r.price, category: r.category, status: r.status || 'active', created_at: r.created_at, vendor: { name: r.vendor_name, location: r.vendor_location }, state: r.state || null, city: r.city || null, cover_image: r.cover_image || null }));
      return reply.send({ items, pagination: { page: pageNum, limit: limitNum, total: countRes.rows[0].total, total_pages: Math.ceil(countRes.rows[0].total / limitNum) } });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to fetch listings', code: 'LISTINGS_SEARCH_FAILED' });
    }
  });

  fastify.get('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'Invalid id' });
      const { rows } = await pool.query('SELECT p.*, v.business_name AS vendor_name, v.location AS vendor_location FROM products p LEFT JOIN vendors v ON p.vendor_id = v.id WHERE p.id = $1', [id]);
      if (!rows[0]) return reply.code(404).send({ error: 'Listing not found' });
      const imagesRes = await pool.query('SELECT id, image_url, is_primary, display_order FROM product_images WHERE product_id = $1 ORDER BY display_order', [id]);
      const item = rows[0];
      return reply.send({ id: item.id, title: item.name, description: item.description, price: item.price, category: item.category, status: item.status || 'active', created_at: item.created_at, vendor: { name: item.vendor_name, location: item.vendor_location }, state: item.state || null, city: item.city || null, images: imagesRes.rows });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to fetch listing', code: 'LISTING_FETCH_FAILED' });
    }
  });

  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { title, description, category, price, condition, location_lat, location_lng } = request.body || {};
      if (!title || typeof title !== 'string' || !price) return reply.code(400).send({ error: 'title and price are required' });
      let result;
      try {
        result = await pool.query('INSERT INTO products (name, description, category, price, status, condition, location_lat, location_lng) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', [sanitize(title), sanitize(description || ''), sanitize(category || null), parseFloat(price), 'draft', condition ? sanitize(condition) : null, location_lat != null ? Number(location_lat) : null, location_lng != null ? Number(location_lng) : null]);
      } catch (_) {
        result = await pool.query('INSERT INTO products (name, description, category, price, status) VALUES ($1,$2,$3,$4,$5) RETURNING id', [sanitize(title), sanitize(description || ''), sanitize(category || null), parseFloat(price), 'draft']);
      }
      const newId = result.rows[0].id;
      try { onProductMutated({ productId: Number(newId), vendorId: request.user?.userId || null, action: 'listing_created' }); } catch (_) {}
      return reply.code(201).send({ id: newId });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to create listing', code: 'LISTING_CREATE_FAILED' });
    }
  });

  fastify.patch('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'Invalid id' });
      const sets = [], params = [];
      if (request.body.title) { params.push(sanitize(request.body.title)); sets.push(`name = $${params.length}`); }
      if (request.body.description) { params.push(sanitize(request.body.description)); sets.push(`description = $${params.length}`); }
      if (request.body.category) { params.push(sanitize(request.body.category)); sets.push(`category = $${params.length}`); }
      if (request.body.price) { params.push(parseFloat(request.body.price)); sets.push(`price = $${params.length}`); }
      if (request.body.status) { params.push(sanitize(request.body.status)); sets.push(`status = $${params.length}`); }
      if (!sets.length) return reply.code(400).send({ error: 'No valid fields to update' });
      params.push(id);
      await pool.query(`UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params);
      try { onProductMutated({ productId: Number(id), vendorId: request.user?.userId || null, action: 'listing_updated' }); } catch (_) {}
      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to update listing', code: 'LISTING_UPDATE_FAILED' });
    }
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'Invalid id' });
      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      try { onProductMutated({ productId: Number(id), vendorId: request.user?.userId || null, action: 'listing_deleted' }); } catch (_) {}
      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to delete listing', code: 'LISTING_DELETE_FAILED' });
    }
  });
}

module.exports = listingsRoutes;
