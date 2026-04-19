require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'biz_book',
  password: process.env.DB_PASSWORD || 'permitted',
  port: process.env.DB_PORT || 5432,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running chat migrations...');

    const sql = `
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id BIGSERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
        last_message_at TIMESTAMP,
        last_message_text TEXT,
        unread_vendor_count INTEGER DEFAULT 0,
        unread_shopper_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_chat_conversations_product_id ON chat_conversations(product_id);
      CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message_at ON chat_conversations(last_message_at);

      CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGSERIAL PRIMARY KEY,
        conversation_id BIGINT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('vendor','shopper','system')),
        client_msg_id VARCHAR(64),
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_product_id_created_at ON chat_messages(product_id, created_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_messages_conversation_client_msg_id ON chat_messages(conversation_id, client_msg_id) WHERE client_msg_id IS NOT NULL;
    `;

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Chat migrations completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Chat migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();