const { Pool } = require('./backend/node_modules/pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'biz_book',
  password: process.env.DB_PASSWORD || 'permitted',
  port: process.env.DB_PORT || 5432
});

async function checkTableStructure() {
  try {
    // Check if product_images table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'product_images'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ product_images table does NOT exist');
    } else {
      console.log('✅ product_images table exists');
      
      // Get column information
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'product_images'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Columns in product_images table:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
    
    // Also check products table
    console.log('\n📋 Columns in products table:');
    const productColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'products'
      ORDER BY ordinal_position
    `);
    
    productColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check sales_reports table
    console.log('\n📋 Columns in sales_reports table:');
    const salesColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'sales_reports'
      ORDER BY ordinal_position
    `);
    
    if (salesColumns.rows.length === 0) {
      console.log('  ❌ Table does not exist');
    } else {
      salesColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
