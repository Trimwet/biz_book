const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'biz_book',
  password: process.env.DB_PASSWORD || 'permitted',
  port: process.env.DB_PORT || 5432
});

async function checkVendor() {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.user_type, v.id as vendor_id, v.business_name
      FROM users u 
      LEFT JOIN vendors v ON u.id = v.user_id 
      WHERE u.email = $1
    `, ['jonahmafuyai25@gmail.com']);
    
    console.log('User and Vendor info:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    if (result.rows.length > 0 && result.rows[0].user_type === 'vendor' && !result.rows[0].vendor_id) {
      console.log('\n❌ ISSUE FOUND: User is a vendor but has no vendor profile!');
      console.log('This user needs a vendor profile to be created.');
    } else if (result.rows.length > 0 && result.rows[0].vendor_id) {
      console.log('\n✅ Vendor profile exists.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkVendor();
