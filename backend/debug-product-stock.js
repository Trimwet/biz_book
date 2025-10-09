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

async function debugProductStock() {
  try {
    console.log('🔍 Debugging product stock issues...\n');
    
    // 1. Check products table schema
    console.log('📋 1. Products table schema:');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);
    
    schemaResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // 2. Check recent products
    console.log('\n📦 2. Recent products data:');
    const productsResult = await pool.query(`
      SELECT id, name, price, stock_quantity, category, created_at
      FROM products 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (productsResult.rows.length === 0) {
      console.log('  No products found in database');
    } else {
      productsResult.rows.forEach(product => {
        console.log(`  - ID: ${product.id}, Name: "${product.name}", Stock: ${product.stock_quantity}, Price: ₦${product.price}`);
      });
    }
    
    // 3. Check for any status column
    console.log('\n🔍 3. Checking for status-related columns:');
    const statusColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name ILIKE '%status%'
    `);
    
    if (statusColumns.rows.length === 0) {
      console.log('  No status columns found in products table');
    } else {
      statusColumns.rows.forEach(col => {
        console.log(`  Found status column: ${col.column_name}`);
      });
    }
    
    // 4. Check if there are any products with stock > 0
    console.log('\n📊 4. Stock quantity analysis:');
    const stockAnalysis = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as in_stock,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as zero_stock,
        COUNT(CASE WHEN stock_quantity IS NULL THEN 1 END) as null_stock,
        AVG(stock_quantity) as avg_stock
      FROM products
    `);
    
    const stats = stockAnalysis.rows[0];
    console.log(`  Total products: ${stats.total_products}`);
    console.log(`  In stock (> 0): ${stats.in_stock}`);
    console.log(`  Zero stock: ${stats.zero_stock}`);
    console.log(`  Null stock: ${stats.null_stock}`);
    console.log(`  Average stock: ${stats.avg_stock || 'N/A'}`);
    
    // 5. Show sample products with all columns
    console.log('\n📋 5. Full product data sample:');
    const fullDataResult = await pool.query(`
      SELECT * FROM products 
      ORDER BY created_at DESC 
      LIMIT 2
    `);
    
    fullDataResult.rows.forEach((product, index) => {
      console.log(`\n  Product ${index + 1}:`);
      Object.entries(product).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error debugging product stock:', error);
  } finally {
    await pool.end();
  }
}

debugProductStock();