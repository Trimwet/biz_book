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
    console.log('🔧 Ensuring products has Nigeria location columns (state, city)...');
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='products' AND column_name='state'
        ) THEN
          ALTER TABLE products ADD COLUMN state TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='products' AND column_name='city'
        ) THEN
          ALTER TABLE products ADD COLUMN city TEXT;
        END IF;
      END$$;
    `);
    console.log('✅ Location columns ensured.');
  } catch (e) {
    console.error('❌ Migration error:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
run();