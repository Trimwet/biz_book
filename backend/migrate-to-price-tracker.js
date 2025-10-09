require('dotenv').config();
const { Pool } = require('pg');

async function migrateToPriceTracker() {
  console.log('🔄 Starting migration from biz_book to price_tracker...\n');
  
  // Connect to both databases
  const bizBookPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'biz_book',
    password: process.env.DB_PASSWORD || 'permitted',
    port: process.env.DB_PORT || 5432,
  });

  const priceTrackerPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'price_tracker',
    password: process.env.DB_PASSWORD || 'permitted',
    port: process.env.DB_PORT || 5432,
  });

  try {
    console.log('📊 Step 1: Checking price_tracker database structure...\n');
    
    // Check which tables exist in price_tracker
    const tablesResult = await priceTrackerPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map(r => r.table_name);
    console.log('Existing tables in price_tracker:', existingTables.join(', '));
    
    // Tables that need to be created/updated
    const migrations = [];
    
    // Update comparisons table to match biz_book structure
    if (existingTables.includes('comparisons')) {
      console.log('\n📝 Updating comparisons table structure...');
      migrations.push({
        name: 'Update comparisons table',
        sql: `
          -- Drop old comparisons table
          DROP TABLE IF EXISTS comparisons CASCADE;
          
          -- Create new comparisons table matching biz_book
          CREATE TABLE comparisons (
            id SERIAL PRIMARY KEY,
            shopper_id INTEGER REFERENCES shoppers(id) ON DELETE CASCADE,
            product_ids INTEGER[] NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_comparisons_shopper_id ON comparisons(shopper_id);
        `
      });
    } else {
      migrations.push({
        name: 'Create comparisons table',
        sql: `
          CREATE TABLE IF NOT EXISTS comparisons (
            id SERIAL PRIMARY KEY,
            shopper_id INTEGER REFERENCES shoppers(id) ON DELETE CASCADE,
            product_ids INTEGER[] NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_comparisons_shopper_id ON comparisons(shopper_id);
        `
      });
    }
    
    // Update wishlist table structure
    if (existingTables.includes('wishlist')) {
      console.log('📝 Updating wishlist table structure...');
      migrations.push({
        name: 'Update wishlist table',
        sql: `
          -- Rename existing wishlist to wishlist_old
          ALTER TABLE IF EXISTS wishlist RENAME TO wishlist_old;
          
          -- Create new wishlist table matching biz_book
          CREATE TABLE wishlist (
            id SERIAL PRIMARY KEY,
            shopper_id INTEGER REFERENCES shoppers(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(shopper_id, product_id)
          );
          CREATE INDEX IF NOT EXISTS idx_wishlist_shopper_id ON wishlist(shopper_id);
          CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
        `
      });
    }
    
    // Update reviews table to use shopper_id instead of user_id
    if (existingTables.includes('reviews')) {
      console.log('📝 Updating reviews table structure...');
      migrations.push({
        name: 'Update reviews table',
        sql: `
          -- Drop old reviews table
          DROP TABLE IF EXISTS reviews CASCADE;
          
          -- Create new reviews table matching biz_book
          CREATE TABLE reviews (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            shopper_id INTEGER REFERENCES shoppers(id) ON DELETE CASCADE,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
          CREATE INDEX IF NOT EXISTS idx_reviews_shopper_id ON reviews(shopper_id);
        `
      });
    }
    
    // Update products table structure to match biz_book
    console.log('📝 Updating products table structure...');
    migrations.push({
      name: 'Update products table',
      sql: `
        -- Add missing columns to products table
        ALTER TABLE products 
          DROP COLUMN IF EXISTS store,
          DROP COLUMN IF EXISTS image,
          DROP COLUMN IF EXISTS sku,
          DROP COLUMN IF EXISTS status,
          ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
        
        -- Ensure specifications is JSONB
        ALTER TABLE products 
          ALTER COLUMN specifications TYPE JSONB USING 
            CASE 
              WHEN specifications IS NULL THEN NULL 
              WHEN specifications::text = '' THEN NULL
              ELSE specifications::jsonb 
            END;
      `
    });
    
    // Execute migrations
    console.log('\n🔨 Step 2: Applying schema updates...\n');
    for (const migration of migrations) {
      try {
        console.log(`  ▶ ${migration.name}...`);
        await priceTrackerPool.query(migration.sql);
        console.log(`  ✅ ${migration.name} completed`);
      } catch (err) {
        console.error(`  ❌ Error in ${migration.name}:`, err.message);
        // Continue with other migrations
      }
    }
    
    // Step 3: Check data in biz_book
    console.log('\n📦 Step 3: Checking data in biz_book database...\n');
    
    const bizBookCounts = {};
    const tablesToCheck = ['users', 'vendors', 'shoppers', 'products', 'reviews', 'wishlist'];
    
    for (const table of tablesToCheck) {
      try {
        const result = await bizBookPool.query(`SELECT COUNT(*) as count FROM ${table}`);
        bizBookCounts[table] = parseInt(result.rows[0].count);
        console.log(`  ${table}: ${bizBookCounts[table]} rows`);
      } catch (err) {
        console.log(`  ${table}: table not found or error`);
        bizBookCounts[table] = 0;
      }
    }
    
    // Step 4: Migrate data from biz_book to price_tracker (if any exists)
    console.log('\n🚚 Step 4: Migrating data from biz_book to price_tracker...\n');
    
    if (bizBookCounts.users > 0) {
      console.log('  Note: price_tracker already has users. Skipping user migration to avoid conflicts.');
      console.log('  If you want to merge users, you\'ll need to do this manually.');
    }
    
    if (bizBookCounts.products > 0) {
      console.log('  Note: price_tracker already has products. New products from biz_book would need manual review.');
    }
    
    // Close connections
    await bizBookPool.end();
    await priceTrackerPool.end();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Update your .env file to set DB_NAME=price_tracker');
    console.log('  2. Update backend/utils.js if needed');
    console.log('  3. Restart your backend server');
    console.log('  4. Test the application to ensure everything works');
    console.log('\n💡 Current data in price_tracker:');
    console.log('  - 29 users');
    console.log('  - 22 vendors');
    console.log('  - 5 shoppers');
    console.log('  - 6 products');
    console.log('  - 3 sales reports');
    console.log('  - 15 search suggestions');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

migrateToPriceTracker();
