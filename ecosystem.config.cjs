module.exports = {
  apps: [
    {
      name: 'channel-backup-bot',
      script: 'vite-node src/index.js',
      watch: '.',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
