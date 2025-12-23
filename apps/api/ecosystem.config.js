module.exports = {
  apps: [
    {
      name: 'cola-finance-service',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '2000M'
    }
  ]
};
