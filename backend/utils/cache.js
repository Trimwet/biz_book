/**
 * Redis cache layer with graceful fallback.
 * If Redis is unavailable, all cache operations are no-ops and the app
 * continues to work normally — just without caching.
 */

let Redis;
try {
  Redis = require('ioredis');
} catch (_) {
  Redis = null;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let client = null;
let connected = false;

function getClient() {
  if (!Redis) return null;
  if (client) return client;

  try {
    client = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 3000,
    });

    client.on('connect', () => {
      connected = true;
      console.log('✅ Redis connected');
    });

    client.on('error', (err) => {
      if (connected) console.warn('⚠️  Redis error (cache disabled):', err.message);
      connected = false;
    });

    client.on('close', () => {
      connected = false;
    });

    client.connect().catch(() => {
      // Silently fail — app runs without cache
    });
  } catch (_) {
    client = null;
  }

  return client;
}

// Initialise on module load
getClient();

/**
 * Get a cached value. Returns null on miss or Redis unavailable.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function get(key) {
  const c = getClient();
  if (!c || !connected) return null;
  try {
    const raw = await c.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Set a cached value with optional TTL in seconds (default 60s).
 * @param {string} key
 * @param {any} value
 * @param {number} ttl  seconds
 */
async function set(key, value, ttl = 60) {
  const c = getClient();
  if (!c || !connected) return;
  try {
    await c.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (_) {
    // Silently ignore
  }
}

/**
 * Delete one or more keys (supports glob patterns via SCAN+DEL).
 * @param {string|string[]} keys  exact keys or a single glob pattern
 */
async function del(keys) {
  const c = getClient();
  if (!c || !connected) return;
  try {
    if (Array.isArray(keys)) {
      if (keys.length) await c.del(...keys);
    } else if (typeof keys === 'string' && (keys.includes('*') || keys.includes('?'))) {
      // Pattern delete via SCAN
      let cursor = '0';
      do {
        const [nextCursor, found] = await c.scan(cursor, 'MATCH', keys, 'COUNT', 100);
        cursor = nextCursor;
        if (found.length) await c.del(...found);
      } while (cursor !== '0');
    } else {
      await c.del(keys);
    }
  } catch (_) {
    // Silently ignore
  }
}

/**
 * Bust all product-related cache keys for a given vendor.
 * Call this whenever a vendor mutates their products.
 * @param {number|string} vendorId
 */
async function bustProductCache(vendorId) {
  await Promise.all([
    del('products:browse:*'),
    del('products:categories'),
    del('products:search:*'),
    vendorId ? del(`products:vendor:${vendorId}:*`) : Promise.resolve(),
  ]);
}

/**
 * Bust cache for a specific product detail.
 * @param {number|string} productId
 */
async function bustProductDetail(productId) {
  await del(`products:detail:${productId}`);
}

module.exports = { get, set, del, bustProductCache, bustProductDetail, getClient };
