'use strict';
require('dotenv').config();
const path = require('path');
const { Server: SocketIOServer } = require('socket.io');
const { pool } = require('./utils');
const { startImageWorker } = require('./workers/imageWorker');
const jwt = require('jsonwebtoken');

const fastify = require('fastify')({
  logger: { level: process.env.LOG_LEVEL||'info', transport: process.env.NODE_ENV!=='production' ? { target:'pino-pretty', options:{colorize:true} } : undefined },
  trustProxy: true,
  bodyLimit: 10*1024*1024,
});

// Global process handlers to log and exit cleanly (nodemon will restart).
process.on('uncaughtException', (err) => {
  try { fastify.log && fastify.log.error('uncaughtException: ' + (err && err.stack || err)); } catch (_) { console.error('uncaughtException', err); }
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  try { fastify.log && fastify.log.error('unhandledRejection: ' + (reason && (reason.stack || reason) || reason)); } catch (_) { console.error('unhandledRejection', reason); }
  process.exit(1);
});

const isProd = (process.env.NODE_ENV||'development') === 'production';
const corsOrigins = (process.env.CORS_ORIGINS||'http://localhost:5173,http://localhost:5174').split(',').map(o=>o.trim()).filter(Boolean);

fastify.register(require('@fastify/cors'), { origin:corsOrigins, credentials:true, methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders:['Content-Type','Authorization','X-CSRF-Token'] });
fastify.register(require('@fastify/helmet'), { contentSecurityPolicy:{ directives:{ defaultSrc:["'self'"], styleSrc:["'self'","'unsafe-inline'",'https://fonts.googleapis.com'], fontSrc:["'self'",'https://fonts.gstatic.com'], imgSrc:["'self'",'data:','https:'], scriptSrc:["'self'"] } }, crossOriginEmbedderPolicy:false });
fastify.register(require('@fastify/rate-limit'), { global:false, max:isProd?300:5000, timeWindow:'15 minutes', skipOnError:true });
fastify.register(require('@fastify/static'), { root:path.join(__dirname,'uploads'), prefix:'/uploads/', decorateReply:false });
fastify.register(require('@fastify/multipart'), { attachFieldsToBody:false, limits:{ fileSize:5*1024*1024, files:5 } });
fastify.register(require('@fastify/formbody'));

fastify.decorate('authenticate', async (request, reply) => {
  const token = (request.headers['authorization']||'').split(' ')[1];
  if (!token) return reply.code(401).send({ error:'Access token required', code:'MISSING_TOKEN' });
  try { request.user = jwt.verify(token, process.env.JWT_SECRET||process.env.ACCESS_TOKEN_SECRET); }
  catch (err) {
    if (err.name==='TokenExpiredError') return reply.code(401).send({ error:'Access token expired', code:'TOKEN_EXPIRED' });
    return reply.code(403).send({ error:'Invalid access token', code:'INVALID_TOKEN' });
  }
});

fastify.addHook('onResponse', (req, reply, done) => {
  fastify.log.info(req.method+' '+req.url+' -> '+reply.statusCode+' '+Math.round(reply.elapsedTime)+'ms');
  done();
});

fastify.get('/health', async (_, reply) => {
  try { const r = await pool.query('SELECT NOW() as now'); return reply.send({ ok:true, backend:'fastify', database:'up', now:r.rows[0]?.now }); }
  catch (err) { return reply.code(500).send({ ok:false, backend:'fastify', database:'down', error:err.message }); }
});
fastify.get('/api/csrf-token', async (_, reply) => reply.send({ csrfToken:'disabled' }));

fastify.register(require('./routes/auth'),            { prefix:'/api/auth' });
fastify.register(require('./routes/products'),        { prefix:'/api/products' });
fastify.register(require('./routes/listings'),        { prefix:'/api/listings' });
fastify.register(require('./routes/vendor'),          { prefix:'/api' });
fastify.register(require('./routes/shopper'),         { prefix:'/api' });
fastify.register(require('./routes/chat'),            { prefix:'/api/chat' });
fastify.register(require('./routes/personalization'), { prefix:'/api' });
const { plugin: searchPlugin } = require('./routes/search');
fastify.register(searchPlugin, { prefix:'/api/search' });

