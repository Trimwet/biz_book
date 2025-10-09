// Run: node backend/migrate-products-table.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'biz_book',
  password: process.env.DB_PASSWORD || 'permitted',
  port: process.env.DB_PORT || 5432,
});

async function migrate() {
  // Bring the products table up to what the backend expects
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC(12,2) NOT NULL,
      description TEXT,
      store TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Add missing columns if they don't exist
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='description'
      ) THEN
        ALTER TABLE products ADD COLUMN description TEXT;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='category'
      ) THEN
        ALTER TABLE products ADD COLUMN category TEXT;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='image_url'
      ) THEN
        ALTER TABLE products ADD COLUMN image_url TEXT;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='specifications'
      ) THEN
        ALTER TABLE products ADD COLUMN specifications TEXT;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='stock'
      ) THEN
        ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='image'
      ) THEN
        ALTER TABLE products ADD COLUMN image TEXT;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='vendor_id'
      ) THEN
        ALTER TABLE products ADD COLUMN vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
      END IF;

      -- Add sku and status columns
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='sku'
      ) THEN
        ALTER TABLE products ADD COLUMN sku TEXT;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='products' AND column_name='status'
      ) THEN
        ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active';
      END IF;
    END $;
  `);

  console.log('✅ products table migrated');
  await pool.end();
}

migrate().catch((e) => {
  console.error('❌ Migration failed', e);
  process.exit(1);
});