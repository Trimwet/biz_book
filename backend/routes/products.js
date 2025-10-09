const express = require('express');
const { pool, authenticateToken } = require('../utils');
const xss = require('xss');
const { trackSearch } = require('./search');

const router = express.Router();

const sanitizeInput = (input) => (typeof input === 'string' ? xss(input.trim()) : input);

const mockProducts = [
    { id: 1, name: 'Demo Product 1', price: 150, category: 'Electronics', vendor_location: 'Lagos' },
    { id: 2, name: 'Demo Product 2', price: 90, category: 'Fashion', vendor_location: 'Abuja' },
];

const mockCategories = [
  { category: 'Electronics', product_count: 15, average_price: 450000 },
  { category: 'Computers & Laptops', product_count: 8, average_price: 850000 },
  { category: 'Fashion & Clothing', product_count: 25, average_price: 15000 },
  { category: 'Food & Groceries', product_count: 40, average_price: 2500 }
];

// 🏷️ CORE FEATURE: Get Product Categories
router.get('/categories', async (req, res) => {
  try {
    // 📊 Demo mode: Use mock data if database not connected
    if (!pool.dbConnected) {
      return res.json({
        categories: mockCategories
      });
    }
    
    // Database mode: Original database query
    const result = await pool.query(`
      SELECT 
        category,
        COUNT(*) as product_count,
        AVG(price) as average_price
      FROM products 
      GROUP BY category 
      ORDER BY product_count DESC
    `);
    
    res.json({
      categories: result.rows
    });
    
  } catch (err) {
    console.error('❌ Get categories error:', err);
    res.status(500).json({ 
      error: 'Unable to fetch categories',
      code: 'FETCH_CATEGORIES_FAILED' 
    });
  }
});