async function connectDB() {
  try {
    const client = await pool.connect();
    fastify.log.info('Database connected');
    pool.dbConnected = true;
    client.release();
    await pool.query('ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE').catch(()=>{});
    await pool.query('UPDATE users SET is_active=TRUE WHERE is_active IS NULL').catch(()=>{});
    await pool.query("ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'draft'").catch(()=>{});
    const VIEWS=['vendor_sales_summary','category_price_stats','daily_search_trends','product_view_counts'];
    const refreshViews=async()=>{ for(const v of VIEWS) await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY '+v).catch(()=>{}); };
    setTimeout(refreshViews,10000);
    setInterval(refreshViews,5*60*1000);
  } catch(err) { fastify.log.warn('DB connection failed: '+err.message+' - demo mode'); pool.dbConnected=false; }
}

function attachSocketIO(httpServer) {
  const io = new SocketIOServer(httpServer, { cors:{ origin:corsOrigins, methods:['GET','POST'], credentials:true }, transports:['websocket','polling'] });
  io.on('connection', (socket) => {
    socket.on('joinRoom', ({roomId})=>{ if(roomId){socket.join(roomId);socket.emit('system',{type:'joined',roomId});} });
    socket.on('message:send', async(payload)=>{
      try {
        const {roomId,message,senderId,clientMsgId}=payload||{};
        if(!roomId||!message) return;
        let listingId=null;
        if(typeof roomId==='string'&&roomId.startsWith('listing:')){const n=parseInt(roomId.split(':')[1]);listingId=Number.isFinite(n)?n:null;}
        const msg={id:Date.now()+'-'+Math.random().toString(36).slice(2,8),roomId,message:String(message).slice(0,4000),senderId:senderId||'anonymous',createdAt:new Date().toISOString(),clientMsgId:clientMsgId||null};
        io.to(roomId).emit('message:new',msg);
        if(listingId){
          const sel=await pool.query('SELECT id FROM chat_conversations WHERE product_id=$1',[listingId]);
          let cid=sel.rows[0]?.id;
          if(!cid){const ins=await pool.query('INSERT INTO chat_conversations (product_id,created_at,updated_at) VALUES ($1,NOW(),NOW()) RETURNING id',[listingId]);cid=ins.rows[0].id;}
          const role=String(senderId||'').toLowerCase()==='vendor'?'vendor':'shopper';
          let saved;
          if(clientMsgId){const ex=await pool.query('SELECT id FROM chat_messages WHERE conversation_id=$1 AND client_msg_id=$2',[cid,clientMsgId]);if(ex.rows.length)saved={id:ex.rows[0].id};}
          if(!saved){const im=await pool.query('INSERT INTO chat_messages (conversation_id,product_id,sender_role,client_msg_id,text,created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING id,created_at',[cid,listingId,role,clientMsgId||null,String(message).slice(0,4000)]);saved=im.rows[0];}
          const opp=role==='vendor'?'unread_shopper_count':'unread_vendor_count';
          await pool.query('UPDATE chat_conversations SET last_message_at=NOW(),last_message_text=$1,'+opp+'='+opp+'+1,updated_at=NOW() WHERE id=$2',[String(message).slice(0,4000),cid]);
          socket.emit('message:ack',{clientMsgId:clientMsgId||null,messageId:saved.id,conversationId:cid,serverTimestamp:new Date().toISOString()});
        }
      } catch(err){fastify.log.error('socket message:send: '+err.message);}
    });
    socket.on('typing',({roomId,senderId,typing}={})=>{if(roomId)io.to(roomId).emit('typing',{roomId,senderId:senderId||'anonymous',typing:!!typing});});
  });
  return io;
}

async function start() {
  await connectDB();
  startImageWorker();
  await fastify.ready();
  const PORT = parseInt(process.env.PORT)||3001;
  
  // In Fastify 5, use fastify.server directly (the internal HTTP server)
  attachSocketIO(fastify.server);

  // Handle listen errors
  fastify.server.on('error', (err) => {
    fastify.log && fastify.log.error('HTTP server error: ' + (err && err.message || err));
    if (err && err.code === 'EADDRINUSE') {
      fastify.log && fastify.log.error(`Port ${PORT} already in use; exiting.`);
      process.exit(1);
    }
    process.exit(1);
  });

  // Use fastify.listen() which will bind the internal http server
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  fastify.log.info('BIZ BOOK Fastify server on port ' + PORT);
}

start().catch(err=>{ console.error('Fatal:',err); process.exit(1); });