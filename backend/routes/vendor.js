'use strict';

const { pool } = require('../utils');
const xss = require('xss');
const { processMultipartImages, enqueueImageUploads, deleteImages } = require('../middleware/upload');
const { onProductMutated, onSaleRecorded } = require('../utils/aiHooks');
const cache = require('../utils/cache');

const sanitize = (v) => (typeof v === 'string' ? xss(v.trim()) : v);

const IMG_SQL =
  "SELECT p.*, json_agg(json_build_object(" +
  "'id',pi.id,'image_url',pi.image_url,'is_primary',pi.is_primary,'display_order',pi.display_order" +
  ") ORDER BY pi.display_order) FILTER (WHERE pi.id IS NOT NULL) as images " +
  "FROM products p LEFT JOIN product_images pi ON p.id = pi.product_id " +
  "WHERE p.id = $1 GROUP BY p.id";

async function getProductWithImages(productId) {
  const r = await pool.query(IMG_SQL, [productId]);
  return r.rows[0];
}

async function authenticateVendor(request, reply) {
  if (!pool.dbConnected) {
    if (!request.user || request.user.userType !== 'vendor')
      return reply.code(403).send({ error: 'Access denied. Vendor account required.', code: 'NOT_VENDOR_DEMO' });
    request.vendorId = request.user.userId || 1;
    return;
  }
  if (!request.user?.userId)
    return reply.code(401).send({ error: 'Authentication required.', code: 'NO_TOKEN' });
  const uc = await pool.query('SELECT user_type FROM users WHERE id = $1', [request.user.userId]);
  if (uc.rows.length === 0 || uc.rows[0].user_type !== 'vendor')
    return reply.code(403).send({ error: 'Access denied. Vendor account required.', code: 'NOT_VENDOR' });
  const vr = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [request.user.userId]);
  if (vr.rows.length === 0)
    return reply.code(404).send({ error: 'Vendor profile not found.', code: 'VENDOR_NOT_FOUND' });
  request.vendorId = vr.rows[0].id;
}