// 🔍 ENHANCED SEARCH: Product Search with Intelligence & Analytics
router.get('/search', async (req, res) => {
 try {
    const { q: query, category, location, minPrice, maxPrice, sortBy = 'price', sortOrder = 'ASC', page = 1, limit = 20 } = req.query;

    // 🔒 SECURITY: Validate and sanitize search parameters
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters',
        code: 'INVALID_SEARCH_QUERY' 
      });
    }

    const sanitizedQuery = sanitizeInput(query);
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Prepare filters object for tracking
    const searchFilters = {
      category: category || null,
      location: location || null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      sortBy,
      sortOrder
    };

    // 📊 Demo mode: Use mock data if database not connected
    if (!pool.dbConnected) {
      let filteredProducts = mockProducts.filter(p => 
        p.name.toLowerCase().includes(sanitizedQuery.toLowerCase())
      );
      
      if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
      }
      if (location) {
        filteredProducts = filteredProducts.filter(p => 
          p.vendor_location.toLowerCase().includes(location.toLowerCase())
        );
      }
      if (minPrice) {
        filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
      }
      if (maxPrice) {
        filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
      }
      
      if (sortBy === 'price') {
        filteredProducts.sort((a, b) => sortOrder === 'DESC' ? b.price - a.price : a.price - b.price);
      }

      if (filteredProducts.length > 0) {
        const prices = filteredProducts.map(p => p.price);
        const minPriceFound = Math.min(...prices);
        const maxPriceFound = Math.max(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

        // Track search in demo mode (if user is logged in)
        if (req.user) {
          await trackSearch(req.user.id, sanitizedQuery, searchFilters, filteredProducts.length, req.ip, req.get('User-Agent'));
        }

        return res.json({
          products: filteredProducts,
          priceAnalysis: {
            lowestPrice: minPriceFound,
            highestPrice: maxPriceFound,
            averagePrice: Math.round(avgPrice * 100) / 100,
            totalVendors: filteredProducts.length,
            potentialSavings: maxPriceFound - minPriceFound
          },
          searchQuery: sanitizedQuery,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(filteredProducts.length / limitNum),
            totalResults: filteredProducts.length,
            hasNextPage: pageNum < Math.ceil(filteredProducts.length / limitNum),
            hasPrevPage: pageNum > 1
          }
        });
      } else {
        return res.json({
          products: [],
          message: 'No products found matching your search criteria',
          searchQuery: sanitizedQuery
        });
      }
    }

    // Database mode
    const allowedSortColumns = ['price', 'created_at', 'name', 'average_rating'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'price';
    const validSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let queryText = `
      SELECT 
        p.id, p.name, p.price, p.description, p.image_url, p.created_at,
        v.business_name as vendor_name, v.location as vendor_location, v.phone as vendor_phone,
        u.email as vendor_email,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM products p
      JOIN vendors v ON p.vendor_id = v.id
      JOIN users u ON v.user_id = u.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.name ILIKE $1
    `;

    const queryParams = [`%${sanitizedQuery}%`];
    let paramCount = 1;

    if (category) {
      paramCount++;
      queryText += ` AND p.category = $${paramCount}`;
      queryParams.push(sanitizeInput(category));
    }
    if (location) {
      paramCount++;
      queryText += ` AND v.location ILIKE $${paramCount}`;
      queryParams.push(`%${sanitizeInput(location)}%`);
    }
    if (minPrice) {
      paramCount++;
      queryText += ` AND p.price >= $${paramCount}`;
      queryParams.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      paramCount++;
      queryText += ` AND p.price <= $${paramCount}`;
      queryParams.push(parseFloat(maxPrice));
    }

    queryText += `
      GROUP BY p.id, v.business_name, v.location, v.phone, u.email
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limitNum, offset);

    const result = await pool.query(queryText, queryParams);
    const products = result.rows;

    // Get total count for pagination
    const countQuery = queryText.replace(/SELECT.*?FROM/, 'SELECT COUNT(DISTINCT p.id) as total FROM').replace(/ORDER BY.*?LIMIT.*?OFFSET.*$/, '');
    const countParams = queryParams.slice(0, -2); // Remove LIMIT and OFFSET params
    const countResult = await pool.query(countQuery, countParams);
    const totalResults = parseInt(countResult.rows[0].total);

    // Track search activity
    if (req.user) {
      await trackSearch(req.user.id, sanitizedQuery, searchFilters, totalResults, req.ip, req.get('User-Agent'));
    }

    if (products.length > 0) {
      const prices = products.map(p => parseFloat(p.price));
      const minPriceFound = Math.min(...prices);
      const maxPriceFound = Math.max(...prices);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      res.json({
        products: products,
        priceAnalysis: {
          lowestPrice: minPriceFound,
          highestPrice: maxPriceFound,
          averagePrice: Math.round(avgPrice * 100) / 100,
          totalVendors: products.length,
          potentialSavings: maxPriceFound - minPriceFound
        },
        searchQuery: sanitizedQuery,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalResults / limitNum),
          totalResults: totalResults,
          hasNextPage: pageNum < Math.ceil(totalResults / limitNum),
          hasPrevPage: pageNum > 1,
          limit: limitNum
        }
      });
    } else {
      res.json({
        products: [],
        message: 'No products found matching your search criteria',
        searchQuery: sanitizedQuery,
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          totalResults: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: limitNum
        }
      });
    }

  } catch (err) {
    console.error('❌ Product search error:', err);
    res.status(500).json({
      error: 'Search temporarily unavailable',
      code: 'SEARCH_ERROR'
    });
  }
});

// 🛍️ CORE FEATURE: Browse All Products (Shopper Product Feed)
router.get('/browse', async (req, res) => {
  try {
    const { category, sortBy = 'created_at', sortOrder = 'DESC', page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // 📊 Demo mode: Use mock data if database not connected
    if (!pool.dbConnected) {
      let mockBrowseProducts = [
        { id: 1, name: 'iPhone 15 Pro', price: 1500000, category: 'Electronics', description: 'Latest iPhone with amazing features', vendor_name: 'TechHub Store', vendor_location: 'Lagos', created_at: '2024-01-15', stock: 5, status: 'active' },
        { id: 2, name: 'Samsung Galaxy S24', price: 1200000, category: 'Electronics', description: 'Powerful Android smartphone', vendor_name: 'MobileWorld', vendor_location: 'Abuja', created_at: '2024-01-14', stock: 8, status: 'active' },
        { id: 3, name: 'Nike Air Max', price: 45000, category: 'Fashion', description: 'Comfortable running shoes', vendor_name: 'SportCenter', vendor_location: 'Lagos', created_at: '2024-01-13', stock: 15, status: 'active' },
        { id: 4, name: 'MacBook Pro M3', price: 2500000, category: 'Computers & Laptops', description: 'Professional laptop for creators', vendor_name: 'Apple Store', vendor_location: 'Abuja', created_at: '2024-01-12', stock: 3, status: 'active' },
        { id: 5, name: 'Sony WH-1000XM5', price: 180000, category: 'Electronics', description: 'Premium noise-canceling headphones', vendor_name: 'AudioTech', vendor_location: 'Lagos', created_at: '2024-01-11', stock: 10, status: 'active' },
        { id: 6, name: 'Adidas Ultraboost', price: 55000, category: 'Fashion', description: 'High-performance running shoes', vendor_name: 'SportCenter', vendor_location: 'Kano', created_at: '2024-01-10', stock: 12, status: 'active' }
      ];

      if (category) {
        mockBrowseProducts = mockBrowseProducts.filter(p => p.category === category);
      }

      const totalProducts = mockBrowseProducts.length;
      const totalPages = Math.ceil(totalProducts / limitNum);
      const paginatedProducts = mockBrowseProducts.slice(offset, offset + limitNum);

      return res.json({
        products: paginatedProducts,
        pagination: {
          current_page: pageNum,
          total_pages: totalPages,
          total_products: totalProducts,
          per_page: limitNum,
          has_next: pageNum < totalPages,
          has_prev: pageNum > 1
        },
        success: true
      });
    }

    // Database mode: Get all products with vendor information
    let whereClause = "p.status = 'active'";
    let params = [];
    let paramIndex = 1;

    if (category) {
      whereClause += ` AND p.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Sort validation
    const validSortFields = ['price', 'created_at', 'name'];
    const validSortOrders = ['ASC', 'DESC'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const query = `
      SELECT
        p.*,
        v.business_name as vendor_name,
        COALESCE(v.location, 'Location not specified') as vendor_location,
        v.id as vendor_id,
        json_agg(
          json_build_object(
            'id', pi.id,
            'image_url', pi.image_url,
            'is_primary', pi.is_primary,
            'display_order', pi.display_order
          ) ORDER BY pi.display_order
        ) FILTER (WHERE pi.id IS NOT NULL) as images
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE ${whereClause}
      GROUP BY p.id, v.business_name, v.location, v.id
      ORDER BY p.${finalSortBy} ${finalSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const totalProducts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalProducts / limitNum);

    // Process products to format images properly
    const products = result.rows.map(product => ({
      ...product,
      images: product.images && product.images[0] !== null ? product.images : []
    }));

    res.json({
      products: products,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_products: totalProducts,
        per_page: limitNum,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1
      },
      success: true
    });

  } catch (err) {
    console.error('❌ Browse products error:', err);
    res.status(500).json({
      error: 'Unable to browse products',
      code: 'BROWSE_PRODUCTS_FAILED'
    });
  }
});

// 🏪 NEW FEATURE: Get Products by Specific Vendor
router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { category, sortBy = 'created_at', sortOrder = 'DESC', page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // 📊 Demo mode: Use mock data if database not connected
    if (!pool.dbConnected) {
      let mockVendorProducts = [
        { id: 1, name: 'iPhone 15 Pro', price: 1500000, category: 'Electronics', description: 'Latest iPhone with amazing features', vendor_name: 'TechHub Store', vendor_location: 'Lagos', created_at: '2024-01-15', stock: 5, status: 'active', images: [] },
        { id: 2, name: 'Samsung Galaxy S24', price: 1200000, category: 'Electronics', description: 'Powerful Android smartphone', vendor_name: 'TechHub Store', vendor_location: 'Lagos', created_at: '2024-01-14', stock: 8, status: 'active', images: [] },
        { id: 3, name: 'MacBook Pro M3', price: 2500000, category: 'Computers & Laptops', description: 'Professional laptop for creators', vendor_name: 'TechHub Store', vendor_location: 'Lagos', created_at: '2024-01-12', stock: 3, status: 'active', images: [] }
      ];

      if (category) {
        mockVendorProducts = mockVendorProducts.filter(p => p.category === category);
      }

      const totalProducts = mockVendorProducts.length;
      const totalPages = Math.ceil(totalProducts / limitNum);
      const paginatedProducts = mockVendorProducts.slice(offset, offset + limitNum);

      return res.json({
        products: paginatedProducts,
        vendor: {
          id: vendorId,
          business_name: 'TechHub Store',
          location: 'Lagos',
          description: 'Your trusted technology partner'
        },
        pagination: {
          current_page: pageNum,
          total_pages: totalPages,
          total_products: totalProducts,
          per_page: limitNum,
          has_next: pageNum < totalPages,
          has_prev: pageNum > 1
        },
        success: true
      });
    }

    // Database mode: Get products by specific vendor with vendor information
    let whereClause = "p.vendor_id = $1 AND p.status = 'active'";
    let params = [vendorId];
    let paramIndex = 2;

    if (category) {
      whereClause += ` AND p.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Sort validation
    const validSortFields = ['price', 'created_at', 'name', 'stock'];
    const validSortOrders = ['ASC', 'DESC'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const query = `
      SELECT
        p.*,
        v.business_name as vendor_name,
        COALESCE(v.location, 'Location not specified') as vendor_location,
        v.description as vendor_description,
        v.phone as vendor_phone,
        json_agg(
          json_build_object(
            'id', pi.id,
            'image_url', pi.image_url,
            'is_primary', pi.is_primary,
            'display_order', pi.display_order
          ) ORDER BY pi.display_order
        ) FILTER (WHERE pi.id IS NOT NULL) as images
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE ${whereClause}
      GROUP BY p.id, v.business_name, v.location, v.description, v.phone
      ORDER BY p.${finalSortBy} ${finalSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    // Get vendor information
    const vendorQuery = `
      SELECT
        v.id, v.business_name, v.location, v.description, v.phone,
        u.email as vendor_email,
        COUNT(p.id) as total_products,
        COALESCE(AVG(p.price), 0) as average_price
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN products p ON v.id = p.vendor_id AND p.status = 'active'
      WHERE v.id = $1
      GROUP BY v.id, v.business_name, v.location, v.description, v.phone, u.email
    `;

    const vendorResult = await pool.query(vendorQuery, [vendorId]);
    const vendorInfo = vendorResult.rows[0];

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`;
    const countParams = category ? [vendorId, category] : [vendorId];
    const countResult = await pool.query(countQuery, countParams);
    const totalProducts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalProducts / limitNum);

    res.json({
      products: result.rows,
      vendor: vendorInfo,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_products: totalProducts,
        per_page: limitNum,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1
      },
      success: true
    });

  } catch (err) {
    console.error('❌ Get vendor products error:', err);
    res.status(500).json({
      error: 'Unable to fetch vendor products',
      code: 'VENDOR_PRODUCTS_ERROR'
    });
  }
});

