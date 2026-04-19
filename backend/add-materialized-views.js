/**
 * Materialized views for vendor analytics.
 * Run once: node backend/add-materialized-views.js
 *
 * These views are refreshed every 5 minutes via a scheduled query.
 * They replace expensive real-time aggregations in the analytics endpoints.
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

const views = [
  // ── Vendor sales summary ────────────────────────────────────────────────────
  {
    name: 'vendor_sales_summary',
    sql: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS vendor_sales_summary AS
      SELECT
        p.vendor_id,
        COUNT(DISTINCT p.id)                          AS total_products,
        COUNT(DISTINCT CASE WHEN p.status = 'published' THEN p.id END) AS published_products,
        COALESCE(SUM(p.price * p.stock_quantity), 0)  AS total_inventory_value,
        COALESCE(AVG(r.rating), 0)                    AS avg_rating,
        COUNT(r.id)                                   AS total_reviews,
        MAX(p.updated_at)                             AS last_updated
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      GROUP BY p.vendor_id
    `,
    index: `CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_sales_summary_vendor
            ON vendor_sales_summary(vendor_id)`,
  },

  // ── Category price stats ────────────────────────────────────────────────────
  {
    name: 'category_price_stats',
    sql: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS category_price_stats AS
      SELECT
        category,
        COUNT(*)                    AS product_count,
        MIN(price)                  AS min_price,
        MAX(price)                  AS max_price,
        AVG(price)                  AS avg_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS median_price
      FROM products
      WHERE status IN ('published', 'active') OR status IS NULL
      GROUP BY category
    `,
    index: `CREATE UNIQUE INDEX IF NOT EXISTS idx_category_price_stats_cat
            ON category_price_stats(category)`,
  },

  // ── Daily search trends ─────────────────────────────────────────────────────
  {
    name: 'daily_search_trends',
    sql: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS daily_search_trends AS
      SELECT
        DATE_TRUNC('day', search_timestamp) AS day,
        search_query,
        COUNT(*)                            AS search_count,
        COUNT(DISTINCT user_id)             AS unique_users
      FROM search_history
      WHERE search_timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', search_timestamp), search_query
      ORDER BY day DESC, search_count DESC
    `,
    index: `CREATE INDEX IF NOT EXISTS idx_daily_search_trends_day
            ON daily_search_trends(day DESC)`,
  },

  // ── Product view counts (from user_events) ──────────────────────────────────
  {
    name: 'product_view_counts',
    sql: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS product_view_counts AS
      SELECT
        product_id,
        COUNT(*)                                          AS total_views,
        COUNT(DISTINCT user_id)                           AS unique_viewers,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')  AS views_7d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS views_30d
      FROM user_events
      WHERE type = 'view_item' AND product_id IS NOT NULL
      GROUP BY product_id
    `,
    index: `CREATE UNIQUE INDEX IF NOT EXISTS idx_product_view_counts_product
            ON product_view_counts(product_id)`,
  },
];

// Refresh function — call this on a schedule (e.g., every 5 minutes via cron or setInterval)
const refreshSQL = views.map(
  (v) => `REFRESH MATERIALIZED VIEW CONCURRENTLY ${v.name};`
).join('\n');

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔧 Creating materialized views...\n');

    for (const view of views) {
      try {
        await client.query(view.sql);
        console.log(`  ✅ ${view.name}`);
        await client.query(view.index);
        console.log(`     └─ index created`);
      } catch (err) {
        console.warn(`  ⚠️  ${view.name}: ${err.message}`);
      }
    }

    console.log('\n📋 To refresh all views (run every 5 min via cron):');
    console.log(refreshSQL);
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
