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

async function addSkuColumn() {
  try {
    console.log('🔧 Adding SKU column to products table...\n');
    
    // 1. Check if SKU column already exists
    const columnExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'sku'
      );
    `);
    
    if (columnExists.rows[0].exists) {
      console.log('✅ SKU column already exists');
    } else {
      console.log('❌ SKU column missing. Adding it...');
      
      // Add the SKU column
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN sku VARCHAR(100) UNIQUE;
      `);
      
      console.log('✅ Added SKU column (optional, unique)');
    }
    
    // 2. Show current table structure
    console.log('\n📊 Current products table structure:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);
    
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    console.log('\n🎉 Products table is now ready with SKU column!');
    
  } catch (error) {
    console.error('❌ Error adding SKU column:', error);
  } finally {
    await pool.end();
  }
}

addSkuColumn();