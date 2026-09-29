module.exports = {
  apps: [
    {
      name: 'choiceawards-api',
      script: 'src/index.js',
      cwd: './server',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
