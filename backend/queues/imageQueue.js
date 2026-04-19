/**
 * BullMQ image processing queue.
 * Falls back gracefully if Redis / BullMQ is unavailable.
 */

let Queue, Worker;
try {
  ({ Queue, Worker } = require('bullmq'));
} catch (_) {
  Queue = null;
  Worker = null;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse redis connection options from URL
function redisConnection() {
  try {
    const url = new URL(REDIS_URL);
    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      maxRetriesPerRequest: null, // required by BullMQ
    };
  } catch (_) {
    return { host: 'localhost', port: 6379, maxRetriesPerRequest: null };
  }
}

// Quick runtime check to see if Redis is reachable. Returns a boolean.
async function isRedisAvailable() {
  try {
    const IORedis = require('ioredis');
    const base = redisConnection();
    // Create a short-lived client with reconnection disabled to avoid noisy retries
    const opts = {
      host: base.host || 'localhost',
      port: base.port || 6379,
      password: base.password || undefined,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      enableOfflineQueue: false,
    };

    const client = new IORedis(opts);

    return await new Promise((resolve) => {
      let settled = false;
      const cleanup = () => {
        try { client.removeAllListeners(); client.disconnect(); } catch (_) {}
      };

      client.once('ready', () => { if (!settled) { settled = true; cleanup(); resolve(true); } });
      client.once('error', () => { if (!settled) { settled = true; cleanup(); resolve(false); } });

      // Fallback timeout in case events don't fire
      setTimeout(() => { if (!settled) { settled = true; cleanup(); resolve(false); } }, 3000);
    });
  } catch (err) {
    return false;
  }
}

let imageQueue = null;

function getImageQueue() {
  if (!Queue) return null;
  if (imageQueue) return imageQueue;

  try {
    imageQueue = new Queue('image-processing', {
      connection: redisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    imageQueue.on('error', (err) => {
      console.warn('⚠️  Image queue error (jobs will be skipped):', err.message);
    });
  } catch (err) {
    console.warn('⚠️  BullMQ queue init failed (image jobs disabled):', err.message);
    imageQueue = null;
  }

  return imageQueue;
}

/**
 * Enqueue a Cloudinary upload job.
 * @param {object} jobData
 * @param {number} jobData.productId
 * @param {number} jobData.imageId       - product_images row id
 * @param {string} jobData.localFilePath - absolute path to the local webp file
 * @param {string} jobData.localThumbPath
 */
async function enqueueCloudinaryUpload(jobData) {
  const q = getImageQueue();
  if (!q) return false; // graceful no-op

  try {
    await q.add('cloudinary-upload', jobData, { priority: 1 });
    return true;
  } catch (err) {
    console.warn('⚠️  Failed to enqueue image job:', err.message);
    return false;
  }
}

module.exports = { getImageQueue, enqueueCloudinaryUpload, redisConnection, Worker, isRedisAvailable };
