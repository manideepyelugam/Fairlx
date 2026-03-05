/**
 * PM2 Ecosystem Configuration for Fairlx
 *
 * IMPORTANT: Uses the Next.js binary directly (not `npm start`) to avoid
 * child-process tracking issues where PM2 loses the process handle and
 * enters an infinite EADDRINUSE restart loop.
 *
 * PM2 runs as root via the pm2-root systemd service.
 * The deployer user manages it via: sudo pm2 <command>
 */
module.exports = {
  apps: [
    {
      name: 'fairlx',
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 0.0.0.0',
      cwd: '/var/www/fairlx',
      interpreter: '/usr/bin/node',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 16,
      kill_timeout: 10000,
      listen_timeout: 15000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/root/.pm2/logs/fairlx-error.log',
      out_file: '/root/.pm2/logs/fairlx-out.log',
      merge_logs: true,
    },
  ],
};