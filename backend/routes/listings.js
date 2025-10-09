const express = require('express');
const { pool, authenticateToken } = require('../utils');
const xss = require('xss');

const router = express.Router();

const sanitize = (v) => (typeof v === 'string' ? xss(v.trim()) : v);

// GET /api/listings
// Search and filter listings (backed by products table)
router.get('/', async (req, res) => {
  try {
    const {
      query: q,
      category,
      minPrice,
      maxPrice,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const allowedSort = ['price', 'created_at', 'name', 'relevance'];
    const finalSortBy = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = (sortOrder || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const clauses = [];
    const params = [];

    let useFTS = false;
    let tsParamIndex = 0;
    if (q && q.trim().length >= 2) {
      // Use full-text search for better relevance and index usage
      useFTS = true;
      params.push(sanitize(q));
      tsParamIndex = params.length;
      clauses.push(`to_tsvector('simple', coalesce(p.name,'') || ' ' || coalesce(p.description,'')) @@ plainto_tsquery('simple', $${tsParamIndex})`);
    }
    if (category) {
      params.push(sanitize(category));
      clauses.push(`p.category = $${params.length}`);
    }
    if (minPrice) {
      params.push(parseFloat(minPrice));
      clauses.push(`p.price >= $${params.length}`);
    }
    if (maxPrice) {
      params.push(parseFloat(maxPrice));
      clauses.push(`p.price <= $${params.length}`);
    }

    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    // If using FTS, compute rank for ordering by relevance
    const rankSelect = useFTS ? `, ts_rank(to_tsvector('simple', coalesce(p.name,'') || ' ' || coalesce(p.description,'')), plainto_tsquery('simple', $${tsParamIndex})) AS rank` : '';

    const orderSql = useFTS
      ? `ORDER BY rank DESC, p.created_at DESC`
      : `ORDER BY p.${finalSortBy} ${finalSortOrder}`;

    const sql = `
      SELECT 
        p.id, p.name AS title, p.description, p.price, p.category,
        p.status, p.created_at,
        COALESCE(v.business_name, 'Unknown') AS vendor_name,
        COALESCE(v.location, 'Unknown') AS vendor_location,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true ORDER BY display_order LIMIT 1) AS cover_image
        ${rankSelect}
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      ${whereSql}
      ${orderSql}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countSql = `SELECT COUNT(*)::int AS total FROM products p ${whereSql}`;

    const rowsPromise = pool.query(sql, [...params, limitNum, offset]);
    const countPromise = pool.query(countSql, params);

    const [rowsRes, countRes] = await Promise.all([rowsPromise, countPromise]);
    const items = rowsRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      price: r.price,
      category: r.category,
      status: r.status || 'active',
      created_at: r.created_at,
      vendor: { name: r.vendor_name, location: r.vendor_location },
      cover_image: r.cover_image || null,
    }));

    return res.json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countRes.rows[0].total,
        total_pages: Math.ceil(countRes.rows[0].total / limitNum),
      },
    });
  } catch (err) {
    console.error('LISTINGS_SEARCH_ERROR:', err.message);
    return res.status(500).json({ error: 'Unable to fetch listings', code: 'LISTINGS_SEARCH_FAILED' });
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const sql = `
      SELECT p.*, v.business_name AS vendor_name, v.location AS vendor_location
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE p.id = $1
    `;
    const { rows } = await pool.query(sql, [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Listing not found' });

    const imagesRes = await pool.query(
      `SELECT id, image_url, is_primary, display_order FROM product_images WHERE product_id = $1 ORDER BY display_order`,
      [id]
    );

    const item = rows[0];
    return res.json({
      id: item.id,
      title: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      status: item.status || 'active',
      created_at: item.created_at,
      vendor: { name: item.vendor_name, location: item.vendor_location },
      images: imagesRes.rows,
    });
  } catch (err) {
    console.error('LISTING_DETAIL_ERROR:', err.message);
    return res.status(500).json({ error: 'Unable to fetch listing', code: 'LISTING_FETCH_FAILED' });
  }
});

// POST /api/listings
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, price, condition, location_lat, location_lng } = req.body || {};
    if (!title || typeof title !== 'string' || !price) {
      return res.status(400).json({ error: 'title and price are required' });
    }

    let result;
    try {
      // Attempt to insert with marketplace columns
      result = await pool.query(
        `INSERT INTO products (name, description, category, price, status, condition, location_lat, location_lng)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [
          sanitize(title),
          sanitize(description || ''),
          sanitize(category || null),
          parseFloat(price),
          'active',
          condition ? sanitize(condition) : null,
          location_lat != null ? Number(location_lat) : null,
          location_lng != null ? Number(location_lng) : null,
        ]
      );
    } catch (e) {
      console.warn('LISTING_INSERT_WITH_MARKETPLACE_COLS_FAILED_FALLBACK:', e.code || e.message);
      // Fallback without optional columns
      result = await pool.query(
        `INSERT INTO products (name, description, category, price, status)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id`,
        [sanitize(title), sanitize(description || ''), sanitize(category || null), parseFloat(price), 'active']
      );
    }

    return res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error('LISTING_CREATE_ERROR:', err.message);
    return res.status(500).json({ error: 'Unable to create listing', code: 'LISTING_CREATE_FAILED' });
  }
});

// PATCH /api/listings/:id
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const allowed = ['title', 'description', 'category', 'price', 'status'];
    const sets = [];
    const params = [];

    if (req.body.title) { params.push(sanitize(req.body.title)); sets.push(`name = $${params.length}`); }
    if (req.body.description) { params.push(sanitize(req.body.description)); sets.push(`description = $${params.length}`); }
    if (req.body.category) { params.push(sanitize(req.body.category)); sets.push(`category = $${params.length}`); }
    if (req.body.price) { params.push(parseFloat(req.body.price)); sets.push(`price = $${params.length}`); }
    if (req.body.status) { params.push(sanitize(req.body.status)); sets.push(`status = $${params.length}`); }

    if (!sets.length) return res.status(400).json({ error: 'No valid fields to update' });

    params.push(id);
    const sql = `UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`;
    await pool.query(sql, params);
    return res.json({ ok: true });
  } catch (err) {
    console.error('LISTING_UPDATE_ERROR:', err.message);
    return res.status(500).json({ error: 'Unable to update listing', code: 'LISTING_UPDATE_FAILED' });
  }
});

// DELETE /api/listings/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('LISTING_DELETE_ERROR:', err.message);
    return res.status(500).json({ error: 'Unable to delete listing', code: 'LISTING_DELETE_FAILED' });
  }
});

module.exports = router;