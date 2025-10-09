const { Pool } = require('./backend/node_modules/pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'biz_book',
  password: process.env.DB_PASSWORD || 'permitted',
  port: process.env.DB_PORT || 5432
});

async function testAnalytics() {
  try {
    console.log('Testing analytics query...\n');
    
    const vendorId = 1;
    const days = 30;
    
    // Test if sales_reports table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_reports'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ sales_reports table does NOT exist');
      console.log('Creating sales_reports table...');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sales_reports (
          id SERIAL PRIMARY KEY,
          vendor_id INTEGER NOT NULL,
          product_id INTEGER,
          quantity INTEGER NOT NULL,
          total_amount NUMERIC(10,2) NOT NULL,
          report_date DATE NOT NULL DEFAULT CURRENT_DATE,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ sales_reports table created');
    } else {
      console.log('✅ sales_reports table exists');
    }
    
    // Test the analytics query
    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_reports, 
        COALESCE(SUM(quantity), 0) as total_quantity_sold, 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_sale_value, 
        COALESCE(AVG(quantity), 0) as average_quantity_per_sale
      FROM sales_reports 
      WHERE vendor_id = $1 AND report_date >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    
    console.log('\nExecuting analytics query...');
    const result = await pool.query(analyticsQuery, [vendorId]);
    
    console.log('✅ Analytics query successful!');
    console.log('Results:', result.rows[0]);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

testAnalytics();
