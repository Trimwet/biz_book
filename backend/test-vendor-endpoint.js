require('dotenv').config();
const { Pool } = require('pg');

async function testVendorProductsQuery() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'Bizbook_db',
    password: process.env.DB_PASSWORD || 'permitted',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('🧪 Testing vendor products query...\n');
    
    // First, get a vendor ID
    console.log('1. Finding a vendor...');
    const vendorResult = await pool.query('SELECT id, user_id FROM vendors LIMIT 1');
    
    if (vendorResult.rows.length === 0) {
      console.log('❌ No vendors found in database!');
      pool.end();
      return;
    }
    
    const vendorId = vendorResult.rows[0].id;
    console.log(`✅ Found vendor ID: ${vendorId}\n`);
    
    // Try the exact query from the vendor route
    console.log('2. Testing products query...');
    const whereClause = 'WHERE p.vendor_id = $1';
    const params = [vendorId];
    const limitParam = 2;
    const offsetParam = 3;
    params.push(20, 0); // limit, offset
    
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
      ORDER BY p.created_at desc
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;
    
    console.log('Query:', queryText);
    console.log('Params:', params);
    console.log('');
    
    const result = await pool.query(queryText, params);
    
    console.log(`✅ Query successful! Found ${result.rows.length} products\n`);
    
    if (result.rows.length > 0) {
      console.log('Sample product:');
      const product = result.rows[0];
      console.log({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        stock_quantity: product.stock_quantity,
        vendor_id: product.vendor_id,
        images: product.images
      });
    } else {
      console.log('No products found for this vendor');
    }
    
    // Test count query
    console.log('\n3. Testing count query...');
    const countQuery = `SELECT COUNT(*) FROM products p WHERE p.vendor_id = $1`;
    const countResult = await pool.query(countQuery, [vendorId]);
    console.log(`✅ Total products: ${countResult.rows[0].count}\n`);
    
    pool.end();
    
    console.log('✅ All tests passed! The query should work.');
    
  } catch (err) {
    console.error('❌ Error occurred:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Detail:', err.detail);
    console.error('Stack:', err.stack);
    pool.end();
    process.exit(1);
  }
}

testVendorProductsQuery();
