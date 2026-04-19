/**
 * BullMQ worker: uploads locally-saved images to Cloudinary,
 * then updates the product_images row with the cloud URL.
 *
 * Run standalone:  node backend/workers/imageWorker.js
 * Or import in index.js to run in-process (see bottom of this file).
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../utils');
const { Worker, redisConnection, isRedisAvailable } = require('../queues/imageQueue');

let cloudinary = null;
try {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
} catch (_) {}

/**
 * Upload a local file buffer to Cloudinary.
 * @param {string} filePath
 * @returns {Promise<{secure_url: string, thumb_url: string}>}
 */
async function uploadToCloudinary(filePath) {
  const buffer = await fs.readFile(filePath);

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'bizbook/products', resource_type: 'image', format: 'webp' },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(buffer);
  });

  const thumbUrl = cloudinary.url(result.public_id, {
    secure: true,
    transformation: [
      { width: 200, height: 200, crop: 'fill' },
      { quality: 80, fetch_format: 'webp' },
    ],
  });

  return { secure_url: result.secure_url, thumb_url: thumbUrl };
}

/**
 * Process a single image job.
 */
async function processImageJob(job) {
  const { productId, imageId, localFilePath, localThumbPath } = job.data;

  console.log(`🖼️  Processing image job ${job.id} for product ${productId}`);

  if (!cloudinary) {
    console.warn('⚠️  Cloudinary not configured — skipping cloud upload for job', job.id);
    return { skipped: true };
  }

  // Upload main image
  const { secure_url, thumb_url } = await uploadToCloudinary(localFilePath);

  // Update DB row with cloud URL
  await pool.query(
    `UPDATE product_images SET image_url = $1 WHERE id = $2`,
    [secure_url, imageId]
  );

  console.log(`✅ Image ${imageId} uploaded to Cloudinary: ${secure_url}`);

  // Clean up local files (best-effort)
  try {
    await fs.unlink(localFilePath);
    if (localThumbPath) await fs.unlink(localThumbPath);
  } catch (_) {}

  return { imageId, secure_url, thumb_url };
}

let workerInstance = null;

/**
 * Start the image worker. Safe to call multiple times — only creates one instance.
 */
async function startImageWorker() {
  if (!Worker) {
    console.warn('⚠️  BullMQ not available — image worker not started');
    return null;
  }

  if (workerInstance) return workerInstance;

  try {
    const redisOk = await isRedisAvailable().catch(() => false);
    if (!redisOk) {
      console.warn('⚠️  Redis unavailable — image worker will not be started (jobs will fallback when possible)');
      return null;
    }

    workerInstance = new Worker('image-processing', processImageJob, {
      connection: redisConnection(),
      concurrency: 3,
    });

    workerInstance.on('completed', (job) => {
      console.log(`✅ Image job ${job.id} completed`);
    });

    workerInstance.on('failed', (job, err) => {
      console.error(`❌ Image job ${job?.id} failed:`, err?.message || err);
    });

    workerInstance.on('error', (err) => {
      console.warn('⚠️  Image worker error:', err?.message || err);
    });

    console.log('🖼️  Image worker started');
  } catch (err) {
    console.warn('⚠️  Image worker failed to start:', err?.message || err);
    workerInstance = null;
  }

  return workerInstance;
}

module.exports = { startImageWorker };

// Allow running standalone: node workers/imageWorker.js
if (require.main === module) {
  (async () => {
    await startImageWorker();
    console.log('🖼️  Image worker running standalone...');
  })();
}
