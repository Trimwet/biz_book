require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'biz_book',
  password: process.env.DB_PASSWORD || 'permitted',
  port: process.env.DB_PORT || 5432,
});

async function run() {
  try {
    console.log('🔧 Applying marketplace columns to products table...');

    // Add columns if missing
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='products' AND column_name='status'
        ) THEN
          ALTER TABLE products 
            ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','sold','paused'));
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='products' AND column_name='condition'
        ) THEN
          ALTER TABLE products 
            ADD COLUMN condition VARCHAR(20) CHECK (condition IN ('new','like_new','good','fair','poor'));
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='products' AND column_name='location_lat'
        ) THEN
          ALTER TABLE products 
            ADD COLUMN location_lat DOUBLE PRECISION,
            ADD COLUMN location_lng DOUBLE PRECISION;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='products' AND column_name='media'
        ) THEN
          ALTER TABLE products 
            ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
        END IF;
      END$$;
    `);

    // Helpful indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)`);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_search 
      ON products USING GIN (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,'')));
    `);

    console.log('✅ Marketplace columns and indexes ensured.');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();