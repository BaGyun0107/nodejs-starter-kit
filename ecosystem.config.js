const commonSettings = {
  instances: 1,
  exec_mode: 'fork',
  watch: false,
  log_date_format: 'YYYY-MM-DD HH:mm:ss',
  max_memory_restart: '1G'
};

module.exports = {
  apps: [
    // 개발 환경 - 하이패스 개발계
    {
      ...commonSettings,
      name: 'example',
      script: 'app.js',
      instances: 8,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/example_combined.log',
      max_restarts: 5,
      restart_delay: 10000
    },
  ]
};
