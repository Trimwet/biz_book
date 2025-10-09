require('dotenv').config();
const { Pool } = require('pg');

async function verifyBizbookDb() {
  console.log('🔍 Verifying Bizbook_db connection...\n');
  
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'Bizbook_db',
    password: process.env.DB_PASSWORD || 'permitted',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('📋 Configuration:');
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}\n`);
    
    // Test connection
    const result = await pool.query('SELECT NOW() as now, current_database() as database');
    console.log('✅ Connection successful!');
    console.log(`   Current database: ${result.rows[0].database}`);
    console.log(`   Server time: ${result.rows[0].now}\n`);
    
    // Get data summary
    const dataSummary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM vendors) as vendors,
        (SELECT COUNT(*) FROM shoppers) as shoppers,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM reviews) as reviews,
        (SELECT COUNT(*) FROM wishlist) as wishlist,
        (SELECT COUNT(*) FROM sales_reports) as sales_reports
    `);
    
    console.log('📊 Data Summary:');
    console.log(`   Users: ${dataSummary.rows[0].users}`);
    console.log(`   Vendors: ${dataSummary.rows[0].vendors}`);
    console.log(`   Shoppers: ${dataSummary.rows[0].shoppers}`);
    console.log(`   Products: ${dataSummary.rows[0].products}`);
    console.log(`   Reviews: ${dataSummary.rows[0].reviews}`);
    console.log(`   Wishlist: ${dataSummary.rows[0].wishlist}`);
    console.log(`   Sales Reports: ${dataSummary.rows[0].sales_reports}`);
    
    console.log('\n✅ Bizbook_db is ready to use!');
    console.log('\n🚀 You can now start your backend server:');
    console.log('   npm start');
    
    await pool.end();
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('\nPlease check:');
    console.error('  1. .env file has DB_NAME=Bizbook_db');
    console.error('  2. PostgreSQL is running');
    console.error('  3. Database credentials are correct');
    process.exit(1);
  }
}

verifyBizbookDb();
