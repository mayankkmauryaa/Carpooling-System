module.exports = {
  apps: [
    {
      name: 'carpooling-api',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_file: 'logs/pm2-combined.log',
      time: true,
      max_memory_restart: '1G',
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      instance_var: 'INSTANCE_ID',
      pmx: true,
      vizion: true,
      combine_logs: true,
      ignore_watch: ['logs', 'node_modules', '.git'],
      watch_options: {
        ignoreInitial: true,
        persistent: true,
        ignored: ['**/logs/**', '**/node_modules/**', '**/.git/**']
      }
    }
  ]
};
