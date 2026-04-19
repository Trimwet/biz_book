
'use strict';

const { pool } = require('../utils');

async function shopperRoutes(fastify) {
	// Basic shopper endpoints (stubbed) to satisfy plugin registration
	fastify.get('/shopper/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
		try {
			if (!request.user?.userId) return reply.code(401).send({ error: 'Not authenticated' });
			if (!pool.dbConnected) return reply.send({ profile: { id: request.user.userId, name: 'Demo Shopper (demo)' } });
			const r = await pool.query('SELECT id, full_name, address, phone_number FROM shoppers WHERE user_id = $1', [request.user.userId]);
			if (!r.rows[0]) return reply.code(404).send({ error: 'Shopper profile not found' });
			return reply.send({ profile: r.rows[0] });
		} catch (err) {
			fastify.log.error(err);
			return reply.code(500).send({ error: 'Failed to fetch shopper profile' });
		}
	});
}

module.exports = shopperRoutes;

