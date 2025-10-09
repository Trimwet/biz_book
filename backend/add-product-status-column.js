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

async function addStatusColumn() {
  try {
    console.log('🔧 Adding status column to products table...\n');
    
    // 1. Check if status column already exists
    const columnExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'status'
      );
    `);
    
    if (columnExists.rows[0].exists) {
      console.log('✅ Status column already exists');
    } else {
      console.log('❌ Status column missing. Adding it...');
      
      // Add the status column
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
      `);
      
      console.log('✅ Added status column with default value "active"');
      
      // Update all existing products to have 'active' status
      const updateResult = await pool.query(`
        UPDATE products 
        SET status = 'active' 
        WHERE status IS NULL
        RETURNING id, name, status
      `);
      
      console.log(`✅ Set ${updateResult.rows.length} products to active status`);
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
    
    // 3. Show sample products with status
    console.log('\n📋 Sample products with status:');
    const products = await pool.query(`
      SELECT id, name, stock_quantity, status 
      FROM products 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    products.rows.forEach(product => {
      console.log(`  - ID: ${product.id}, Name: "${product.name}", Stock: ${product.stock_quantity}, Status: ${product.status}`);
    });
    
    console.log('\n🎉 Products table is now ready with status column!');
    
  } catch (error) {
    console.error('❌ Error adding status column:', error);
  } finally {
    await pool.end();
  }
}

addStatusColumn();