require('dotenv').config();
const { Pool } = require('pg');

async function cleanupProductsColumns() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'price_tracker',
    password: process.env.DB_PASSWORD || 'permitted',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('🧹 Cleaning up products table columns...\n');
    
    // Remove unnecessary columns
    console.log('Removing redundant columns...');
    await pool.query(`
      ALTER TABLE products 
        DROP COLUMN IF EXISTS store CASCADE,
        DROP COLUMN IF EXISTS image CASCADE,
        DROP COLUMN IF EXISTS sku CASCADE,
        DROP COLUMN IF EXISTS status CASCADE,
        DROP COLUMN IF EXISTS stock CASCADE;
    `);
    
    // Rename stock_quantity if it exists, otherwise add it
    console.log('Ensuring stock_quantity column exists...');
    await pool.query(`
      ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
    `);
    
    console.log('✅ Products table cleaned up successfully!');
    
    // Show final structure
    const finalStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Final products table structure:');
    finalStructure.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
      const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
      console.log(`  - ${col.column_name}: ${col.data_type}${nullable}${defaultVal}`);
    });
    
    // Check if there's data
    const count = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`\n💾 Total products: ${count.rows[0].count}`);
    
    await pool.end();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

cleanupProductsColumns();
