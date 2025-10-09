const express = require('express');
const { pool, authenticateToken } = require('../utils');
const xss = require('xss');
const { upload, processImages, deleteImages } = require('../middleware/upload');

const router = express.Router();

const sanitizeInput = (input) => (typeof input === 'string' ? xss(input.trim()) : input);

// Helper function to get product with images
const getProductWithImages = async (productId) => {
  const productResult = await pool.query(`
    SELECT p.*, 
           json_agg(
             json_build_object(
               'id', pi.id,
               'image_url', pi.image_url,
               'is_primary', pi.is_primary,
               'display_order', pi.display_order
             ) ORDER BY pi.display_order
           ) FILTER (WHERE pi.id IS NOT NULL) as images
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE p.id = $1
    GROUP BY p.id
  `, [productId]);
  
  return productResult.rows[0];
};

const authenticateVendor = async (req, res, next) => {
  try {
    console.log('🔍 authenticateVendor - req.user:', req.user);

    // DEMO MODE: Allow vendor based on token payload when DB is not connected
    if (!pool.dbConnected) {
      if (!req.user || req.user.userType !== 'vendor') {
        return res.status(403).json({ error: 'Access denied. Vendor account required.', code: 'NOT_VENDOR_DEMO' });
      }
      req.vendorId = req.user.userId || 1;
      console.log('✅ Demo mode vendor auth. vendorId:', req.vendorId);
      return next();
    }
    
    if (!req.user || !req.user.userId) {
      console.log('❌ No user or userId in request');
      return res.status(401).json({ error: 'Authentication required.', code: 'NO_TOKEN' });
    }
    
    console.log('🔍 Checking user type for userId:', req.user.userId);
    const userCheck = await pool.query('SELECT user_type FROM users WHERE id = $1', [req.user.userId]);
    console.log('🔍 User check result:', userCheck.rows);
    
    if (userCheck.rows.length === 0 || userCheck.rows[0].user_type !== 'vendor') {
      console.log('❌ User not found or not a vendor');
      return res.status(403).json({ error: 'Access denied. Vendor account required.', code: 'NOT_VENDOR' });
    }
    
    console.log('🔍 Looking up vendor profile for userId:', req.user.userId);
    const vendorResult = await pool.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.userId]);
    console.log('🔍 Vendor query result:', vendorResult.rows);
    
    if (vendorResult.rows.length === 0) {
      console.log('❌ Vendor profile not found for userId:', req.user.userId);
      return res.status(404).json({ error: 'Vendor profile not found.', code: 'VENDOR_NOT_FOUND' });
    }
    
    req.vendorId = vendorResult.rows[0].id;
    console.log('✅ Vendor authenticated. vendorId:', req.vendorId);
    next();
  } catch (error) {
    console.error('❌ Vendor authentication error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error during vendor authentication', code: 'VENDOR_AUTH_ERROR', details: error.message });
  }
};

