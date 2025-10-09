require('dotenv').config();
const { Pool } = require('pg');

async function renameDatabase() {
  console.log('🔄 Renaming database: price_tracker → Bizbook_db\n');
  
  // Connect to postgres database (not the one we're renaming)
  const pgPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD || 'permitted',
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Step 1: Check if price_tracker exists
    console.log('Step 1: Checking for price_tracker database...');
    const checkOld = await pgPool.query(
      `SELECT 1 FROM pg_database WHERE datname = 'price_tracker'`
    );
    
    if (checkOld.rows.length === 0) {
      console.log('❌ price_tracker database not found!');
      await pgPool.end();
      process.exit(1);
    }
    console.log('✅ Found price_tracker database\n');
    
    // Step 2: Check if Bizbook_db already exists
    console.log('Step 2: Checking if Bizbook_db already exists...');
    const checkNew = await pgPool.query(
      `SELECT 1 FROM pg_database WHERE datname = 'Bizbook_db'`
    );
    
    if (checkNew.rows.length > 0) {
      console.log('⚠️  Bizbook_db already exists!');
      console.log('Please choose one of the following options:');
      console.log('  1. Drop existing Bizbook_db first');
      console.log('  2. Use a different name');
      await pgPool.end();
      process.exit(1);
    }
    console.log('✅ Bizbook_db does not exist (good!)\n');
    
    // Step 3: Terminate all connections to price_tracker
    console.log('Step 3: Terminating connections to price_tracker...');
    await pgPool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = 'price_tracker'
        AND pid <> pg_backend_pid()
    `);
    console.log('✅ All connections terminated\n');
    
    // Step 4: Rename the database
    console.log('Step 4: Renaming database...');
    await pgPool.query(`ALTER DATABASE price_tracker RENAME TO "Bizbook_db"`);
    console.log('✅ Database renamed successfully!\n');
    
    // Step 5: Verify the new database
    console.log('Step 5: Verifying new database...');
    const verify = await pgPool.query(
      `SELECT datname FROM pg_database WHERE datname = 'Bizbook_db'`
    );
    
    if (verify.rows.length > 0) {
      console.log('✅ Verified: Bizbook_db exists\n');
    } else {
      console.log('❌ Verification failed!');
      await pgPool.end();
      process.exit(1);
    }
    
    await pgPool.end();
    
    // Step 6: Test connection to new database
    console.log('Step 6: Testing connection to Bizbook_db...');
    const newPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'Bizbook_db',
      password: process.env.DB_PASSWORD || 'permitted',
      port: process.env.DB_PORT || 5432,
    });
    
    const testResult = await newPool.query('SELECT current_database() as db, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log(`✅ Connected to: ${testResult.rows[0].db}`);
    console.log(`✅ Tables found: ${testResult.rows[0].table_count}\n`);
    
    // Get data summary
    const dataSummary = await newPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM vendors) as vendors,
        (SELECT COUNT(*) FROM shoppers) as shoppers,
        (SELECT COUNT(*) FROM products) as products
    `);
    
    console.log('📊 Data Summary:');
    console.log(`   Users: ${dataSummary.rows[0].users}`);
    console.log(`   Vendors: ${dataSummary.rows[0].vendors}`);
    console.log(`   Shoppers: ${dataSummary.rows[0].shoppers}`);
    console.log(`   Products: ${dataSummary.rows[0].products}`);
    
    await newPool.end();
    
    console.log('\n✅ Database rename completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update your .env file: DB_NAME=Bizbook_db');
    console.log('   2. Restart your backend server');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    await pgPool.end();
    process.exit(1);
  }
}

renameDatabase();
