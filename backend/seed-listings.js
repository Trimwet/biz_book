require('dotenv').config();
const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'biz_book',
  password: process.env.DB_PASSWORD || 'permitted',
  port: process.env.DB_PORT || 5432,
});

async function seed(count = 2000) {
  console.log(`🌱 Seeding ${count} listings into products table...`);
  const categories = ['Electronics','Fashion','Home','Toys','Sports','Auto'];

  // Detect if status column exists
  const colCheck = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'status'
    ) as exists;
  `);
  const hasStatus = colCheck.rows?.[0]?.exists === true;
  console.log(`→ products.status column ${hasStatus ? 'present' : 'absent'}; seeding accordingly`);

  for (let offset = 0; offset < count; offset += 500) {
    const batchSize = Math.min(500, count - offset);
    const values = [];
    for (let i = 0; i < batchSize; i++) {
      values.push({
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        category: faker.helpers.arrayElement(categories),
        price: faker.number.float({ min: 5, max: 2500, precision: 0.01 }),
        ...(hasStatus ? { status: 'active' } : {}),
      });
    }

    // Insert batch via JSON-to-recordset for speed
    const sql = hasStatus ? `
      INSERT INTO products (name, description, category, price, status)
      SELECT x.name, x.description, x.category, x.price, x.status
      FROM json_to_recordset($1::json) as x(
        name text,
        description text,
        category text,
        price numeric,
        status text
      )
    ` : `
      INSERT INTO products (name, description, category, price)
      SELECT x.name, x.description, x.category, x.price
      FROM json_to_recordset($1::json) as x(
        name text,
        description text,
        category text,
        price numeric
      )
    `;
    await pool.query(sql, [JSON.stringify(values)]);
    process.stdout.write('.');
  }
  console.log('\n✅ Seed complete');
}

seed(parseInt(process.argv[2] || '2000'))
  .catch(err => { console.error('SEED_ERROR:', err.message); process.exitCode = 1; })
  .finally(() => pool.end());