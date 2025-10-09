require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_reports' ORDER BY ordinal_position`)
  .then(r => {
    console.log('sales_reports columns:', r.rows.map(c => c.column_name).join(', '));
    pool.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    pool.end();
  });
