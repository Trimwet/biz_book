require('dotenv').config();
const { pool } = require('./utils');

(async () => {
  try {
    const cols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('Users columns:', cols.rows.map(r => r.column_name).join(', '));
    const sample = await pool.query('SELECT id, email FROM users ORDER BY id ASC LIMIT 3');
    console.log('Sample users:', sample.rows);
    process.exit(0);
  } catch (e) {
    console.error('Check failed:', e.message);
    process.exit(1);
  }
})();
