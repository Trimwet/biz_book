require('dotenv').config();
const { Pool } = require('pg');

// Connect to postgres database to create our app database
const setupPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default postgres database
  password: process.env.DB_PASSWORD || 'permitted',
  port: process.env.DB_PORT || 5432,
});

const dbName = process.env.DB_NAME || 'biz_book';

async function setupDatabase() {
  try {
    console.log(`🔧 Setting up database: ${dbName}`);
    
    // Check if database exists
    const checkDb = await setupPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDb.rows.length === 0) {
      // Create database
      console.log(`📦 Creating database: ${dbName}`);
      await setupPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database ${dbName} created successfully`);
    } else {
      console.log(`✅ Database ${dbName} already exists`);
    }

    await setupPool.end();
    
    // Now connect to the new database and run migrations
    console.log('\n🔄 Running migrations...\n');
    
    const appPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'permitted',
      port: process.env.DB_PORT || 5432,
    });

    // Run migrations in order
    const migrations = [
      {
        name: 'users table',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('vendor', 'shopper', 'admin')),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
        `
      },
      {
        name: 'vendors table',
        sql: `
          CREATE TABLE IF NOT EXISTS vendors (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            business_name VARCHAR(255) NOT NULL,
            business_description TEXT,
            category VARCHAR(100),
            location VARCHAR(255),
            phone VARCHAR(20),
            website VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
          CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
        `
      },
      {
        name: 'shoppers table',
        sql: `
          CREATE TABLE IF NOT EXISTS shoppers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            full_name VARCHAR(255),
            address TEXT,
            phone_number VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_shoppers_user_id ON shoppers(user_id);
        `
      },
      {
        name: 'products table',
        sql: `
          CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            price DECIMAL(10, 2) NOT NULL,
            stock_quantity INTEGER DEFAULT 0,
            image_url TEXT,
            specifications JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
          CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
          CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
        `
      },
      {
        name: 'refresh_tokens table',
        sql: `
          CREATE TABLE IF NOT EXISTS refresh_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            invalidated_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id)
          );
          CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
          CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
        `
      },
      {
        name: 'security_logs table',
        sql: `
          CREATE TABLE IF NOT EXISTS security_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR(100) NOT NULL,
            details JSONB,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
          CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action);
          CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
        `
      },
      {
        name: 'wishlist table',
        sql: `
          CREATE TABLE IF NOT EXISTS wishlist (
            id SERIAL PRIMARY KEY,
            shopper_id INTEGER REFERENCES shoppers(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(shopper_id, product_id)
          );
          CREATE INDEX IF NOT EXISTS idx_wishlist_shopper_id ON wishlist(shopper_id);
          CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
        `
      },
      {
        name: 'reviews table',
        sql: `
          CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            shopper_id INTEGER REFERENCES shoppers(id) ON DELETE CASCADE,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
          CREATE INDEX IF NOT EXISTS idx_reviews_shopper_id ON reviews(shopper_id);
        `
      },
      {
        name: 'comparisons table',
        sql: `
          CREATE TABLE IF NOT EXISTS comparisons (
            id SERIAL PRIMARY KEY,
            shopper_id INTEGER REFERENCES shoppers(id) ON DELETE CASCADE,
            product_ids INTEGER[] NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_comparisons_shopper_id ON comparisons(shopper_id);
        `
      },
      {
        name: 'sales_reports table',
        sql: `
          CREATE TABLE IF NOT EXISTS sales_reports (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            quantity_sold INTEGER NOT NULL,
            total_revenue DECIMAL(10, 2) NOT NULL,
            report_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_sales_reports_vendor_id ON sales_reports(vendor_id);
          CREATE INDEX IF NOT EXISTS idx_sales_reports_product_id ON sales_reports(product_id);
          CREATE INDEX IF NOT EXISTS idx_sales_reports_report_date ON sales_reports(report_date);
        `
      },
      {
        name: 'product_images table',
        sql: `
          CREATE TABLE IF NOT EXISTS product_images (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            is_primary BOOLEAN DEFAULT false,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
        `
      },
      {
        name: 'search_index table',
        sql: `
          CREATE TABLE IF NOT EXISTS search_index (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            search_vector tsvector,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_search_vector ON search_index USING gin(search_vector);
          CREATE INDEX IF NOT EXISTS idx_search_product_id ON search_index(product_id);
        `
      }
    ];

    for (const migration of migrations) {
      try {
        console.log(`📝 Creating ${migration.name}...`);
        await appPool.query(migration.sql);
        console.log(`✅ ${migration.name} created successfully`);
      } catch (err) {
        console.error(`❌ Error creating ${migration.name}:`, err.message);
      }
    }

    await appPool.end();
    console.log('\n✅ Database setup completed successfully!');
    console.log(`\n🚀 You can now start your backend server with: npm start`);
    
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    process.exit(1);
  }
}

setupDatabase();