// 🔍 ENHANCED FEATURE: Get Product Details with Full Information
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (!productId || productId <= 0) {
      return res.status(400).json({ 
        error: 'Invalid product ID',
        code: 'INVALID_PRODUCT_ID' 
      });
    }

    // 📊 Demo mode: Use mock data if database not connected
    if (!pool.dbConnected) {
      const mockProduct = {
        id: productId,
        name: `Demo Product ${productId}`,
        price: 150 + (productId * 25),
        description: `This is a detailed description for Demo Product ${productId}. It includes comprehensive information about features, specifications, and benefits.`,
        category: 'Electronics',
        image_url: '/api/placeholder/400/300',
        created_at: new Date().toISOString(),
        vendor_name: 'Demo Vendor',
        vendor_location: 'Lagos',
        vendor_phone: '+234-800-DEMO',
        vendor_email: 'demo@vendor.com',
        average_rating: 4.2 + (productId % 3) * 0.3,
        review_count: 15 + (productId % 10),
        specifications: {
          brand: 'Demo Brand',
          model: `Model-${productId}`,
          warranty: '1 Year',
          color: ['Black', 'White', 'Silver'][productId % 3],
          weight: `${1.2 + (productId % 5) * 0.3}kg`
        },
        price_history: [
          { date: '2024-01-01', price: 180 + (productId * 25) },
          { date: '2024-01-15', price: 170 + (productId * 25) },
          { date: '2024-02-01', price: 160 + (productId * 25) },
          { date: '2024-02-15', price: 150 + (productId * 25) }
        ],
        reviews: [
          {
            id: 1,
            user_name: 'John D.',
            rating: 5,
            comment: 'Excellent product! Highly recommended.',
            created_at: '2024-01-20T10:30:00Z',
            verified_purchase: true
          },
          {
            id: 2,
            user_name: 'Sarah M.',
            rating: 4,
            comment: 'Good quality, fast delivery.',
            created_at: '2024-01-18T14:15:00Z',
            verified_purchase: true
          }
        ],
        similar_products: [
          { id: productId + 1, name: `Similar Product ${productId + 1}`, price: 140 + (productId * 20), image_url: '/api/placeholder/200/150' },
          { id: productId + 2, name: `Similar Product ${productId + 2}`, price: 160 + (productId * 30), image_url: '/api/placeholder/200/150' }
        ]
      };

      return res.json({
        product: mockProduct,
        success: true
      });
    }

    // Database mode: Get comprehensive product information
    const productQuery = `
      SELECT 
        p.id, p.name, p.price, p.description, p.category, p.image_url, p.created_at,
        p.specifications,
        v.business_name as vendor_name, v.location as vendor_location, 
        v.phone as vendor_phone, v.description as vendor_description,
        u.email as vendor_email,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM products p
      JOIN vendors v ON p.vendor_id = v.id
      JOIN users u ON v.user_id = u.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.id = $1
      GROUP BY p.id, v.business_name, v.location, v.phone, v.description, u.email
    `;

    const productResult = await pool.query(productQuery, [productId]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND' 
      });
    }

    const product = productResult.rows[0];

    // Get detailed reviews
    const reviewsQuery = `
      SELECT 
        r.id, r.rating, r.comment, r.created_at,
        s.name as user_name,
        CASE WHEN r.verified_purchase THEN true ELSE false END as verified_purchase
      FROM reviews r
      JOIN shoppers s ON r.shopper_id = s.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10
    `;
    
    const reviewsResult = await pool.query(reviewsQuery, [productId]);

    // Get price history (mock for now, can be implemented with price tracking)
    const priceHistory = [
      { date: '2024-01-01', price: parseFloat(product.price) + 30 },
      { date: '2024-01-15', price: parseFloat(product.price) + 20 },
      { date: '2024-02-01', price: parseFloat(product.price) + 10 },
      { date: '2024-02-15', price: parseFloat(product.price) }
    ];

    // Get similar products
    const similarQuery = `
      SELECT id, name, price, image_url
      FROM products 
      WHERE category = $1 AND id != $2
      ORDER BY RANDOM()
      LIMIT 4
    `;
    
    const similarResult = await pool.query(similarQuery, [product.category, productId]);

    res.json({
      product: {
        ...product,
        specifications: product.specifications || {},
        price_history: priceHistory,
        reviews: reviewsResult.rows,
        similar_products: similarResult.rows
      },
      success: true
    });

  } catch (err) {
    console.error('❌ Get product details error:', err);
    res.status(500).json({ 
      error: 'Unable to fetch product details',
      code: 'FETCH_PRODUCT_DETAILS_FAILED' 
    });
  }
});

