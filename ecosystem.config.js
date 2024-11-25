module.exports = {
  apps: [
    {
      name: 'kl-aoi-master',
      script: 'dist/main.js', // 启动脚本
      watch: false,
      env: {
        platform: 'local',
      },
      env_production: {
        platform: 'bench1',
      },
    },
  ],
};
