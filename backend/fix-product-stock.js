require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true'
});

async function fixProductStock() {
  try {
    console.log('🔧 Fixing products with zero stock quantity...\n');
    
    // 1. Check current products with zero stock
    console.log('📋 1. Current products with zero stock:');
    const zeroStockResult = await pool.query(`
      SELECT id, name, price, stock_quantity, category 
      FROM products 
      WHERE stock_quantity = 0 
      ORDER BY created_at DESC
    `);
    
    if (zeroStockResult.rows.length === 0) {
      console.log('  No products with zero stock found!');
      return;
    }
    
    console.log(`  Found ${zeroStockResult.rows.length} products with zero stock:`);
    zeroStockResult.rows.forEach(product => {
      console.log(`  - ID: ${product.id}, Name: "${product.name}", Stock: ${product.stock_quantity}`);
    });
    
    // 2. Update all zero-stock products to have reasonable stock quantities
    console.log('\n🚀 2. Updating stock quantities...');
    
    // Set stock quantities based on product category or use random values between 10-100
    const updateResult = await pool.query(`
      UPDATE products 
      SET stock_quantity = CASE 
        WHEN category = 'Electronics' THEN FLOOR(RANDOM() * 30) + 20  -- 20-50 units
        WHEN category = 'Fashion' THEN FLOOR(RANDOM() * 50) + 30      -- 30-80 units  
        WHEN category = 'Books' THEN FLOOR(RANDOM() * 20) + 10        -- 10-30 units
        WHEN category = 'Beauty & Personal Care' THEN FLOOR(RANDOM() * 40) + 15  -- 15-55 units
        WHEN category = 'Home & Garden' THEN FLOOR(RANDOM() * 25) + 15  -- 15-40 units
        ELSE FLOOR(RANDOM() * 50) + 25  -- Default: 25-75 units
      END,
      updated_at = NOW()
      WHERE stock_quantity = 0
      RETURNING id, name, stock_quantity
    `);
    
    console.log(`✅ Updated ${updateResult.rows.length} products:`);
    updateResult.rows.forEach(product => {
      console.log(`  - ID: ${product.id}, Name: "${product.name}", New Stock: ${product.stock_quantity}`);
    });
    
    // 3. Verify the fix
    console.log('\n📊 3. Verification:');
    const verificationResult = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as in_stock,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as zero_stock,
        ROUND(AVG(stock_quantity), 2) as avg_stock,
        MIN(stock_quantity) as min_stock,
        MAX(stock_quantity) as max_stock
      FROM products
    `);
    
    const stats = verificationResult.rows[0];
    console.log(`  Total products: ${stats.total_products}`);
    console.log(`  In stock (> 0): ${stats.in_stock}`);
    console.log(`  Zero stock: ${stats.zero_stock}`);
    console.log(`  Average stock: ${stats.avg_stock}`);
    console.log(`  Stock range: ${stats.min_stock} - ${stats.max_stock}`);
    
    if (stats.zero_stock === '0') {
      console.log('\n🎉 SUCCESS: All products now have stock quantities > 0!');
    } else {
      console.log('\n⚠️  WARNING: Some products still have zero stock');
    }
    
  } catch (error) {
    console.error('❌ Error fixing product stock:', error);
  } finally {
    await pool.end();
  }
}

fixProductStock();