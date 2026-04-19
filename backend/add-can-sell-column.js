'use strict';
/**
 * Migration: add can_sell flag to users table.
 * Enables the hybrid unified-account model — a shopper can unlock vendor
 * capabilities without creating a second account.
 *
 * Run once: node backend/add-can-sell-column.js
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

async function run() {
  const client = await pool.connect();
  try {
    console.log('Adding can_sell column to users...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS can_sell BOOLEAN NOT NULL DEFAULT false
    `);
    // Existing vendors already have selling rights
    await client.query(`
      UPDATE users SET can_sell = true WHERE user_type = 'vendor'
    `);
    console.log('✅ Done. Existing vendors backfilled with can_sell = true.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
