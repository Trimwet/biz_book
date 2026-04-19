'use strict';

const { pool } = require('../utils');

async function getOrCreateConversation(productId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sel = await client.query('SELECT * FROM chat_conversations WHERE product_id = $1', [productId]);
    if (sel.rows.length) { await client.query('COMMIT'); return sel.rows[0]; }
    const ins = await client.query(
      'INSERT INTO chat_conversations (product_id, created_at, updated_at) VALUES ($1,NOW(),NOW()) RETURNING *',
      [productId]
    );
    await client.query('COMMIT');
    return ins.rows[0];
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}

async function chatRoutes(fastify) {
  fastify.get('/by-listing/:productId', async (request, reply) => {
    try {
      const productId = parseInt(request.params.productId);
      if (!Number.isFinite(productId)) return reply.code(400).send({ error: 'Invalid productId' });
      const p = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
      if (p.rows.length === 0) return reply.code(404).send({ error: 'Listing not found' });
      const conv = await getOrCreateConversation(productId);
      return reply.send({ conversation: { id: conv.id, product_id: conv.product_id, last_message_at: conv.last_message_at, last_message_text: conv.last_message_text, unread_vendor_count: conv.unread_vendor_count, unread_shopper_count: conv.unread_shopper_count } });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to get conversation', details: process.env.NODE_ENV !== 'production' ? err.message : undefined });
    }
  });

  fastify.get('/:conversationId/messages', async (request, reply) => {
    try {
      const conversationId = parseInt(request.params.conversationId);
      if (!Number.isFinite(conversationId)) return reply.code(400).send({ error: 'Invalid conversationId' });
      const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '50')));
      const beforeId = request.query.beforeId ? parseInt(request.query.beforeId) : null;

      const params = [conversationId];
      let where = 'WHERE conversation_id = $1';
      if (beforeId && Number.isFinite(beforeId)) { params.push(beforeId); where += ` AND id < $${params.length}`; }
      params.push(limit);
      const sql = `SELECT id, conversation_id, product_id, sender_role, client_msg_id, text, created_at FROM chat_messages ${where} ORDER BY id DESC LIMIT $${params.length}`;
      const rows = await pool.query(sql, params);
      return reply.send({ messages: rows.rows.reverse() });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch messages' });
    }
  });

  fastify.post('/:conversationId/read', async (request, reply) => {
    try {
      const conversationId = parseInt(request.params.conversationId);
      if (!Number.isFinite(conversationId)) return reply.code(400).send({ error: 'Invalid conversationId' });
      const role = String(request.query.role || '').toLowerCase();
      if (!['vendor', 'shopper'].includes(role)) return reply.code(400).send({ error: 'Invalid role' });
      const field = role === 'vendor' ? 'unread_vendor_count' : 'unread_shopper_count';
      await pool.query(`UPDATE chat_conversations SET ${field} = 0, updated_at = NOW() WHERE id = $1`, [conversationId]);
      return reply.send({ ok: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to mark as read' });
    }
  });

  fastify.post('/by-listing/:productId/import', async (request, reply) => {
    try {
      const productId = parseInt(request.params.productId);
      if (!Number.isFinite(productId)) return reply.code(400).send({ error: 'Invalid productId' });
      const messages = Array.isArray(request.body?.messages) ? request.body.messages : [];
      if (!messages.length) return reply.send({ imported: 0 });

      const conv = await getOrCreateConversation(productId);
      let imported = 0, lastText = null, lastAt = null;

      for (const m of messages) {
        const text = (m && typeof m.text === 'string') ? m.text.slice(0, 4000) : '';
        if (!text) continue;
        const clientId = typeof m?.client_msg_id === 'string' ? m.client_msg_id : null;
        const role = String(m?.sender_role || '').toLowerCase();
        const senderRole = ['vendor', 'shopper', 'system'].includes(role) ? role : 'system';
        const createdAt = m?.created_at ? new Date(m.created_at) : new Date();
        try {
          if (clientId) {
            const exist = await pool.query('SELECT id FROM chat_messages WHERE conversation_id = $1 AND client_msg_id = $2', [conv.id, clientId]);
            if (exist.rows.length) continue;
          }
          await pool.query('INSERT INTO chat_messages (conversation_id, product_id, sender_role, client_msg_id, text, created_at) VALUES ($1,$2,$3,$4,$5,$6)', [conv.id, productId, senderRole, clientId, text, createdAt]);
          imported++;
          if (!lastAt || createdAt > lastAt) { lastAt = createdAt; lastText = text; }
        } catch (_) { continue; }
      }

      if (imported > 0 && lastAt)
        await pool.query('UPDATE chat_conversations SET last_message_at=$1, last_message_text=$2, updated_at=NOW() WHERE id=$3', [lastAt, lastText, conv.id]);

      return reply.send({ imported });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to import messages' });
    }
  });

  fastify.post('/test/send', async (request, reply) => {
    if (process.env.NODE_ENV === 'production') return reply.code(403).send({ error: 'Not allowed in production' });
    try {
      const { listingId, text, senderRole = 'shopper', clientMsgId = null } = request.body || {};
      const productId = parseInt(listingId);
      if (!productId || !text) return reply.code(400).send({ error: 'listingId and text are required' });

      const sel = await pool.query('SELECT id FROM chat_conversations WHERE product_id = $1', [productId]);
      let conversationId = sel.rows[0]?.id;
      if (!conversationId) {
        const ins = await pool.query('INSERT INTO chat_conversations (product_id, created_at, updated_at) VALUES ($1,NOW(),NOW()) RETURNING id', [productId]);
        conversationId = ins.rows[0].id;
      }

      let saved;
      if (clientMsgId) {
        const exist = await pool.query('SELECT id FROM chat_messages WHERE conversation_id = $1 AND client_msg_id = $2', [conversationId, clientMsgId]);
        if (exist.rows.length) saved = { id: exist.rows[0].id };
      }
      if (!saved) {
        const insMsg = await pool.query('INSERT INTO chat_messages (conversation_id, product_id, sender_role, client_msg_id, text, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING id, created_at', [conversationId, productId, senderRole, clientMsgId || null, String(text).slice(0, 4000)]);
        saved = insMsg.rows[0];
      }

      const oppositeField = senderRole === 'vendor' ? 'unread_shopper_count' : 'unread_vendor_count';
      await pool.query(`UPDATE chat_conversations SET last_message_at=NOW(), last_message_text=$1, ${oppositeField}=${oppositeField}+1, updated_at=NOW() WHERE id=$2`, [String(text).slice(0, 4000), conversationId]);
      return reply.send({ conversationId, messageId: saved.id, clientMsgId, serverTimestamp: new Date().toISOString() });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to send test message' });
    }
  });
}

module.exports = chatRoutes;