// 🏪 CORE FEATURE: Vendor Product Management - Add Product with Images
router.post('/vendor/products', authenticateToken, authenticateVendor, upload, processImages, async (req, res) => {
  try {
    const { name, price, description, category, specifications, stock_quantity } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Required fields: name, price, category', code: 'MISSING_REQUIRED_FIELDS' });
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedDescription = sanitizeInput(description || '');
    const sanitizedCategory = sanitizeInput(category);
    const numericPrice = parseFloat(price);
    const numericStockQuantity = parseInt(stock_quantity) || 0;
    
    if (sanitizedName.length < 2 || sanitizedName.length > 200) {
      return res.status(400).json({ error: 'Product name must be between 2 and 200 characters', code: 'INVALID_NAME_LENGTH' });
    }
    
    if (isNaN(numericPrice) || numericPrice <= 0 || numericPrice > 10000000) {
      return res.status(400).json({ error: 'Price must be between ₦1 and ₦10,000,000', code: 'INVALID_PRICE_RANGE' });
    }

    // DEMO FALLBACK: If database is not connected, simulate success for development
    if (!pool.dbConnected) {
      const mockId = Date.now();
      const images = (req.processedImages || []).map((img, idx) => ({
        id: idx + 1,
        image_url: `/uploads/products/${img.original}`,
        is_primary: idx === 0,
        display_order: idx
      }));

      return res.status(201).json({
        message: 'Product added successfully! (demo mode)',
        product: {
          id: mockId,
          name: sanitizedName,
          price: numericPrice,
          description: sanitizedDescription,
          category: sanitizedCategory,
          specifications: specifications || null,
          vendor_id: req.vendorId,
          stock_quantity: numericStockQuantity,
          images,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    }
    
    // Insert product (attempt with status and sku; fallback if columns missing)
    let productResult;
    try {
      productResult = await pool.query(`
        INSERT INTO products (name, price, description, category, specifications, vendor_id, stock_quantity, status, sku, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `, [sanitizedName, numericPrice, sanitizedDescription, sanitizedCategory, specifications || null, req.vendorId, numericStockQuantity, 'active', null]);
    } catch (e) {
      console.warn('INSERT_WITH_STATUS_SKU_FAILED_FALLBACK:', e.code || e.message);
      productResult = await pool.query(`
        INSERT INTO products (name, price, description, category, specifications, vendor_id, stock_quantity, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [sanitizedName, numericPrice, sanitizedDescription, sanitizedCategory, specifications || null, req.vendorId, numericStockQuantity]);
    }
    
    const product = productResult.rows[0];
    
    // Handle image uploads
    if (req.processedImages && req.processedImages.length > 0) {
      for (let i = 0; i < req.processedImages.length; i++) {
        const image = req.processedImages[i];
        await pool.query(`
          INSERT INTO product_images (product_id, image_url, is_primary, display_order)
          VALUES ($1, $2, $3, $4)
        `, [
          product.id,
          `/uploads/products/${image.original}`,
          i === 0, // First image is primary
          i
        ]);
      }
    }
    
    // Get product with images
    const productWithImages = await getProductWithImages(product.id);
    
    console.log(`✅ Product added by vendor ${req.user.email}: ${sanitizedName} - ₦${numericPrice}`);
    
    res.status(201).json({
      message: 'Product added successfully!',
      product: productWithImages
    });
    
  } catch (err) {
    console.error('❌ Add product error:', err);
    console.error('❌ Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      detail: err.detail
    });
    
    // Clean up uploaded images on error
    if (req.processedImages) {
      const imageFilenames = req.processedImages.map(img => img.original);
      await deleteImages(imageFilenames);
    }
    
    const payload = { error: 'Unable to add product. Please try again.', code: 'ADD_PRODUCT_FAILED' };
    if (process.env.NODE_ENV !== 'production') {
      payload.details = err.message;
      payload.sqlError = err.code;
      payload.sqlDetail = err.detail;
      payload.dbConnected = !!pool.dbConnected;
    }
    res.status(500).json(payload);
  }
});

// 📊 CORE FEATURE: Get Vendor's Products with Images
router.get('/vendor/products', authenticateToken, authenticateVendor, async (req, res) => {
  try {
    console.log('📦 Fetching products for vendorId:', req.vendorId);
    
    const { page = 1, limit = 20, category, search, sort_by = 'created_at', sort_order = 'desc' } = req.query;

    const numericPage = Math.max(1, parseInt(page));
    const numericLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (numericPage - 1) * numericLimit;

    const allowedSortBy = ['created_at', 'name', 'price', 'stock_quantity'];
    const validSortBy = allowedSortBy.includes(sort_by) ? sort_by : 'created_at';
    const validSortOrder = sort_order === 'asc' ? 'asc' : 'desc';

    // Build WHERE clause and params array
    let whereClause = 'WHERE p.vendor_id = $1';
    const params = [req.vendorId];
    let paramIndex = 2;

    if (category) {
      whereClause += ` AND p.category ILIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND p.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add LIMIT and OFFSET parameters
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;
    params.push(numericLimit, offset);

    console.log('🔍 Query params:', { whereClause, params, limitParam, offsetParam });

    const queryText = `
      SELECT p.*,
             json_agg(
               json_build_object(
                 'id', pi.id,
                 'image_url', pi.image_url,
                 'is_primary', pi.is_primary,
                 'display_order', pi.display_order
               ) ORDER BY pi.display_order
             ) FILTER (WHERE pi.id IS NOT NULL) as images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.${validSortBy} ${validSortOrder}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    console.log('🔍 Executing query:', queryText);
    const result = await pool.query(queryText, params);
    console.log('✅ Query successful, found', result.rows.length, 'products');

    // Build count query
    let countQuery = `SELECT COUNT(*) FROM products p WHERE p.vendor_id = $1`;
    const countParams = [req.vendorId];
    let countParamIndex = 2;

    if (category) {
      countQuery += ` AND p.category ILIKE $${countParamIndex}`;
      countParams.push(`%${category}%`);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND p.name ILIKE $${countParamIndex}`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].count);

    console.log('✅ Total products count:', totalItems);

    res.json({
      products: result.rows,
      pagination: {
        currentPage: numericPage,
        totalPages: Math.ceil(totalItems / numericLimit),
        totalItems: totalItems,
        itemsPerPage: numericLimit
      }
    });

  } catch (err) {
    console.error('❌ Get vendor products error:', err);
    console.error('❌ Error details:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack
    });
    console.error(err);
    res.status(500).json({ 
      error: 'Unable to fetch products', 
      code: 'FETCH_PRODUCTS_FAILED',
      details: err.message 
    });
  }
});

// 📋 Get a single vendor product
router.get('/vendor/products/:id', authenticateToken, authenticateVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductWithImages(id);

    if (!product || product.vendor_id !== req.vendorId) {
      return res.status(404).json({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    }

    res.json({ product });
  } catch (err) {
    console.error('❌ Get vendor product error:', err);
    res.status(500).json({ error: 'Unable to fetch product', code: 'FETCH_PRODUCT_FAILED' });
  }
});

// ✏️ Update a vendor product
router.put('/vendor/products/:id', authenticateToken, authenticateVendor, upload, processImages, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category, specifications, stock_quantity, status, sku } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Required fields: name, price, category', code: 'MISSING_REQUIRED_FIELDS' });
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedDescription = sanitizeInput(description || '');
    const sanitizedCategory = sanitizeInput(category);
    const sanitizedSku = sanitizeInput(sku || '');
    const numericPrice = parseFloat(price);
    const numericStockQuantity = parseInt(stock_quantity) || 0;
    const productStatus = status || 'active';
    
    if (sanitizedName.length < 2 || sanitizedName.length > 200) {
      return res.status(400).json({ error: 'Product name must be between 2 and 200 characters', code: 'INVALID_NAME_LENGTH' });
    }
    
    if (isNaN(numericPrice) || numericPrice <= 0 || numericPrice > 10000000) {
      return res.status(400).json({ error: 'Price must be between ₦1 and ₦10,000,000', code: 'INVALID_PRICE_RANGE' });
    }

    // First, verify the product belongs to this vendor
    const productCheck = await pool.query('SELECT id FROM products WHERE id = $1 AND vendor_id = $2', [id, req.vendorId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or you do not have permission to edit it.', code: 'PRODUCT_NOT_FOUND' });
    }

    // Update product
    const result = await pool.query(
      `UPDATE products
       SET name = $1, price = $2, description = $3, category = $4, specifications = $5, 
           stock_quantity = $6, status = $7, sku = $8, updated_at = NOW()
       WHERE id = $9 AND vendor_id = $10
       RETURNING *`,
      [sanitizedName, numericPrice, sanitizedDescription, sanitizedCategory, 
       specifications || null, numericStockQuantity, productStatus, sanitizedSku, id, req.vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or you do not have permission to edit it.', code: 'UPDATE_FAILED' });
    }

    // Handle new image uploads if provided
    if (req.processedImages && req.processedImages.length > 0) {
      // Delete existing images for this product
      await pool.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      
      // Add new images
      for (let i = 0; i < req.processedImages.length; i++) {
        const image = req.processedImages[i];
        await pool.query(`
          INSERT INTO product_images (product_id, image_url, is_primary, display_order)
          VALUES ($1, $2, $3, $4)
        `, [
          id,
          `/uploads/products/${image.original}`,
          i === 0, // First image is primary
          i
        ]);
      }
    }
    
    // Get updated product with images
    const productWithImages = await getProductWithImages(id);
    
    console.log(`✅ Product updated by vendor ${req.user.email}: ${sanitizedName} - ₦${numericPrice}`);

    res.json({ message: 'Product updated successfully!', product: productWithImages });
  } catch (err) {
    console.error('❌ Update product error:', err);
    console.error('❌ Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      detail: err.detail
    });
    
    // Clean up uploaded images on error
    if (req.processedImages) {
      const imageFilenames = req.processedImages.map(img => img.original);
      await deleteImages(imageFilenames);
    }
    
    const payload = { error: 'Unable to update product. Please try again.', code: 'UPDATE_PRODUCT_FAILED' };
    if (process.env.NODE_ENV !== 'production') {
      payload.details = err.message;
      payload.sqlError = err.code;
      payload.sqlDetail = err.detail;
    }
    res.status(500).json(payload);
  }
});

