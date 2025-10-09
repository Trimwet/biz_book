require('dotenv').config();
const { Pool } = require('pg');

async function verifyConnection() {
  console.log('🔍 Verifying database connection...\n');
  
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'price_tracker',
    password: process.env.DB_PASSWORD || 'permitted',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('Database Configuration:');
    console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  Port: ${process.env.DB_PORT || 5432}`);
    console.log(`  Database: ${process.env.DB_NAME || 'price_tracker'}`);
    console.log(`  User: ${process.env.DB_USER || 'postgres'}\n`);
    
    // Test connection
    const result = await pool.query('SELECT NOW() as now, current_database() as database');
    console.log('✅ Connection successful!');
    console.log(`  Current database: ${result.rows[0].database}`);
    console.log(`  Server time: ${result.rows[0].now}\n`);
    
    // Check all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Get row counts for main tables
    console.log('\n📈 Data Summary:');
    const mainTables = ['users', 'vendors', 'shoppers', 'products', 'reviews', 'wishlist', 'sales_reports'];
    
    for (const table of mainTables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${countResult.rows[0].count} rows`);
      } catch (err) {
        console.log(`  ${table}: error (${err.message})`);
      }
    }
    
    console.log('\n✅ Database is ready for use!');
    
    await pool.end();
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('\nPlease check:');
    console.error('  1. PostgreSQL is running');
    console.error('  2. Database credentials are correct');
    console.error('  3. price_tracker database exists');
    process.exit(1);
  }
}

verifyConnection();