async function vendorRoutes(fastify) {
  const auth = [fastify.authenticate, authenticateVendor];

  // ── POST /vendor/products ──────────────────────────────────────────────────
  fastify.post('/vendor/products', { preHandler: auth }, async (request, reply) => {
    let imgs = [];
    try {
      imgs = await processMultipartImages(request);
      const b = request.body || {};
      const { name, price, description, category, specifications, stock_quantity, state, city } = b;
      if (!name || !price || !category)
        return reply.code(400).send({ error: 'Required fields: name, price, category', code: 'MISSING_REQUIRED_FIELDS' });
      const sName = sanitize(name), sDesc = sanitize(description || ''), sCat = sanitize(category);
      const numPrice = parseFloat(price), numStock = parseInt(stock_quantity) || 0;
      const sState = state ? sanitize(state) : null, sCity = city ? sanitize(city) : null;
      if (sName.length < 2 || sName.length > 200)
        return reply.code(400).send({ error: 'Product name must be between 2 and 200 characters', code: 'INVALID_NAME_LENGTH' });
      if (isNaN(numPrice) || numPrice <= 0 || numPrice > 10000000)
        return reply.code(400).send({ error: 'Price must be between N1 and N10,000,000', code: 'INVALID_PRICE_RANGE' });
      if (!pool.dbConnected)
        return reply.code(201).send({ message: 'Product added (demo mode)', product: { id: Date.now(), name: sName, price: numPrice, description: sDesc, category: sCat, vendor_id: request.vendorId, stock_quantity: numStock, images: [], created_at: new Date().toISOString() } });
      let pr;
      try {
        pr = await pool.query(
          'INSERT INTO products (name,price,description,category,specifications,vendor_id,stock_quantity,status,sku,state,city,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW()) RETURNING *',
          [sName, numPrice, sDesc, sCat, specifications || null, request.vendorId, numStock, 'draft', null, sState, sCity]
        );
      } catch (_) {
        pr = await pool.query(
          'INSERT INTO products (name,price,description,category,specifications,vendor_id,stock_quantity,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING *',
          [sName, numPrice, sDesc, sCat, specifications || null, request.vendorId, numStock]
        );
      }
      const product = pr.rows[0];
      const jobItems = [];
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        const url = String(img.original).startsWith('http') ? img.original : '/uploads/products/' + img.original;
        const ir = await pool.query(
          'INSERT INTO product_images (product_id,image_url,is_primary,display_order) VALUES ($1,$2,$3,$4) RETURNING id',
          [product.id, url, i === 0, i]
        );
        jobItems.push({ imageId: ir.rows[0].id, localFilePath: img.localFilePath, localThumbPath: img.localThumbPath });
      }
      enqueueImageUploads(jobItems, product.id).catch(() => {});
      const pwi = await getProductWithImages(product.id);
      cache.bustProductCache(request.vendorId).catch(() => {});
      try { onProductMutated({ productId: product.id, vendorId: request.vendorId, action: 'created', after: { price: numPrice } }); } catch (_) {}
      return reply.code(201).send({ message: 'Product added successfully!', product: pwi });
    } catch (err) {
      if (imgs.length) await deleteImages(imgs.map(i => i.original));
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to add product.', code: 'ADD_PRODUCT_FAILED' });
    }
  });

  // ── GET /vendor/products ───────────────────────────────────────────────────
  fastify.get('/vendor/products', { preHandler: auth }, async (request, reply) => {
    try {
      if (!pool.dbConnected)
        return reply.send({ products: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 20 } });
      const { page = 1, limit = 20, category, search, state, city, status = 'all', sort_by = 'created_at', sort_order = 'desc' } = request.query;
      const np = Math.max(1, parseInt(page)), nl = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (np - 1) * nl;
      const vsb = ['created_at', 'name', 'price', 'stock_quantity'].includes(sort_by) ? sort_by : 'created_at';
      const vso = sort_order === 'asc' ? 'asc' : 'desc';
      let wc = 'WHERE p.vendor_id = $1';
      const params = [request.vendorId];
      let pi = 2;
      if (status !== 'all' && ['draft', 'published', 'archived'].includes(status)) { wc += ' AND p.status = $' + pi; params.push(status); pi++; }
      if (category) { wc += ' AND p.category ILIKE $' + pi; params.push('%' + category + '%'); pi++; }
      if (search) { wc += ' AND p.name ILIKE $' + pi; params.push('%' + search + '%'); pi++; }
      if (state) { wc += ' AND p.state ILIKE $' + pi; params.push('%' + state + '%'); pi++; }
      if (city) { wc += ' AND p.city ILIKE $' + pi; params.push('%' + city + '%'); pi++; }
      params.push(nl, offset);
      const imgAgg = "json_agg(json_build_object('id',pi.id,'image_url',pi.image_url,'is_primary',pi.is_primary,'display_order',pi.display_order) ORDER BY pi.display_order) FILTER (WHERE pi.id IS NOT NULL) as images";
      const qt = 'SELECT p.*, ' + imgAgg + ' FROM products p LEFT JOIN product_images pi ON p.id = pi.product_id ' + wc + ' GROUP BY p.id ORDER BY p.' + vsb + ' ' + vso + ' LIMIT $' + pi + ' OFFSET $' + (pi + 1);
      const result = await pool.query(qt, params);
      const cr = await pool.query('SELECT COUNT(*) FROM products p ' + wc, params.slice(0, -2));
      const total = parseInt(cr.rows[0].count);
      return reply.send({ products: result.rows, pagination: { currentPage: np, totalPages: Math.ceil(total / nl), totalItems: total, itemsPerPage: nl } });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to fetch products', code: 'FETCH_PRODUCTS_FAILED', details: err.message });
    }
  });

  // ── GET /vendor/products/:id ───────────────────────────────────────────────
  fastify.get('/vendor/products/:id', { preHandler: auth }, async (request, reply) => {
    try {
      const product = await getProductWithImages(request.params.id);
      if (!product || product.vendor_id !== request.vendorId)
        return reply.code(404).send({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
      return reply.send({ product });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to fetch product', code: 'FETCH_PRODUCT_FAILED' });
    }
  });

  // ── PUT /vendor/products/:id ───────────────────────────────────────────────
  fastify.put('/vendor/products/:id', { preHandler: auth }, async (request, reply) => {
    let imgs = [];
    try {
      imgs = await processMultipartImages(request);
      const { id } = request.params;
      const b = request.body || {};
      const { name, price, description, category, specifications, stock_quantity, status, sku, state, city } = b;
      if (!name || !price || !category)
        return reply.code(400).send({ error: 'Required fields: name, price, category', code: 'MISSING_REQUIRED_FIELDS' });
      const sName = sanitize(name), sDesc = sanitize(description || ''), sCat = sanitize(category), sSku = sanitize(sku || '');
      const numPrice = parseFloat(price), numStock = parseInt(stock_quantity) || 0, pStatus = status || 'active';
      const sState = state ? sanitize(state) : null, sCity = city ? sanitize(city) : null;
      if (sName.length < 2 || sName.length > 200)
        return reply.code(400).send({ error: 'Product name must be between 2 and 200 characters', code: 'INVALID_NAME_LENGTH' });
      if (isNaN(numPrice) || numPrice <= 0 || numPrice > 10000000)
        return reply.code(400).send({ error: 'Price must be between N1 and N10,000,000', code: 'INVALID_PRICE_RANGE' });
      const pc = await pool.query('SELECT id, price FROM products WHERE id = $1 AND vendor_id = $2', [id, request.vendorId]);
      if (pc.rows.length === 0)
        return reply.code(404).send({ error: 'Product not found or you do not have permission to edit it.', code: 'PRODUCT_NOT_FOUND' });
      let result;
      try {
        result = await pool.query(
          'UPDATE products SET name=$1,price=$2,description=$3,category=$4,specifications=$5,stock_quantity=$6,status=$7,sku=$8,state=$9,city=$10,updated_at=NOW() WHERE id=$11 AND vendor_id=$12 RETURNING *',
          [sName, numPrice, sDesc, sCat, specifications || null, numStock, pStatus, sSku, sState, sCity, id, request.vendorId]
        );
      } catch (_) {
        result = await pool.query(
          'UPDATE products SET name=$1,price=$2,description=$3,category=$4,specifications=$5,stock_quantity=$6,status=$7,sku=$8,updated_at=NOW() WHERE id=$9 AND vendor_id=$10 RETURNING *',
          [sName, numPrice, sDesc, sCat, specifications || null, numStock, pStatus, sSku, id, request.vendorId]
        );
      }
      if (result.rows.length === 0)
        return reply.code(404).send({ error: 'Product not found or you do not have permission to edit it.', code: 'UPDATE_FAILED' });
      if (imgs.length > 0) {
        await pool.query('DELETE FROM product_images WHERE product_id = $1', [id]);
        const jobItems = [];
        for (let i = 0; i < imgs.length; i++) {
          const img = imgs[i];
          const url = String(img.original).startsWith('http') ? img.original : '/uploads/products/' + img.original;
          const ir = await pool.query('INSERT INTO product_images (product_id,image_url,is_primary,display_order) VALUES ($1,$2,$3,$4) RETURNING id', [id, url, i === 0, i]);
          jobItems.push({ imageId: ir.rows[0].id, localFilePath: img.localFilePath, localThumbPath: img.localThumbPath });
        }
        enqueueImageUploads(jobItems, id).catch(() => {});
      }
      const pwi = await getProductWithImages(id);
      cache.bustProductCache(request.vendorId).catch(() => {});
      cache.bustProductDetail(id).catch(() => {});
      try { onProductMutated({ productId: Number(id), vendorId: request.vendorId, action: 'updated', before: { price: pc.rows[0]?.price }, after: { price: numPrice } }); } catch (_) {}
      return reply.send({ message: 'Product updated successfully!', product: pwi });
    } catch (err) {
      if (imgs.length) await deleteImages(imgs.map(i => i.original));
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to update product.', code: 'UPDATE_PRODUCT_FAILED' });
    }
  });

  // ── PATCH /vendor/products/:id/status ─────────────────────────────────────
  fastify.patch('/vendor/products/:id/status', { preHandler: auth }, async (request, reply) => {
    try {
      const { id } = request.params;
      let { status } = request.body || {};
      if (status === 'active') status = 'published';
      if (status === 'inactive') status = 'draft';
      if (!status || !['draft', 'published', 'archived'].includes(status))
        return reply.code(400).send({ error: 'Status must be one of: draft, published, archived', code: 'INVALID_STATUS' });
      const pc = await pool.query('SELECT id, name FROM products WHERE id = $1 AND vendor_id = $2', [id, request.vendorId]);
      if (pc.rows.length === 0)
        return reply.code(404).send({ error: 'Product not found.', code: 'PRODUCT_NOT_FOUND' });
      if (status === 'published') {
        const chk = await pool.query(
          'SELECT p.name, p.price, p.category, EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id) AS has_image FROM products p WHERE p.id = $1',
          [id]
        );
        const row = chk.rows[0];
        if (!row || !row.name || !row.price || !row.category || !row.has_image)
          return reply.code(400).send({ error: 'Please provide name, price, category and at least one image before publishing.', code: 'PUBLISH_VALIDATION_FAILED' });
      }
      const result = await pool.query(
        'UPDATE products SET status=$1, updated_at=NOW() WHERE id=$2 AND vendor_id=$3 RETURNING id, name, status',
        [status, id, request.vendorId]
      );
      if (result.rows.length === 0)
        return reply.code(404).send({ error: 'Failed to update product status.', code: 'UPDATE_FAILED' });
      const action = status === 'published' ? 'published' : status === 'draft' ? 'unpublished' : 'archived';
      cache.bustProductCache(request.vendorId).catch(() => {});
      cache.bustProductDetail(id).catch(() => {});
      try { onProductMutated({ productId: Number(id), vendorId: request.vendorId, action: 'status_' + action }); } catch (_) {}
      return reply.send({ message: 'Product ' + action + ' successfully!', product: result.rows[0] });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to update product status.', code: 'UPDATE_STATUS_FAILED' });
    }
  });

  // ── DELETE /vendor/products/:id ────────────────────────────────────────────
  fastify.delete('/vendor/products/:id', { preHandler: auth }, async (request, reply) => {
    try {
      const result = await pool.query('DELETE FROM products WHERE id = $1 AND vendor_id = $2 RETURNING id', [request.params.id, request.vendorId]);
      if (result.rows.length === 0)
        return reply.code(404).send({ error: 'Product not found or you do not have permission to delete it.' });
      cache.bustProductCache(request.vendorId).catch(() => {});
      cache.bustProductDetail(request.params.id).catch(() => {});
      return reply.send({ success: true, message: 'Product deleted successfully.' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to delete product' });
    }
  });

  // ── POST /vendor/products/bulk ─────────────────────────────────────────────
  fastify.post('/vendor/products/bulk', { preHandler: auth }, async (request, reply) => {
    try {
      const { action, productIds } = request.body || {};
      if (!action || !['activate', 'deactivate', 'delete'].includes(action))
        return reply.code(400).send({ error: 'Action must be one of: activate, deactivate, delete', code: 'INVALID_ACTION' });
      if (!Array.isArray(productIds) || productIds.length === 0)
        return reply.code(400).send({ error: 'Product IDs must be a non-empty array', code: 'INVALID_PRODUCT_IDS' });
      const validIds = productIds.filter(id => Number.isInteger(Number(id)));
      if (validIds.length !== productIds.length)
        return reply.code(400).send({ error: 'All product IDs must be valid integers', code: 'INVALID_ID_FORMAT' });
      const ph = validIds.map((_, i) => '$' + (i + 2)).join(', ');
      let result, message;
      if (action === 'activate' || action === 'deactivate') {
        const ns = action === 'activate' ? 'active' : 'inactive';
        result = await pool.query('UPDATE products SET status=$1, updated_at=NOW() WHERE id IN (' + ph + ') AND vendor_id=$' + (validIds.length + 2) + ' RETURNING id, name, status', [ns, ...validIds, request.vendorId]);
        message = result.rows.length + ' products ' + action + 'd successfully!';
      } else {
        result = await pool.query('DELETE FROM products WHERE id IN (' + ph + ') AND vendor_id=$' + (validIds.length + 2) + ' RETURNING id', [...validIds, request.vendorId]);
        message = result.rows.length + ' products deleted successfully!';
      }
      if (result.rows.length === 0)
        return reply.code(404).send({ error: 'No products found or you do not have permission to modify them.', code: 'NO_PRODUCTS_MODIFIED' });
      cache.bustProductCache(request.vendorId).catch(() => {});
      try { for (const r of result.rows) onProductMutated({ productId: Number(r.id), vendorId: request.vendorId, action: 'bulk_' + action }); } catch (_) {}
      return reply.send({ message, affected_count: result.rows.length, products: result.rows });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to perform bulk operation.', code: 'BULK_OPERATION_FAILED' });
    }
  });

  // ── POST /vendor/products/bulk-edit ───────────────────────────────────────
  fastify.post('/vendor/products/bulk-edit', { preHandler: auth }, async (request, reply) => {
    try {
      const { productIds, setPrice, incPricePct, decPricePct, setStock } = request.body || {};
      if (!Array.isArray(productIds) || productIds.length === 0)
        return reply.code(400).send({ error: 'productIds must be a non-empty array', code: 'INVALID_PRODUCT_IDS' });
      const ids = productIds.map(Number).filter(n => Number.isFinite(n));
      if (ids.length !== productIds.length)
        return reply.code(400).send({ error: 'All product IDs must be numbers', code: 'INVALID_ID_FORMAT' });
      const ph = ids.map((_, i) => '$' + (i + 2)).join(', ');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        if (setPrice != null) { const p = Number(setPrice); if (!Number.isFinite(p) || p <= 0) throw new Error('Invalid setPrice'); await client.query('UPDATE products SET price=$1, updated_at=NOW() WHERE id IN (' + ph + ') AND vendor_id=$' + (ids.length + 2), [p, ...ids, request.vendorId]); }
        if (incPricePct != null) { const p = Number(incPricePct); if (!Number.isFinite(p)) throw new Error('Invalid incPricePct'); await client.query('UPDATE products SET price=ROUND(price*(1+$1/100.0),2), updated_at=NOW() WHERE id IN (' + ph + ') AND vendor_id=$' + (ids.length + 2), [p, ...ids, request.vendorId]); }
        if (decPricePct != null) { const p = Number(decPricePct); if (!Number.isFinite(p)) throw new Error('Invalid decPricePct'); await client.query('UPDATE products SET price=ROUND(price*(1-$1/100.0),2), updated_at=NOW() WHERE id IN (' + ph + ') AND vendor_id=$' + (ids.length + 2), [p, ...ids, request.vendorId]); }
        if (setStock != null) { const s = Number(setStock); if (!Number.isInteger(s) || s < 0) throw new Error('Invalid setStock'); await client.query('UPDATE products SET stock_quantity=$1, updated_at=NOW() WHERE id IN (' + ph + ') AND vendor_id=$' + (ids.length + 2), [s, ...ids, request.vendorId]); }
        await client.query('COMMIT');
        cache.bustProductCache(request.vendorId).catch(() => {});
        return reply.send({ ok: true, affected_ids: ids });
      } catch (e) { await client.query('ROLLBACK'); throw e; }
      finally { client.release(); }
    } catch (err) {
      fastify.log.error(err);
      return reply.code(400).send({ error: 'Failed to bulk edit products', details: err.message });
    }
  });

  // ── POST /vendor/sales ───────────────────────────────────────────────────────
  fastify.post('/vendor/sales', { preHandler: auth }, async (request, reply) => {
    try {
      const b = request.body || {};
      const { product_id, product_name, quantity, total_amount, report_date, notes } = b;
      if (!quantity || !total_amount)
        return reply.code(400).send({ error: 'Required fields: quantity, total_amount', code: 'MISSING_REQUIRED_FIELDS' });
      const numQty = parseInt(quantity), numTotal = parseFloat(total_amount);
      if (!Number.isInteger(numQty) || numQty < 1)
        return reply.code(400).send({ error: 'Quantity must be a positive integer', code: 'INVALID_QUANTITY' });
      if (!Number.isFinite(numTotal) || numTotal <= 0)
        return reply.code(400).send({ error: 'Total amount must be a positive number', code: 'INVALID_TOTAL_AMOUNT' });
      const sProductName = product_name ? sanitize(product_name) : null;
      const sNotes = notes ? sanitize(notes) : null;
      const sReportDate = report_date ? sanitize(report_date) : null;
      let pid = product_id ? Number(product_id) : null;
      if (pid) {
        const pr = await pool.query('SELECT id, name FROM products WHERE id = $1 AND vendor_id = $2', [pid, request.vendorId]);
        if (pr.rows.length === 0)
          return reply.code(404).send({ error: 'Product not found or you do not have permission.', code: 'PRODUCT_NOT_FOUND' });
        if (!sProductName) sProductName = pr.rows[0].name;
      }
      if (!pool.dbConnected) {
        return reply.code(201).send({ message: 'Sales report saved (demo mode)', sales_report: { id: Date.now(), vendor_id: request.vendorId, product_id: pid, product_name: sProductName, quantity: numQty, total_amount: numTotal, report_date: sReportDate || new Date().toISOString().split('T')[0], notes: sNotes, created_at: new Date().toISOString() } });
      }
      const result = await pool.query(
        `INSERT INTO sales_reports (vendor_id, product_id, product_name, quantity, total_amount, report_date, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [request.vendorId, pid, sProductName, numQty, numTotal, sReportDate, sNotes]
      );
      const salesReport = result.rows[0];
      cache.bustSalesCache(request.vendorId).catch(() => {});
      try { onSaleRecorded({ vendorId: request.vendorId, productId: pid, quantity: numQty, totalAmount: numTotal }); } catch (_) {}
      return reply.code(201).send({ message: 'Sales report submitted successfully!', sales_report: salesReport });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to submit sales report.', code: 'SUBMIT_SALES_FAILED' });
    }
  });

  // ── GET /vendor/sales ─────────────────────────────────────────────────────────
  fastify.get('/vendor/sales', { preHandler: auth }, async (request, reply) => {
    try {
      if (!pool.dbConnected)
        return reply.send({ sales_reports: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 20 } });
      const { page = 1, limit = 20, start_date, end_date, product_id, product_name } = request.query;
      const np = Math.max(1, parseInt(page)), nl = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (np - 1) * nl;
      let wc = 'WHERE sr.vendor_id = $1';
      const params = [request.vendorId];
      let pi = 2;
      if (start_date) { wc += ' AND sr.report_date >= $' + pi; params.push(start_date); pi++; }
      if (end_date) { wc += ' AND sr.report_date <= $' + pi; params.push(end_date); pi++; }
      if (product_id) { wc += ' AND sr.product_id = $' + pi; params.push(Number(product_id)); pi++; }
      if (product_name) { wc += ' AND sr.product_name ILIKE $' + pi; params.push('%' + product_name + '%'); pi++; }
      params.push(nl, offset);
      const qt = `
        SELECT sr.*, p.name as product_name_from_product
        FROM sales_reports sr
        LEFT JOIN products p ON sr.product_id = p.id
        ${wc}
        ORDER BY sr.created_at DESC
        LIMIT $${pi} OFFSET $${pi + 1}
      `;
      const result = await pool.query(qt, params);
      const cr = await pool.query('SELECT COUNT(*) FROM sales_reports sr ' + wc, params.slice(0, -2));
      const total = parseInt(cr.rows[0].count);
      const rows = result.rows.map(r => ({
        ...r,
        product_name: r.product_name_from_product || r.product_name
      }));
      return reply.send({ sales_reports: rows, pagination: { currentPage: np, totalPages: Math.ceil(total / nl), totalItems: total, itemsPerPage: nl } });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to fetch sales reports', code: 'FETCH_SALES_FAILED', details: err.message });
    }
  });

  // ── GET /vendor/analytics ─────────────────────────────────────────────────────
  fastify.get('/vendor/analytics', { preHandler: auth }, async (request, reply) => {
    try {
      if (!pool.dbConnected)
        return reply.send({
          period: 'demo',
          total_revenue: 0,
          total_orders: 0,
          average_order_value: 0,
          top_products: [],
          sales_trend: []
        });
      const { period = 'last_30_days', start_date, end_date, group_by = 'day' } = request.query;
      let dateCondition, params = [request.vendorId];
      let pi = 2;
      switch (period) {
        case 'last_7_days':
          dateCondition = 'sr.report_date >= CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case 'last_30_days':
          dateCondition = 'sr.report_date >= CURRENT_DATE - INTERVAL \'30 days\'';
          break;
        case 'last_90_days':
          dateCondition = 'sr.report_date >= CURRENT_DATE - INTERVAL \'90 days\'';
          break;
        case 'custom':
          if (!start_date) return reply.code(400).send({ error: 'start_date required for custom period', code: 'MISSING_START_DATE' });
          dateCondition = 'sr.report_date >= $' + pi;
          params.push(start_date);
          pi++;
          if (end_date) { dateCondition += ' AND sr.report_date <= $' + pi; params.push(end_date); pi++; }
          break;
        default:
          dateCondition = 'sr.report_date >= CURRENT_DATE - INTERVAL \'30 days\'';
      }
      const totalQuery = `
        SELECT
          COUNT(*) as order_count,
          COALESCE(SUM(sr.quantity), 0) as total_quantity,
          COALESCE(SUM(sr.total_amount), 0) as total_revenue
        FROM sales_reports sr
        WHERE sr.vendor_id = $1 AND ${dateCondition}
      `;
      const [totalRes, topRes, trendRes] = await Promise.all([
        pool.query(totalQuery, params),
        pool.query(`
          SELECT p.name, SUM(sr.quantity) as quantity, SUM(sr.total_amount) as revenue
          FROM sales_reports sr
          JOIN products p ON sr.product_id = p.id
          WHERE sr.vendor_id = $1 AND ${dateCondition}
          GROUP BY p.id, p.name
          ORDER BY revenue DESC
          LIMIT 10
        `, params),
        pool.query(`
          SELECT
            DATE(sr.report_date) as date,
            SUM(sr.total_amount) as revenue,
            SUM(sr.quantity) as quantity
          FROM sales_reports sr
          WHERE sr.vendor_id = $1 AND ${dateCondition}
          GROUP BY DATE(sr.report_date)
          ORDER BY date ASC
        `, params)
      ]);
      const total = totalRes.rows[0];
      const aov = total.order_count > 0 ? total.total_revenue / total.order_count : 0;
      return reply.send({
        period,
        date_range: { start_date, end_date },
        total_revenue: parseFloat(total.total_revenue),
        total_orders: parseInt(total.order_count),
        total_quantity: parseInt(total.total_quantity),
        average_order_value: parseFloat(aov.toFixed(2)),
        top_products: topRes.rows.map(r => ({
          product_name: r.name,
          quantity: parseInt(r.quantity),
          revenue: parseFloat(r.revenue)
        })),
        sales_trend: trendRes.rows.map(r => ({
          date: r.date,
          revenue: parseFloat(r.revenue),
          quantity: parseInt(r.quantity)
        }))
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Unable to fetch analytics', code: 'FETCH_ANALYTICS_FAILED', details: err.message });
    }
  });
}

module.exports = vendorRoutes;