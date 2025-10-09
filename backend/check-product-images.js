require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_images' ORDER BY ordinal_position`)
  .then(r => {
    console.log('product_images table columns:');
    r.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    pool.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    pool.end();
  });
