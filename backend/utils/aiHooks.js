const { pool } = require('../utils');
const { securityMonitor } = require('./securityMonitor');

// Simple keyword list for basic content risk checks
const BANNED_WORDS = ['scam', 'fraud', 'counterfeit', 'fake', 'pirated'];

async function recordInternalEvent(type, payload = {}) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS internal_events (
        id SERIAL PRIMARY KEY,
        type VARCHAR(64) NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(
      `INSERT INTO internal_events (type, payload) VALUES ($1, $2)`,
      [type, payload]
    );
  } catch (e) {
    console.warn('AI_HOOKS_INTERNAL_EVENT_ERROR:', e.message);
  }
}

async function recordUserEvent({ userId = null, productId = null, type, metadata = null }) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NULL,
        product_id INTEGER NULL,
        type VARCHAR(64) NOT NULL,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(
      `INSERT INTO user_events (user_id, product_id, type, metadata) VALUES ($1, $2, $3, $4)`,
      [userId, productId, type, metadata]
    );
  } catch (e) {
    console.warn('AI_HOOKS_USER_EVENT_ERROR:', e.message);
  }
}

function keywordFlags(text) {
  const flags = [];
  if (!text || typeof text !== 'string') return flags;
  const lower = text.toLowerCase();
  for (const w of BANNED_WORDS) {
    if (lower.includes(w)) flags.push(`keyword:${w}`);
  }
  return flags;
}

async function analyzeProductRisk(productId) {
  try {
    // Fetch current product
    const { rows } = await pool.query(
      `SELECT id, name, description, category, price, vendor_id FROM products WHERE id = $1`,
      [productId]
    );
    const p = rows[0];
    if (!p) return null;

    const flags = [...keywordFlags(p.description), ...keywordFlags(p.name)];

    // Category price baseline (last 90 days, excluding null/zero)
    let baseline = null;
    try {
      const q = await pool.query(
        `SELECT AVG(price)::numeric AS avg_price
         FROM products
         WHERE category = $1 AND price IS NOT NULL AND price > 0 AND updated_at >= NOW() - INTERVAL '90 days'`,
        [p.category]
      );
      baseline = q.rows[0]?.avg_price ? parseFloat(q.rows[0].avg_price) : null;
    } catch (_) {}

    let priceRisk = 0;
    if (baseline && p.price) {
      const ratio = p.price / baseline;
      if (ratio >= 1.8) { flags.push('price:too_high_vs_category'); priceRisk += 40; }
      else if (ratio <= 0.5) { flags.push('price:too_low_vs_category'); priceRisk += 30; }
    }

    // Aggregate risk score
    const riskScore = Math.min(100, flags.length * 10 + priceRisk);

    // Upsert into product_ai_flags
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_ai_flags (
        product_id INTEGER PRIMARY KEY,
        risk_score INTEGER NOT NULL DEFAULT 0,
        flags JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(
      `INSERT INTO product_ai_flags (product_id, risk_score, flags, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (product_id) DO UPDATE SET risk_score = EXCLUDED.risk_score, flags = EXCLUDED.flags, updated_at = NOW()`,
      [productId, riskScore, JSON.stringify(flags)]
    );

    // If highly risky, let security monitor log a suspicious activity (non-blocking)
    if (riskScore >= 70) {
      try {
        securityMonitor.detectSuspiciousActivity(p.vendor_id, 'PRODUCT_RISK_HIGH', { productId, riskScore, flags });
      } catch (_) {}
    }

    return { riskScore, flags };
  } catch (e) {
    console.warn('AI_HOOKS_ANALYZE_PRODUCT_RISK_ERROR:', e.message);
    return null;
  }
}

async function onProductMutated({ productId, vendorId, action, before = null, after = null }) {
  // Fire-and-forget; don't block request
  setImmediate(async () => {
    try {
      await recordInternalEvent('product.mutated', { productId, vendorId, action });
      await recordUserEvent({ userId: vendorId, productId, type: 'catalog_update', metadata: { action } });

      // Extra flag: large price delta
      if (before && after && before.price && after.price) {
        const prev = Number(before.price);
        const next = Number(after.price);
        if (Number.isFinite(prev) && Number.isFinite(next) && prev > 0) {
          const deltaPct = Math.abs(next - prev) / prev * 100;
          if (deltaPct >= 50) {
            await recordInternalEvent('product.price_jump', { productId, vendorId, deltaPct, prev, next });
          }
        }
      }

      await analyzeProductRisk(productId);
    } catch (e) {
      console.warn('AI_HOOKS_ON_PRODUCT_MUTATED_ERROR:', e.message);
    }
  });
}

async function onSaleRecorded({ vendorId, productId = null, quantity, totalAmount }) {
  setImmediate(async () => {
    try {
      await recordInternalEvent('sale.recorded', { vendorId, productId, quantity, totalAmount });
      await recordUserEvent({ userId: vendorId, productId, type: 'sale_recorded', metadata: { quantity, totalAmount } });
      if (productId) {
        await analyzeProductRisk(productId); // keep flags reasonably fresh
      }
    } catch (e) {
      console.warn('AI_HOOKS_ON_SALE_RECORDED_ERROR:', e.message);
    }
  });
}

module.exports = {
  onProductMutated,
  analyzeProductRisk,
  onSaleRecorded,
};