// 🔄 Update product status (activate/deactivate)
router.patch('/vendor/products/:id/status', authenticateToken, authenticateVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status value
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status must be either "active" or "inactive"', 
        code: 'INVALID_STATUS' 
      });
    }

    // First, verify the product belongs to this vendor
    const productCheck = await pool.query('SELECT id, name FROM products WHERE id = $1 AND vendor_id = $2', [id, req.vendorId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Product not found or you do not have permission to modify it.', 
        code: 'PRODUCT_NOT_FOUND' 
      });
    }

    // Update product status
    const result = await pool.query(
      `UPDATE products 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND vendor_id = $3 
       RETURNING id, name, status`,
      [status, id, req.vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Failed to update product status.', 
        code: 'UPDATE_FAILED' 
      });
    }

    const updatedProduct = result.rows[0];
    const action = status === 'active' ? 'activated' : 'deactivated';
    
    console.log(`✅ Product ${action} by vendor ${req.user.email}: ${updatedProduct.name}`);

    res.json({ 
      message: `Product ${action} successfully!`, 
      product: updatedProduct 
    });
    
  } catch (err) {
    console.error('❌ Update product status error:', err);
    res.status(500).json({ 
      error: 'Unable to update product status. Please try again.', 
      code: 'UPDATE_STATUS_FAILED',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// 📊 Bulk operations on vendor products
router.post('/vendor/products/bulk', authenticateToken, authenticateVendor, async (req, res) => {
  try {
    const { action, productIds } = req.body;

    // Validate action
    if (!action || !['activate', 'deactivate', 'delete'].includes(action)) {
      return res.status(400).json({ 
        error: 'Action must be one of: activate, deactivate, delete', 
        code: 'INVALID_ACTION' 
      });
    }

    // Validate productIds
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ 
        error: 'Product IDs must be a non-empty array', 
        code: 'INVALID_PRODUCT_IDS' 
      });
    }

    // Validate that all IDs are integers
    const validIds = productIds.filter(id => Number.isInteger(Number(id)));
    if (validIds.length !== productIds.length) {
      return res.status(400).json({ 
        error: 'All product IDs must be valid integers', 
        code: 'INVALID_ID_FORMAT' 
      });
    }

    // Build the placeholders for the IN clause
    const placeholders = validIds.map((_, index) => `$${index + 2}`).join(', ');
    
    let result;
    let message;
    
    switch (action) {
      case 'activate':
      case 'deactivate':
        const newStatus = action === 'activate' ? 'active' : 'inactive';
        result = await pool.query(
          `UPDATE products 
           SET status = $1, updated_at = NOW() 
           WHERE id IN (${placeholders}) AND vendor_id = $${validIds.length + 2}
           RETURNING id, name, status`,
          [newStatus, ...validIds, req.vendorId]
        );
        message = `${result.rows.length} products ${action}d successfully!`;
        break;
        
      case 'delete':
        // First get the names for logging
        const productNames = await pool.query(
          `SELECT id, name FROM products WHERE id IN (${placeholders}) AND vendor_id = $${validIds.length + 2}`,
          [...validIds, req.vendorId]
        );
        
        result = await pool.query(
          `DELETE FROM products 
           WHERE id IN (${placeholders}) AND vendor_id = $${validIds.length + 2}
           RETURNING id`,
          [...validIds, req.vendorId]
        );
        message = `${result.rows.length} products deleted successfully!`;
        
        console.log(`✅ Bulk delete by vendor ${req.user.email}: ${productNames.rows.map(p => p.name).join(', ')}`);
        break;
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No products found or you do not have permission to modify them.', 
        code: 'NO_PRODUCTS_MODIFIED' 
      });
    }

    console.log(`✅ Bulk ${action} by vendor ${req.user.email}: ${result.rows.length} products affected`);

    res.json({ 
      message,
      affected_count: result.rows.length,
      products: result.rows 
    });
    
  } catch (err) {
    console.error(`❌ Bulk ${req.body.action || 'operation'} error:`, err);
    res.status(500).json({ 
      error: 'Unable to perform bulk operation. Please try again.', 
      code: 'BULK_OPERATION_FAILED',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
});

// 🗑️ Delete a vendor product
router.delete('/vendor/products/:id', authenticateToken, authenticateVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 AND vendor_id = $2 RETURNING id', [id, req.vendorId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or you do not have permission to delete it.' });
    }
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('❌ Delete product error:', err);
    res.status(500).json({ error: 'Unable to delete product' });
  }
});

