/**
 * Performance indexes migration.
 * Run once: node backend/add-performance-indexes.js
 *
 * Safe to re-run — uses CREATE INDEX IF NOT EXISTS.
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const indexes = [
  // Products: category + status — used by browse and search filters
  `CREATE INDEX IF NOT EXISTS idx_products_category_status
   ON products(category, status)`,

  // Products: vendor + status — used by vendor product manager
  `CREATE INDEX IF NOT EXISTS idx_products_vendor_status
   ON products(vendor_id, status)`,

  // Products: created_at DESC — used by default sort in browse
  `CREATE INDEX IF NOT EXISTS idx_products_created_at
   ON products(created_at DESC)`,

  // Products: price — used by price sort and range filters
  `CREATE INDEX IF NOT EXISTS idx_products_price
   ON products(price)`,

  // Chat messages: conversation + created_at — used by message pagination
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
   ON chat_messages(conversation_id, created_at DESC)`,

  // User events: user + product + type — used by personalization engine
  `CREATE INDEX IF NOT EXISTS idx_user_events_user_product
   ON user_events(user_id, product_id, type)`,

  // User events: type + created_at — used by recommendation ranking
  `CREATE INDEX IF NOT EXISTS idx_user_events_type_created
   ON user_events(type, created_at DESC)`,

  // Wishlist: shopper_id — used by watchlist queries
  `CREATE INDEX IF NOT EXISTS idx_wishlist_shopper
   ON wishlist(shopper_id)`,

  // Search history: user_id — used by search history endpoint
  `CREATE INDEX IF NOT EXISTS idx_search_history_user
   ON search_history(user_id, search_timestamp DESC)`,

  // Refresh tokens: user_id — used on every token refresh
  `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user
   ON refresh_tokens(user_id)`,
];

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔧 Adding performance indexes...\n');
    for (const sql of indexes) {
      const name = sql.match(/idx_\w+/)?.[0] || 'unknown';
      try {
        await client.query(sql);
        console.log(`  ✅ ${name}`);
      } catch (err) {
        console.warn(`  ⚠️  ${name}: ${err.message}`);
      }
    }
    console.log('\n✅ Done.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