// 🆚 ENHANCED FEATURE: Compare Multiple Products
router.post('/compare', async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2 || productIds.length > 4) {
      return res.status(400).json({ 
        error: 'Please provide 2-4 product IDs for comparison',
        code: 'INVALID_COMPARISON_REQUEST' 
      });
    }

    // Validate product IDs
    const validIds = productIds.filter(id => Number.isInteger(id) && id > 0);
    if (validIds.length !== productIds.length) {
      return res.status(400).json({ 
        error: 'All product IDs must be valid integers',
        code: 'INVALID_PRODUCT_IDS' 
      });
    }

    // 📊 Demo mode: Use mock data if database not connected
    if (!pool.dbConnected) {
      const mockComparison = validIds.map(id => ({
        id: id,
        name: `Demo Product ${id}`,
        price: 150 + (id * 25),
        description: `Demo description for product ${id}`,
        category: 'Electronics',
        image_url: '/api/placeholder/300/200',
        vendor_name: `Demo Vendor ${id}`,
        vendor_location: ['Lagos', 'Abuja', 'Port Harcourt'][id % 3],
        average_rating: 4.0 + (id % 5) * 0.2,
        review_count: 10 + (id % 15),
        specifications: {
          brand: `Brand ${id}`,
          model: `Model-${id}`,
          warranty: `${id % 3 + 1} Year(s)`,
          color: ['Black', 'White', 'Silver', 'Blue'][id % 4]
        },
        features: [
          `Feature A for Product ${id}`,
          `Feature B for Product ${id}`,
          `Feature C for Product ${id}`
        ]
      }));

      return res.json({
        comparison: mockComparison,
        analysis: {
          price_range: {
            min: Math.min(...mockComparison.map(p => p.price)),
            max: Math.max(...mockComparison.map(p => p.price)),
            average: mockComparison.reduce((sum, p) => sum + p.price, 0) / mockComparison.length
          },
          best_rated: mockComparison.reduce((best, current) => 
            current.average_rating > best.average_rating ? current : best
          ),
          most_affordable: mockComparison.reduce((cheapest, current) => 
            current.price < cheapest.price ? current : cheapest
          )
        },
        success: true
      });
    }

    // Database mode: Get detailed comparison data
    const placeholders = validIds.map((_, index) => `$${index + 1}`).join(',');
    const comparisonQuery = `
      SELECT 
        p.id, p.name, p.price, p.description, p.category, p.image_url,
        p.specifications,
        v.business_name as vendor_name, v.location as vendor_location,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM products p
      JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.id IN (${placeholders})
      GROUP BY p.id, v.business_name, v.location
      ORDER BY p.price ASC
    `;

    const result = await pool.query(comparisonQuery, validIds);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No products found for comparison',
        code: 'NO_PRODUCTS_FOUND' 
      });
    }

    const products = result.rows;
    const prices = products.map(p => parseFloat(p.price));
    
    // Generate comparison analysis
    const analysis = {
      price_range: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((sum, price) => sum + price, 0) / prices.length
      },
      best_rated: products.reduce((best, current) => 
        parseFloat(current.average_rating) > parseFloat(best.average_rating) ? current : best
      ),
      most_affordable: products.reduce((cheapest, current) => 
        parseFloat(current.price) < parseFloat(cheapest.price) ? current : cheapest
      )
    };

    res.json({
      comparison: products,
      analysis: analysis,
      success: true
    });

  } catch (err) {
    console.error('❌ Product comparison error:', err);
    res.status(500).json({ 
      error: 'Unable to compare products',
      code: 'COMPARISON_FAILED' 
    });
  }
});


module.exports = router;