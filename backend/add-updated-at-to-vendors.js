'use strict';
/**
 * Migration: add updated_at column to vendors table.
 * 
 * Run once: node backend/add-updated-at-to-vendors.js
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
    console.log('Adding updated_at column to vendors...');
    await client.query(`
      ALTER TABLE vendors
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✅ Done. updated_at column added to vendors table.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
