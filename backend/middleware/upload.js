/**
 * Image upload helpers for Fastify + @fastify/multipart.
 * No multer — files are streamed via @fastify/multipart's async iterator.
 *
 * Phase 1 (inline): Sharp resize → local WebP file. API responds immediately.
 * Phase 2 (background): BullMQ worker uploads to Cloudinary, updates DB row.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { enqueueCloudinaryUpload } = require('../queues/imageQueue');

// ─── Cloudinary (sync fallback when BullMQ unavailable) ───────────────────────
let cloudinary = null;
let useCloudinary = false;
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
    useCloudinary = true;
  }
} catch (_) {}

const UPLOADS_DIR = path.join(__dirname, '../uploads/products');

async function ensureUploadsDir() {
  await fs.mkdir(path.join(__dirname, '../uploads'), { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}
ensureUploadsDir();

/**
 * Read all image parts from a Fastify multipart request.
 * Returns an array of processedImage objects ready for DB insertion.
 *
 * @param {FastifyRequest} request
 * @returns {Promise<Array>}
 */
async function processMultipartImages(request) {
  const processed = [];
  const MAX_FILES = 5;
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

  const parts = request.parts();
  for await (const part of parts) {
    if (part.type !== 'file') continue;
    if (!part.mimetype.startsWith('image/')) continue;
    if (processed.length >= MAX_FILES) break;

    // Read file into buffer (respecting size limit)
    const chunks = [];
    let totalSize = 0;
    for await (const chunk of part.file) {
      totalSize += chunk.length;
      if (totalSize > MAX_SIZE) throw new Error('File too large (max 5 MB)');
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const filename = `${uuidv4()}-${Date.now()}.webp`;
    const thumbFilename = `thumb-${filename}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    const thumbPath = path.join(UPLOADS_DIR, thumbFilename);

    await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filepath);

    await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(thumbPath);

    processed.push({
      original: filename,
      thumbnail: thumbFilename,
      originalName: part.filename,
      localFilePath: filepath,
      localThumbPath: thumbPath,
    });
  }

  return processed;
}

/**
 * After product_images rows are inserted, enqueue Cloudinary upload jobs.
 * @param {Array<{imageId, localFilePath, localThumbPath}>} items
 * @param {number} productId
 */
async function enqueueImageUploads(items, productId) {
  if (!useCloudinary) return;

  for (const item of items) {
    const queued = await enqueueCloudinaryUpload({
      productId,
      imageId: item.imageId,
      localFilePath: item.localFilePath,
      localThumbPath: item.localThumbPath,
    });

    // Sync fallback if queue unavailable
    if (!queued && cloudinary) {
      try {
        const buffer = await fs.readFile(item.localFilePath);
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'bizbook/products', resource_type: 'image', format: 'webp' },
            (err, res) => (err ? reject(err) : resolve(res))
          );
          stream.end(buffer);
        });
        const { pool } = require('../utils');
        await pool.query('UPDATE product_images SET image_url = $1 WHERE id = $2', [
          result.secure_url,
          item.imageId,
        ]);
        await fs.unlink(item.localFilePath).catch(() => {});
        await fs.unlink(item.localThumbPath).catch(() => {});
      } catch (err) {
        console.warn('⚠️  Sync Cloudinary fallback failed:', err.message);
      }
    }
  }
}

async function deleteImages(filenames) {
  for (const f of filenames || []) {
    await fs.unlink(path.join(UPLOADS_DIR, f)).catch(() => {});
    await fs.unlink(path.join(UPLOADS_DIR, `thumb-${f}`)).catch(() => {});
  }
}

module.exports = { processMultipartImages, enqueueImageUploads, deleteImages };
