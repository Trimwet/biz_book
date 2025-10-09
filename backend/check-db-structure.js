require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function checkStructure() {
  try {
    console.log('Checking database structure...\n');
    
    // Check products table structure
    const products = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    
    console.log('PRODUCTS TABLE:');
    products.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // Check vendors table structure
    const vendors = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendors' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nVENDORS TABLE:');
    vendors.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log('\nALL TABLES:');
    tables.rows.forEach(row => {
      console.log(`  ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStructure();