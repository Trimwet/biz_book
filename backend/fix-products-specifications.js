require('dotenv').config();
const { Pool } = require('pg');

async function fixProductsTable() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'price_tracker',
    password: process.env.DB_PASSWORD || 'permitted',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('🔧 Fixing products table specifications column...\n');
    
    // First, check current column type
    const columnInfo = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'specifications'
    `);
    
    console.log('Current specifications type:', columnInfo.rows[0]?.data_type || 'not found');
    
    // Update any text specifications to NULL or valid JSON first
    console.log('Cleaning up invalid JSON values...');
    await pool.query(`
      UPDATE products 
      SET specifications = NULL 
      WHERE specifications IS NOT NULL 
        AND specifications::text != '' 
        AND specifications::text !~ '^[\\s]*[{\\[]'
    `);
    
    // Now alter the column type
    console.log('Converting specifications column to JSONB...');
    await pool.query(`
      ALTER TABLE products 
      ALTER COLUMN specifications TYPE JSONB 
      USING CASE 
        WHEN specifications IS NULL OR specifications::text = '' THEN NULL
        ELSE specifications::jsonb 
      END
    `);
    
    console.log('✅ Products table updated successfully!');
    
    // Show final structure
    const finalStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nFinal products table structure:');
    finalStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    await pool.end();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixProductsTable();
