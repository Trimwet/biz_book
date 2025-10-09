require('dotenv').config();
const { Pool } = require('pg');

async function checkPriceTracker() {
  // Connect to postgres database to list all databases
  const pgPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD || 'permitted',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('🔍 Checking for price_tracker database...\n');
    
    // List all databases
    const dbResult = await pgPool.query(
      `SELECT datname FROM pg_database WHERE datname IN ('price_tracker', 'biz_book')`
    );
    
    console.log('Found databases:');
    dbResult.rows.forEach(row => {
      console.log(`  ✓ ${row.datname}`);
    });
    
    await pgPool.end();
    
    // If price_tracker exists, connect to it and list tables
    const hasPriceTracker = dbResult.rows.some(row => row.datname === 'price_tracker');
    
    if (hasPriceTracker) {
      console.log('\n📊 Checking tables in price_tracker database...\n');
      
      const ptPool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: 'price_tracker',
        password: process.env.DB_PASSWORD || 'permitted',
        port: process.env.DB_PORT || 5432,
      });
      
      const tablesResult = await ptPool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log('Tables in price_tracker:');
      if (tablesResult.rows.length === 0) {
        console.log('  (No tables found)');
      } else {
        for (const row of tablesResult.rows) {
          console.log(`  ✓ ${row.table_name}`);
          
          // Get column information
          const columnsResult = await ptPool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position
          `, [row.table_name]);
          
          columnsResult.rows.forEach(col => {
            console.log(`    - ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})`);
          });
          console.log();
        }
        
        // Check row counts
        console.log('Row counts:');
        for (const row of tablesResult.rows) {
          const countResult = await ptPool.query(`SELECT COUNT(*) as count FROM ${row.table_name}`);
          console.log(`  ${row.table_name}: ${countResult.rows[0].count} rows`);
        }
      }
      
      await ptPool.end();
    } else {
      console.log('\n❌ price_tracker database not found');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkPriceTracker();
