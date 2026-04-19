// Migration: Add products.status column with draft/published/archived states
require('dotenv').config();
const { pool } = require('./utils');

(async () => {
  try {
    // 1) Add status column if it doesn't exist and migrate legacy values
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'draft';
    `);

    await pool.query(`
      UPDATE products 
      SET status = CASE 
        WHEN status = 'active' THEN 'published'
        WHEN status = 'inactive' THEN 'archived'
        ELSE 'draft'
      END
      WHERE status IS NULL OR status IN ('active', 'inactive');
    `);

    // 2) Create indexes (must run in separate statements when using CONCURRENTLY)
    try {
      await pool.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status_vendor ON products (status, vendor_id);`);
    } catch (e) {
      console.warn('Index creation (status,vendor) warning:', e.code || e.message);
    }
    try {
      await pool.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_updated_at ON products (updated_at DESC);`);
    } catch (e) {
      console.warn('Index creation (updated_at) warning:', e.code || e.message);
    }

    console.log('✅ products.status column added and migrated');
    console.log('✅ Existing "active" → "published", "inactive" → "archived"');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
