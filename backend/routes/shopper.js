const express = require('express');
const { pool, authenticateToken } = require('../utils');

const router = express.Router();

const authenticateShopper = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required.', code: 'NO_TOKEN' });
    }
    const userCheck = await pool.query('SELECT user_type FROM users WHERE id = $1', [req.user.userId]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].user_type !== 'shopper') {
      return res.status(403).json({ error: 'Access denied. Shopper account required.', code: 'NOT_SHOPPER' });
    }
    const shopperResult = await pool.query('SELECT id FROM shoppers WHERE user_id = $1', [req.user.userId]);
    if (shopperResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Shopper profile not found. Please create a shopper profile first.', 
        code: 'SHOPPER_NOT_FOUND',
        action: 'CREATE_PROFILE'
      });
    }
    req.shopperId = shopperResult.rows[0].id;
    next();
  } catch (error) {
    console.error('Shopper authentication error:', error);
    res.status(500).json({ error: 'Internal server error during shopper authentication', code: 'SHOPPER_AUTH_ERROR' });
  }
};

router.post('/shopper/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, address, phone_number } = req.body;
    
    // Check if user is already a shopper
    const existingShopper = await pool.query('SELECT id FROM shoppers WHERE user_id = $1', [req.user.userId]);
    if (existingShopper.rows.length > 0) {
      return res.status(400).json({ error: 'Shopper profile already exists', code: 'SHOPPER_EXISTS' });
    }
    
    // Verify user type is shopper
    const userCheck = await pool.query('SELECT user_type FROM users WHERE id = $1', [req.user.userId]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].user_type !== 'shopper') {
      return res.status(403).json({ error: 'Access denied. Shopper account required.', code: 'NOT_SHOPPER' });
    }
    
    // Create shopper profile
    const result = await pool.query(
      'INSERT INTO shoppers (user_id, full_name, address, phone_number) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.user.userId, full_name || '', address || '', phone_number || '']
    );
    
    res.status(201).json({ message: 'Shopper profile created successfully', shopper_id: result.rows[0].id });
  } catch (error) {
    console.error('Error creating shopper profile:', error);
    res.status(500).json({ error: 'Failed to create shopper profile', code: 'CREATE_SHOPPER_ERROR' });
  }
});

router.get('/shopper/profile/exists', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required.', code: 'NO_TOKEN' });
    }
    
    const userCheck = await pool.query('SELECT user_type FROM users WHERE id = $1', [req.user.userId]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].user_type !== 'shopper') {
      return res.status(403).json({ error: 'Access denied. Shopper account required.', code: 'NOT_SHOPPER' });
    }
    
    const shopperResult = await pool.query('SELECT id FROM shoppers WHERE user_id = $1', [req.user.userId]);
    const hasProfile = shopperResult.rows.length > 0;
    
    res.json({ 
      hasProfile, 
      shopperId: hasProfile ? shopperResult.rows[0].id : null 
    });
  } catch (error) {
    console.error('Error checking shopper profile:', error);
    res.status(500).json({ error: 'Failed to check shopper profile', code: 'CHECK_PROFILE_ERROR' });
  }
});

router.get('/shopper/stats', authenticateToken, authenticateShopper, async (req, res) => {
  try {
    // Get counts for various shopper activities
    const comparisonsQuery = 'SELECT COUNT(*) as comparisons_count FROM comparisons WHERE shopper_id = $1';
    const reviewsQuery = 'SELECT COUNT(*) as reviews_count FROM reviews WHERE shopper_id = $1';
    const watchlistQuery = 'SELECT COUNT(*) as watchlist_count FROM wishlist WHERE shopper_id = $1';

    const [comparisonsResult, reviewsResult, watchlistResult] = await Promise.all([
      pool.query(comparisonsQuery, [req.shopperId]),
      pool.query(reviewsQuery, [req.shopperId]),
      pool.query(watchlistQuery, [req.shopperId]),
    ]);

    // Calculate estimated money saved based on comparisons
    // For now, use a simple estimate: $50 per comparison
    const comparisonsCount = parseInt(comparisonsResult.rows[0].comparisons_count) || 0;
    const estimatedSavings = comparisonsCount * 50;

    res.json({
      money_saved: estimatedSavings,
      comparisons_count: comparisonsCount,
      reviews_count: parseInt(reviewsResult.rows[0].reviews_count) || 0,
      watchlist_count: parseInt(watchlistResult.rows[0].watchlist_count) || 0,
    });
  } catch (error) {
    console.error('Error fetching shopper stats:', error);
    res.status(500).json({ error: 'Failed to fetch shopper stats', code: 'STATS_ERROR' });
  }
});

// Get shopper's watchlist
router.get('/shopper/watchlist', authenticateToken, authenticateShopper, async (req, res) => {
  try {
    const query = `
      SELECT 
        w.id as wishlist_id,
        w.created_at as added_at,
        p.id as product_id,
        p.name,
        p.price,
        p.description,
        p.category,
        p.image_url,
        v.business_name as vendor_name,
        v.location as vendor_location
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      JOIN vendors v ON p.vendor_id = v.id
      WHERE w.shopper_id = $1
      ORDER BY w.created_at DESC
    `;
    
    const result = await pool.query(query, [req.shopperId]);
    
    res.json({
      watchlist: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist', code: 'WATCHLIST_ERROR' });
  }
});

// Add product to watchlist
router.post('/shopper/watchlist', authenticateToken, authenticateShopper, async (req, res) => {
  try {
    const { product_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required', code: 'MISSING_PRODUCT_ID' });
    }
    
    // Check if product exists
    const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [product_id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    }
    
    // Check if already in watchlist
    const existingCheck = await pool.query(
      'SELECT id FROM wishlist WHERE shopper_id = $1 AND product_id = $2',
      [req.shopperId, product_id]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Product already in watchlist', code: 'ALREADY_IN_WATCHLIST' });
    }
    
    // Add to watchlist
    const result = await pool.query(
      'INSERT INTO wishlist (shopper_id, product_id, created_at) VALUES ($1, $2, NOW()) RETURNING id',
      [req.shopperId, product_id]
    );
    
    res.status(201).json({
      message: 'Product added to watchlist',
      wishlist_id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ error: 'Failed to add to watchlist', code: 'ADD_WATCHLIST_ERROR' });
  }
});

// Remove product from watchlist
router.delete('/shopper/watchlist/:productId', authenticateToken, authenticateShopper, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM wishlist WHERE shopper_id = $1 AND product_id = $2 RETURNING id',
      [req.shopperId, productId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not in watchlist', code: 'NOT_IN_WATCHLIST' });
    }
    
    res.json({ message: 'Product removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist', code: 'REMOVE_WATCHLIST_ERROR' });
  }
});

module.exports = router;
