require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_images'
      ORDER BY ordinal_position;
    `);
    console.log('Product_images table columns:', result.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    
    // Also check if the table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'product_images'
      );
    `);
    console.log('Table exists:', tableExists.rows[0].exists);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();