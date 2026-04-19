/**
 * PM2 cluster mode config.
 *
 * Usage:
 *   npm install -g pm2
 *   pm2 start pm2.config.js --env production
 *   pm2 save && pm2 startup   # auto-restart on reboot
 *   pm2 monit                 # live dashboard
 */

module.exports = {
  apps: [
    {
      name: 'bizbook-api',
      // Use Fastify server for production; fall back to Express index.js
      script: 'server.js',
      // Cluster mode: one process per CPU core — free vertical scaling
      instances: 'max',
      exec_mode: 'cluster',
      // Restart if memory exceeds 512 MB
      max_memory_restart: '512M',
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Graceful shutdown: wait up to 5s for in-flight requests
      kill_timeout: 5000,
      // Wait 3s before restarting after a crash
      restart_delay: 3000,
      // Log files
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Watch mode (dev only — disable in production)
      watch: false,
    },
  ],
};
