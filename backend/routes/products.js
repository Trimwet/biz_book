'use strict';

const { pool } = require('../utils');
const xss = require('xss');
const cache = require('../utils/cache');
const { trackSearch } = require('./search');

const sanitizeInput = (v) => (typeof v === 'string' ? xss(v.trim()) : v);

const mockProducts = [
  { id: 1, name: 'Demo Product 1', price: 150, category: 'Electronics', vendor_location: 'Lagos' },
  { id: 2, name: 'Demo Product 2', price: 90, category: 'Fashion', vendor_location: 'Abuja' },
];
const mockCategories = [
  { category: 'Electronics', product_count: 15, average_price: 450000 },
  { category: 'Computers & Laptops', product_count: 8, average_price: 850000 },
  { category: 'Fashion & Clothing', product_count: 25, average_price: 15000 },
  { category: 'Food & Groceries', product_count: 40, average_price: 2500 },
];

async function productsRoutes(fastify) {
  // ── Categories ─────────────────────────────────────────────────────────────
  fastify.get('/categories', async (_request, reply) => {
    try {
      if (!pool.dbConnected) return reply.send({ categories: mockCategories });
      const cached = await cache.get('products:categories');
      if (cached) return reply.send(cached);
      const result = await pool.query('SELECT category, COUNT(*) as product_count, AVG(price) as average_price FROM products GROUP BY category ORDER BY product_count DESC');
      const payload = { categories: result.rows };
      await cache.set('products:categories', payload, 300);
      return reply.send(payload);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to fetch categories', code: 'FETCH_CATEGORIES_FAILED' });
    }
  });

  // ── Search ─────────────────────────────────────────────────────────────────
  fastify.get('/search', async (request, reply) => {
    try {
      const { q: query, category, location, minPrice, maxPrice, sortBy = 'price', sortOrder = 'ASC', page = 1, limit = 20 } = request.query;
      if (!query || query.trim().length < 2) return reply.code(400).send({ error: 'Search query must be at least 2 characters', code: 'INVALID_SEARCH_QUERY' });

      const sanitizedQuery = sanitizeInput(query);
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;
      const searchFilters = { category: category || null, location: location || null, minPrice: minPrice || null, maxPrice: maxPrice || null, sortBy, sortOrder };

      if (!pool.dbConnected) {
        let filtered = mockProducts.filter(p => p.name.toLowerCase().includes(sanitizedQuery.toLowerCase()));
        if (category) filtered = filtered.filter(p => p.category === category);
        if (location) filtered = filtered.filter(p => p.vendor_location.toLowerCase().includes(location.toLowerCase()));
        if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
        if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
        if (sortBy === 'price') filtered.sort((a, b) => sortOrder === 'DESC' ? b.price - a.price : a.price - b.price);
        if (filtered.length > 0) {
          const prices = filtered.map(p => p.price);
          return reply.send({ products: filtered, priceAnalysis: { lowestPrice: Math.min(...prices), highestPrice: Math.max(...prices), averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100, totalVendors: filtered.length, potentialSavings: Math.max(...prices) - Math.min(...prices) }, searchQuery: sanitizedQuery, pagination: { currentPage: pageNum, totalPages: Math.ceil(filtered.length / limitNum), totalResults: filtered.length, hasNextPage: pageNum < Math.ceil(filtered.length / limitNum), hasPrevPage: pageNum > 1 } });
        }
        return reply.send({ products: [], message: 'No products found matching your search criteria', searchQuery: sanitizedQuery });
      }

      const allowedSortColumns = ['price', 'created_at', 'name', 'average_rating'];
      const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'price';
      const validSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      let queryText = `SELECT p.id, p.name, p.price, p.description, p.image_url, p.created_at, v.business_name as vendor_name, v.location as vendor_location, v.phone as vendor_phone, u.email as vendor_email, COALESCE(AVG(r.rating), 0) as average_rating, COUNT(r.id) as review_count FROM products p JOIN vendors v ON p.vendor_id = v.id JOIN users u ON v.user_id = u.id LEFT JOIN reviews r ON p.id = r.product_id WHERE p.name ILIKE $1`;
      const queryParams = [`%${sanitizedQuery}%`];
      let paramCount = 1;

      if (category) { paramCount++; queryText += ` AND p.category = $${paramCount}`; queryParams.push(sanitizeInput(category)); }
      if (location) { paramCount++; queryText += ` AND v.location ILIKE $${paramCount}`; queryParams.push(`%${sanitizeInput(location)}%`); }
      if (minPrice) { paramCount++; queryText += ` AND p.price >= $${paramCount}`; queryParams.push(parseFloat(minPrice)); }
      if (maxPrice) { paramCount++; queryText += ` AND p.price <= $${paramCount}`; queryParams.push(parseFloat(maxPrice)); }

      queryText += ` GROUP BY p.id, v.business_name, v.location, v.phone, u.email ORDER BY ${validSortBy} ${validSortOrder} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limitNum, offset);

      const result = await pool.query(queryText, queryParams);
      const products = result.rows;
      const countQuery = queryText.replace(/SELECT.*?FROM/, 'SELECT COUNT(DISTINCT p.id) as total FROM').replace(/ORDER BY.*?LIMIT.*?OFFSET.*$/, '');
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
      const totalResults = parseInt(countResult.rows[0].total);

      if (request.user) await trackSearch(request.user.userId, sanitizedQuery, searchFilters, totalResults, request.ip, request.headers['user-agent']);

      if (products.length > 0) {
        const prices = products.map(p => parseFloat(p.price));
        return reply.send({ products, priceAnalysis: { lowestPrice: Math.min(...prices), highestPrice: Math.max(...prices), averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100, totalVendors: products.length, potentialSavings: Math.max(...prices) - Math.min(...prices) }, searchQuery: sanitizedQuery, pagination: { currentPage: pageNum, totalPages: Math.ceil(totalResults / limitNum), totalResults, hasNextPage: pageNum < Math.ceil(totalResults / limitNum), hasPrevPage: pageNum > 1, limit: limitNum } });
      }
      return reply.send({ products: [], message: 'No products found matching your search criteria', searchQuery: sanitizedQuery, pagination: { currentPage: pageNum, totalPages: 0, totalResults: 0, hasNextPage: false, hasPrevPage: false, limit: limitNum } });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Search temporarily unavailable', code: 'SEARCH_ERROR' });
    }
  });

  // ── Browse ─────────────────────────────────────────────────────────────────
  fastify.get('/browse', async (request, reply) => {
    try {
      const { category, sortBy = 'created_at', sortOrder = 'DESC', page = 1, limit = 20 } = request.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      if (!pool.dbConnected) {
        const mock = [
          { id: 1, name: 'iPhone 15 Pro', price: 1500000, category: 'Electronics', vendor_name: 'TechHub Store', vendor_location: 'Lagos', created_at: '2024-01-15', status: 'active' },
          { id: 2, name: 'Samsung Galaxy S24', price: 1200000, category: 'Electronics', vendor_name: 'MobileWorld', vendor_location: 'Abuja', created_at: '2024-01-14', status: 'active' },
        ].filter(p => !category || p.category === category);
        return reply.send({ products: mock.slice(offset, offset + limitNum), pagination: { current_page: pageNum, total_pages: Math.ceil(mock.length / limitNum), total_products: mock.length, per_page: limitNum, has_next: pageNum < Math.ceil(mock.length / limitNum), has_prev: pageNum > 1 }, success: true });
      }

      const cacheKey = `products:browse:${category || 'all'}:${sortBy}:${sortOrder}:${pageNum}:${limitNum}`;
      const cached = await cache.get(cacheKey);
      if (cached) return reply.send(cached);

      let whereClause = "(p.status IN ('published') OR p.status = 'active' OR p.status IS NULL)";
      const params = [];
      let paramIndex = 1;
      if (category) { whereClause += ` AND p.category = $${paramIndex}`; params.push(category); paramIndex++; }

      const validSortFields = ['price', 'created_at', 'name'];
      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      params.push(limitNum, offset);
      const query = `SELECT p.*, v.business_name as vendor_name, COALESCE(v.location,'Location not specified') as vendor_location, v.id as vendor_id, json_agg(json_build_object('id',pi.id,'image_url',pi.image_url,'is_primary',pi.is_primary,'display_order',pi.display_order) ORDER BY pi.display_order) FILTER (WHERE pi.id IS NOT NULL) as images FROM products p LEFT JOIN vendors v ON p.vendor_id = v.id LEFT JOIN product_images pi ON p.id = pi.product_id WHERE ${whereClause} GROUP BY p.id, v.business_name, v.location, v.id ORDER BY p.${finalSortBy} ${finalSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

      const result = await pool.query(query, params);
      const countResult = await pool.query(`SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`, params.slice(0, -2));
      const totalProducts = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalProducts / limitNum);
      const products = result.rows.map(p => ({ ...p, images: p.images && p.images[0] !== null ? p.images : [] }));

      const browsePayload = { products, pagination: { current_page: pageNum, total_pages: totalPages, total_products: totalProducts, per_page: limitNum, has_next: pageNum < totalPages, has_prev: pageNum > 1 }, success: true };
      await cache.set(cacheKey, browsePayload, 60);
      return reply.send(browsePayload);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to browse products', code: 'BROWSE_PRODUCTS_FAILED' });
    }
  });

  // ── Products by vendor ─────────────────────────────────────────────────────
  fastify.get('/vendor/:vendorId', async (request, reply) => {
    try {
      const { vendorId } = request.params;
      const { category, sortBy = 'created_at', sortOrder = 'DESC', page = 1, limit = 20 } = request.query;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      let whereClause = "p.vendor_id = $1 AND (p.status IN ('published') OR p.status = 'active' OR p.status IS NULL)";
      const params = [vendorId];
      let paramIndex = 2;
      if (category) { whereClause += ` AND p.category = $${paramIndex}`; params.push(category); paramIndex++; }

      const validSortFields = ['price', 'created_at', 'name', 'stock'];
      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      params.push(limitNum, offset);
      const query = `SELECT p.*, v.business_name as vendor_name, COALESCE(v.location,'Location not specified') as vendor_location, v.description as vendor_description, v.phone as vendor_phone, json_agg(json_build_object('id',pi.id,'image_url',pi.image_url,'is_primary',pi.is_primary,'display_order',pi.display_order) ORDER BY pi.display_order) FILTER (WHERE pi.id IS NOT NULL) as images FROM products p LEFT JOIN vendors v ON p.vendor_id = v.id LEFT JOIN product_images pi ON p.id = pi.product_id WHERE ${whereClause} GROUP BY p.id, v.business_name, v.location, v.description, v.phone ORDER BY p.${finalSortBy} ${finalSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

      const result = await pool.query(query, params);
      const vendorResult = await pool.query('SELECT v.id, v.business_name, v.location, v.description, v.phone, u.email as vendor_email, COUNT(p.id) as total_products, COALESCE(AVG(p.price),0) as average_price FROM vendors v JOIN users u ON v.user_id = u.id LEFT JOIN products p ON v.id = p.vendor_id AND p.status = \'active\' WHERE v.id = $1 GROUP BY v.id, v.business_name, v.location, v.description, v.phone, u.email', [vendorId]);
      const countResult = await pool.query(`SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`, category ? [vendorId, category] : [vendorId]);
      const totalProducts = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalProducts / limitNum);

      return reply.send({ products: result.rows, vendor: vendorResult.rows[0], pagination: { current_page: pageNum, total_pages: totalPages, total_products: totalProducts, per_page: limitNum, has_next: pageNum < totalPages, has_prev: pageNum > 1 }, success: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to fetch vendor products', code: 'VENDOR_PRODUCTS_ERROR' });
    }
  });

  // ── Product detail ─────────────────────────────────────────────────────────
  fastify.get('/:id', async (request, reply) => {
    try {
      const productId = parseInt(request.params.id);
      if (!productId || productId <= 0) return reply.code(400).send({ error: 'Invalid product ID', code: 'INVALID_PRODUCT_ID' });

      const cacheKey = `products:detail:${productId}`;
      const cached = await cache.get(cacheKey);
      if (cached) return reply.send(cached);

      if (!pool.dbConnected) {
        return reply.send({ product: { id: productId, name: `Demo Product ${productId}`, price: 150 + productId * 25, description: `Demo description for product ${productId}`, category: 'Electronics', image_url: '/api/placeholder/400/300', created_at: new Date().toISOString(), vendor_name: 'Demo Vendor', vendor_location: 'Lagos', average_rating: 4.2, review_count: 15, specifications: {}, price_history: [], reviews: [], similar_products: [] }, success: true });
      }

      const productResult = await pool.query(`SELECT p.id, p.name, p.price, p.description, p.category, p.image_url, p.created_at, p.specifications, v.business_name as vendor_name, v.location as vendor_location, v.phone as vendor_phone, v.description as vendor_description, u.email as vendor_email, COALESCE(AVG(r.rating),0) as average_rating, COUNT(r.id) as review_count FROM products p JOIN vendors v ON p.vendor_id = v.id JOIN users u ON v.user_id = u.id LEFT JOIN reviews r ON p.id = r.product_id WHERE p.id = $1 GROUP BY p.id, v.business_name, v.location, v.phone, v.description, u.email`, [productId]);
      if (productResult.rows.length === 0) return reply.code(404).send({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });

      const product = productResult.rows[0];
      const reviewsResult = await pool.query(`SELECT r.id, r.rating, r.comment, r.created_at, s.name as user_name, CASE WHEN r.verified_purchase THEN true ELSE false END as verified_purchase FROM reviews r JOIN shoppers s ON r.shopper_id = s.id WHERE r.product_id = $1 ORDER BY r.created_at DESC LIMIT 10`, [productId]);
      const similarResult = await pool.query('SELECT id, name, price, image_url FROM products WHERE category = $1 AND id != $2 ORDER BY RANDOM() LIMIT 4', [product.category, productId]);
      const priceHistory = [{ date: '2024-01-01', price: parseFloat(product.price) + 30 }, { date: '2024-01-15', price: parseFloat(product.price) + 20 }, { date: '2024-02-01', price: parseFloat(product.price) + 10 }, { date: '2024-02-15', price: parseFloat(product.price) }];

      const detailPayload = { product: { ...product, specifications: product.specifications || {}, price_history: priceHistory, reviews: reviewsResult.rows, similar_products: similarResult.rows }, success: true };
      await cache.set(cacheKey, detailPayload, 120);
      return reply.send(detailPayload);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to fetch product details', code: 'FETCH_PRODUCT_DETAILS_FAILED' });
    }
  });

  // ── Compare ────────────────────────────────────────────────────────────────
  fastify.post('/compare', async (request, reply) => {
    try {
      const { productIds } = request.body || {};
      if (!productIds || !Array.isArray(productIds) || productIds.length < 2 || productIds.length > 4)
        return reply.code(400).send({ error: 'Please provide 2-4 product IDs for comparison', code: 'INVALID_COMPARISON_REQUEST' });
      const validIds = productIds.filter(id => Number.isInteger(id) && id > 0);
      if (validIds.length !== productIds.length) return reply.code(400).send({ error: 'All product IDs must be valid integers', code: 'INVALID_PRODUCT_IDS' });

      if (!pool.dbConnected) {
        const mockComparison = validIds.map(id => ({ id, name: `Demo Product ${id}`, price: 150 + id * 25, category: 'Electronics', vendor_name: `Demo Vendor ${id}`, vendor_location: 'Lagos', average_rating: 4.0, review_count: 10, specifications: {} }));
        const prices = mockComparison.map(p => p.price);
        return reply.send({ comparison: mockComparison, analysis: { price_range: { min: Math.min(...prices), max: Math.max(...prices), average: prices.reduce((a, b) => a + b, 0) / prices.length }, best_rated: mockComparison[0], most_affordable: mockComparison.reduce((c, p) => p.price < c.price ? p : c) }, success: true });
      }

      const placeholders = validIds.map((_, i) => `$${i + 1}`).join(',');
      const result = await pool.query(`SELECT p.id, p.name, p.price, p.description, p.category, p.image_url, p.specifications, v.business_name as vendor_name, v.location as vendor_location, COALESCE(AVG(r.rating),0) as average_rating, COUNT(r.id) as review_count FROM products p JOIN vendors v ON p.vendor_id = v.id LEFT JOIN reviews r ON p.id = r.product_id WHERE p.id IN (${placeholders}) GROUP BY p.id, v.business_name, v.location ORDER BY p.price ASC`, validIds);
      if (result.rows.length === 0) return reply.code(404).send({ error: 'No products found for comparison', code: 'NO_PRODUCTS_FOUND' });

      const products = result.rows;
      const prices = products.map(p => parseFloat(p.price));
      return reply.send({ comparison: products, analysis: { price_range: { min: Math.min(...prices), max: Math.max(...prices), average: prices.reduce((a, b) => a + b, 0) / prices.length }, best_rated: products.reduce((b, c) => parseFloat(c.average_rating) > parseFloat(b.average_rating) ? c : b), most_affordable: products.reduce((c, p) => parseFloat(p.price) < parseFloat(c.price) ? p : c) }, success: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to compare products', code: 'COMPARISON_FAILED' });
    }
  });
}

module.exports = productsRoutes;