// 📊 Submit sales report (vendors only)
router.post('/vendors/sales', authenticateToken, authenticateVendor, async (req, res) => {
  try {
    const { product_id, quantity, total_amount, report_date, notes } = req.body;

    if (!quantity || !total_amount) {
      return res.status(400).json({ error: 'Quantity and total_amount are required', code: 'MISSING_FIELDS' });
    }

    const numericQuantity = parseInt(quantity);
    const numericAmount = parseFloat(total_amount);

    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer', code: 'INVALID_QUANTITY' });
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Total amount must be a positive number', code: 'INVALID_AMOUNT' });
    }
    if (product_id && isNaN(parseInt(product_id))) {
      return res.status(400).json({ error: 'Product ID must be a valid number', code: 'INVALID_PRODUCT_ID' });
    }

    const result = await pool.query(
      `INSERT INTO sales_reports (vendor_id, product_id, quantity, total_amount, report_date, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [req.vendorId, product_id ? parseInt(product_id) : null, numericQuantity, numericAmount, report_date || new Date().toISOString().split('T')[0], notes || null]
    );

    res.status(201).json({ message: 'Sales report submitted successfully', report: result.rows[0] });
  } catch (error) {
    console.error('Error submitting sales report:', error);
    res.status(500).json({ error: 'Failed to submit sales report', code: 'SUBMISSION_ERROR' });
  }
});

// 📈 Get sales history for authenticated vendor
router.get('/vendors/sales', authenticateToken, authenticateVendor, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      start_date,
      end_date,
      product_search,
      min_amount,
      max_amount,
      min_quantity,
      max_quantity,
      sort_by = 'report_date',
      sort_order = 'desc'
    } = req.query;
    
    const numericPage = Math.max(1, parseInt(page));
    const numericLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (numericPage - 1) * numericLimit;

    const allowedSortBy = ['report_date', 'total_amount', 'quantity', 'created_at'];
    const validSortBy = allowedSortBy.includes(sort_by) ? sort_by : 'report_date';
    const validSortOrder = sort_order === 'asc' ? 'asc' : 'desc';

    let query = `
      SELECT sr.*, p.name as product_name
      FROM sales_reports sr
      LEFT JOIN products p ON sr.product_id = p.id
      WHERE sr.vendor_id = $1
    `;
    
    const params = [req.vendorId];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND sr.report_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    if (end_date) {
      query += ` AND sr.report_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (product_search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR sr.product_name ILIKE $${paramIndex})`;
      params.push(`%${product_search}%`);
      paramIndex++;
    }

    if (min_amount) {
      const minAmt = parseFloat(min_amount);
      if (!isNaN(minAmt)) {
        query += ` AND sr.total_amount >= $${paramIndex}`;
        params.push(minAmt);
        paramIndex++;
      }
    }
    if (max_amount) {
      const maxAmt = parseFloat(max_amount);
      if (!isNaN(maxAmt)) {
        query += ` AND sr.total_amount <= $${paramIndex}`;
        params.push(maxAmt);
        paramIndex++;
      }
    }

    if (min_quantity) {
      const minQty = parseInt(min_quantity);
      if (!isNaN(minQty)) {
        query += ` AND sr.quantity >= $${paramIndex}`;
        params.push(minQty);
        paramIndex++;
      }
    }
    if (max_quantity) {
      const maxQty = parseInt(max_quantity);
      if (!isNaN(maxQty)) {
        query += ` AND sr.quantity <= $${paramIndex}`;
        params.push(maxQty);
        paramIndex++;
      }
    }

    query += ` ORDER BY sr.${validSortBy} ${validSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(numericLimit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM sales_reports sr LEFT JOIN products p ON sr.product_id = p.id WHERE sr.vendor_id = $1';
    const countParams = [req.vendorId];
    paramIndex = 2;

    if (start_date) {
      countQuery += ` AND sr.report_date >= $${paramIndex}`;
      countParams.push(start_date);
      paramIndex++;
    }
    if (end_date) {
      countQuery += ` AND sr.report_date <= $${paramIndex}`;
      countParams.push(end_date);
      paramIndex++;
    }

    if (product_search) {
      countQuery += ` AND (p.name ILIKE $${paramIndex} OR sr.product_name ILIKE $${paramIndex})`;
      countParams.push(`%${product_search}%`);
      paramIndex++;
    }

    if (min_amount) {
      const minAmt = parseFloat(min_amount);
      if (!isNaN(minAmt)) {
        countQuery += ` AND sr.total_amount >= $${paramIndex}`;
        countParams.push(minAmt);
        paramIndex++;
      }
    }
    if (max_amount) {
      const maxAmt = parseFloat(max_amount);
      if (!isNaN(maxAmt)) {
        countQuery += ` AND sr.total_amount <= $${paramIndex}`;
        countParams.push(maxAmt);
        paramIndex++;
      }
    }

    if (min_quantity) {
      const minQty = parseInt(min_quantity);
      if (!isNaN(minQty)) {
        countQuery += ` AND sr.quantity >= $${paramIndex}`;
        countParams.push(minQty);
        paramIndex++;
      }
    }
    if (max_quantity) {
      const maxQty = parseInt(max_quantity);
      if (!isNaN(maxQty)) {
        countQuery += ` AND sr.quantity <= $${paramIndex}`;
        countParams.push(maxQty);
      }
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].count);

    res.json({
      sales: result.rows,
      pagination: {
        currentPage: numericPage,
        totalPages: Math.ceil(totalItems / numericLimit),
        totalItems: totalItems,
        itemsPerPage: numericLimit
      },
      filters: {
        applied: {
          start_date,
          end_date,
          product_search,
          min_amount,
          max_amount,
          min_quantity,
          max_quantity,
          sort_by: validSortBy,
          sort_order: validSortOrder
        }
      }
    });
  } catch (error) {
    console.error('Error fetching sales history:', error);
    res.status(500).json({ error: 'Failed to fetch sales history', code: 'FETCH_ERROR' });
  }
});

// 📊 CORE FEATURE: Get sales analytics for authenticated vendor
const analyticsHandler = async (req, res) => {
  try {
    console.log('📊 Analytics request - vendorId:', req.vendorId, 'period:', req.query.period);
    const { period = '30d' } = req.query;

    let days;
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
      default: days = 30;
    }
    
    console.log('📊 Fetching analytics for', days, 'days, vendorId:', req.vendorId);

    if (!pool.dbConnected) {
      return res.json({
        period,
        days,
      summary: {
        total_reports: 0,
        total_quantity: 0,
        total_amount: 0,
        average_sale_value: 0,
        average_quantity_per_sale: 0
      },
        daily_trends: [],
        top_products: []
      });
    }

    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_reports, 
        COALESCE(SUM(quantity), 0) as total_quantity, 
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(AVG(total_amount), 0) as average_sale_value, 
        COALESCE(AVG(quantity), 0) as average_quantity_per_sale,
        MIN(report_date) as first_report_date, 
        MAX(report_date) as last_report_date
      FROM sales_reports 
      WHERE vendor_id = $1 AND report_date >= CURRENT_DATE - INTERVAL '${days} days'
    `;

    const dailyTrendsQuery = `
      SELECT 
        report_date, 
        COALESCE(SUM(quantity), 0) as daily_quantity, 
        COALESCE(SUM(total_amount), 0) as daily_revenue, 
        COUNT(*) as daily_reports
      FROM sales_reports 
      WHERE vendor_id = $1 AND report_date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY report_date ORDER BY report_date ASC
    `;

    const productAnalyticsQuery = `
      SELECT 
        p.name as product_name, 
        COALESCE(SUM(sr.quantity), 0) as total_quantity, 
        COALESCE(SUM(sr.total_amount), 0) as total_amount,
        COUNT(*) as report_count, 
        COALESCE(AVG(sr.total_amount), 0) as average_sale_value
      FROM sales_reports sr
      LEFT JOIN products p ON sr.product_id = p.id
      WHERE sr.vendor_id = $1 AND sr.report_date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY p.name ORDER BY total_amount DESC LIMIT 10
    `;

    const [analyticsResult, dailyTrendsResult, productAnalyticsResult] = await Promise.all([
      pool.query(analyticsQuery, [req.vendorId]),
      pool.query(dailyTrendsQuery, [req.vendorId]),
      pool.query(productAnalyticsQuery, [req.vendorId])
    ]);

    const analytics = analyticsResult.rows[0] || {};
    const dailyTrends = dailyTrendsResult.rows || [];
    const topProducts = productAnalyticsResult.rows || [];

    res.json({
      period: period,
      days: days,
      summary: {
        total_reports: parseInt(analytics.total_reports) || 0,
        total_quantity: parseInt(analytics.total_quantity) || 0,
        total_amount: parseFloat(analytics.total_amount) || 0,
        average_sale_value: parseFloat(analytics.average_sale_value) || 0,
        average_quantity_per_sale: parseFloat(analytics.average_quantity_per_sale) || 0
      },
      daily_trends: dailyTrends.map(day => ({
        date: day.report_date,
        quantity: parseInt(day.daily_quantity) || 0,
        revenue: parseFloat(day.daily_revenue) || 0,
        reports: parseInt(day.daily_reports) || 0
      })),
      top_products: topProducts.map(product => ({
        product_name: product.product_name || 'Unknown Product',
        total_quantity: parseInt(product.total_quantity) || 0,
        total_amount: parseFloat(product.total_amount) || 0,
        report_count: parseInt(product.report_count) || 0,
        average_sale_value: parseFloat(product.average_sale_value) || 0
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching sales analytics:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to fetch sales analytics', 
      code: 'ANALYTICS_ERROR',
      details: error.message 
    });
  }
};

router.get('/vendors/analytics', authenticateToken, authenticateVendor, analyticsHandler);
// Aliases for compatibility with older/variant frontends
router.get('/vendor/analytics', authenticateToken, authenticateVendor, analyticsHandler);
router.get('/vendors/sales/analytics', authenticateToken, authenticateVendor, analyticsHandler);

module.exports = router;