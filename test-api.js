const { Pool } = require('./backend/node_modules/pg');
const jwt = require('./backend/node_modules/jsonwebtoken');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'biz_book',
  password: process.env.DB_PASSWORD || 'permitted',
  port: process.env.DB_PORT || 5432
});

async function testVendorProducts() {
  try {
    console.log('Testing vendor products query...\n');
    
    // Test 1: Check user exists
    const userResult = await pool.query(
      'SELECT id, email, user_type FROM users WHERE id = $1',
      [2]
    );
    console.log('✅ User found:', userResult.rows[0]);
    
    // Test 2: Check vendor profile exists
    const vendorResult = await pool.query(
      'SELECT id, business_name FROM vendors WHERE user_id = $1',
      [2]
    );
    console.log('✅ Vendor profile found:', vendorResult.rows[0]);
    const vendorId = vendorResult.rows[0].id;
    
    // Test 3: Try the actual products query
    console.log('\nTesting products query for vendorId:', vendorId);
    
    const productsQuery = `
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
      WHERE p.vendor_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(productsQuery, [vendorId, 20, 0]);
    console.log('✅ Products query successful!');
    console.log('Found', result.rows.length, 'products');
    
    if (result.rows.length > 0) {
      console.log('\nFirst product:', JSON.stringify(result.rows[0], null, 2));
    }
    
    // Test 4: Count query
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM products WHERE vendor_id = $1',
      [vendorId]
    );
    console.log('\nTotal products:', countResult.rows[0].count);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

testVendorProducts();
