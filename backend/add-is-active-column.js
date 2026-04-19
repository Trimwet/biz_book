require('dotenv').config();
const { pool } = require('./utils');

(async () => {
  try {
    console.log('🔧 Ensuring users.is_active column exists...');

    // Add the column if it doesn't exist
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    `);

    // Backfill NULLs to TRUE
    await pool.query(`
      UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
    `);

    // Optional: index for queries that filter by active users
    try {
      await pool.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active ON users (is_active);`);
    } catch (e) {
      console.warn('Index creation (users.is_active) warning:', e.code || e.message);
    }

    console.log('✅ users.is_active ensured and backfilled.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
