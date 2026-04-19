'use strict';

const { pool } = require('../utils');
const xss = require('xss');
const sanitizeInput = (v) => (typeof v === 'string' ? xss(v.trim()) : v);

async function trackSearch(userId, searchQuery, filters, resultsCount, ipAddress, userAgent) {
  try {
    await pool.query('INSERT INTO search_history (user_id, search_query, filters, results_count, ip_address, user_agent) VALUES ($1,$2,$3,$4,$5,$6)', [userId, searchQuery, filters, resultsCount, ipAddress, userAgent]);
    await pool.query(`INSERT INTO search_suggestions (suggestion_text, search_count, last_searched) VALUES ($1,1,CURRENT_TIMESTAMP) ON CONFLICT (suggestion_text) DO UPDATE SET search_count = search_suggestions.search_count + 1, last_searched = CURRENT_TIMESTAMP`, [searchQuery]);
    const today = new Date().toISOString().split('T')[0];
    await pool.query(`INSERT INTO popular_searches (search_query, search_count, time_period, period_start, period_end) VALUES ($1,1,'daily',$2,$2) ON CONFLICT (search_query, time_period, period_start) DO UPDATE SET search_count = popular_searches.search_count + 1`, [searchQuery, today]);
  } catch (_) {}
}

async function searchRoutes(fastify) {
  fastify.get('/suggestions', async (request, reply) => {
    try {
      const { q, limit = 10 } = request.query;
      if (!q || q.trim().length < 1) return reply.send({ suggestions: [] });
      const sanitizedQuery = sanitizeInput(q);
      const result = await pool.query(`SELECT suggestion_text, category, search_count, is_trending FROM search_suggestions WHERE suggestion_text ILIKE $1 ORDER BY is_trending DESC, search_count DESC, suggestion_text ASC LIMIT $2`, [`%${sanitizedQuery}%`, parseInt(limit)]);
      const popularResult = await pool.query(`SELECT DISTINCT search_query as suggestion_text, 'Popular' as category FROM popular_searches WHERE search_query ILIKE $1 AND time_period = 'daily' AND period_start >= CURRENT_DATE - INTERVAL '7 days' ORDER BY search_query LIMIT 5`, [`%${sanitizedQuery}%`]);
      const suggestions = [...result.rows, ...popularResult.rows.filter(p => !result.rows.some(s => s.suggestion_text.toLowerCase() === p.suggestion_text.toLowerCase()))].slice(0, parseInt(limit));
      return reply.send({ suggestions });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch suggestions' });
    }
  });

  fastify.get('/trending', async (request, reply) => {
    try {
      const { limit = 10, category } = request.query;
      const params = [];
      let query = `SELECT suggestion_text, category, search_count FROM search_suggestions WHERE is_trending = true`;
      if (category) { params.push(sanitizeInput(category)); query += ` AND category = $${params.length}`; }
      params.push(parseInt(limit));
      query += ` ORDER BY search_count DESC LIMIT $${params.length}`;
      const result = await pool.query(query, params);
      return reply.send({ trending: result.rows, timestamp: new Date().toISOString() });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch trending searches' });
    }
  });

  fastify.get('/analytics', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const days = parseInt(request.query.days || '7');
      const analyticsResult = await pool.query(`SELECT date, total_searches, unique_users, top_queries, top_categories, avg_results_per_search, zero_result_searches FROM search_analytics WHERE date >= CURRENT_DATE - INTERVAL '${days} days' ORDER BY date DESC`);
      const topSearchesResult = await pool.query(`SELECT search_query, SUM(search_count) as total_count FROM popular_searches WHERE period_start >= CURRENT_DATE - INTERVAL '${days} days' GROUP BY search_query ORDER BY total_count DESC LIMIT 20`);
      return reply.send({ analytics: analyticsResult.rows, topSearches: topSearchesResult.rows, period: `${days} days` });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch search analytics' });
    }
  });

  fastify.get('/saved', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const result = await pool.query('SELECT id, search_name, search_query, filters, alert_enabled, alert_frequency, created_at FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC', [request.user.userId]);
      return reply.send({ savedSearches: result.rows });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch saved searches' });
    }
  });

  fastify.post('/saved', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { searchName, searchQuery, filters, alertEnabled = false, alertFrequency = 'daily' } = request.body || {};
      if (!searchName || !searchQuery) return reply.code(400).send({ error: 'Search name and query are required' });
      const result = await pool.query('INSERT INTO saved_searches (user_id, search_name, search_query, filters, alert_enabled, alert_frequency) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [request.user.userId, sanitizeInput(searchName), sanitizeInput(searchQuery), filters || {}, alertEnabled, alertFrequency]);
      return reply.send({ message: 'Search saved successfully', savedSearch: result.rows[0] });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to save search' });
    }
  });

  fastify.delete('/saved/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const result = await pool.query('DELETE FROM saved_searches WHERE id = $1 AND user_id = $2 RETURNING id', [parseInt(request.params.id), request.user.userId]);
      if (result.rows.length === 0) return reply.code(404).send({ error: 'Saved search not found' });
      return reply.send({ message: 'Saved search deleted successfully' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete saved search' });
    }
  });

  fastify.get('/history', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const result = await pool.query('SELECT search_query, filters, results_count, search_timestamp FROM search_history WHERE user_id = $1 ORDER BY search_timestamp DESC LIMIT $2', [request.user.userId, parseInt(request.query.limit || '20')]);
      return reply.send({ searchHistory: result.rows });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch search history' });
    }
  });

  fastify.delete('/history', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      await pool.query('DELETE FROM search_history WHERE user_id = $1', [request.user.userId]);
      return reply.send({ message: 'Search history cleared successfully' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to clear search history' });
    }
  });
}

module.exports = { plugin: searchRoutes, trackSearch };
