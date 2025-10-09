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

async function fixProductImagesTable() {
  try {
    console.log('🔍 Checking product_images table...');
    
    // Check if the table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'product_images'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ product_images table does not exist. Creating it...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS product_images (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
          image_url VARCHAR(500) NOT NULL,
          is_primary BOOLEAN DEFAULT false,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Created product_images table');
    } else {
      console.log('✅ product_images table exists');
      
      // Check if display_order column exists
      const columnExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'product_images' AND column_name = 'display_order'
        );
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log('❌ display_order column missing. Adding it...');
        await pool.query(`
          ALTER TABLE product_images 
          ADD COLUMN display_order INTEGER DEFAULT 0;
        `);
        console.log('✅ Added display_order column');
      } else {
        console.log('✅ display_order column already exists');
      }
    }
    
    // Show current table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'product_images'
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Current product_images table structure:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    console.log('✅ product_images table is ready!');
    
  } catch (error) {
    console.error('❌ Error fixing product_images table:', error);
  } finally {
    await pool.end();
  }
}

fixProductImagesTable();