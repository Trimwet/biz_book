// Simple migration to create user_events table if it doesn't exist
require('dotenv').config();
const { pool } = require('./utils');

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NULL,
        product_id INTEGER NULL,
        type VARCHAR(64) NOT NULL,
        metadata JSONB NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_user_events_product_type_time ON user_events (product_id, type, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_events_type_time ON user_events (type, created_at DESC);
    `);
    console.log('✅ user_events table ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();