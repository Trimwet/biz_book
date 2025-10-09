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
    console.log('🔧 Creating helpful indexes on products...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at)`);
    console.log('✅ Indexes ensured.');
  } catch (e) {
    console.error('❌ Index migration error:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
run();