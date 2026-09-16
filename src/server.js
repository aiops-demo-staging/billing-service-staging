'use strict';

const { createApp } = require('./app');
const config = require('./config');

const server = createApp().listen(config.port, () => {
  process.stdout.write(
    JSON.stringify({
      level: 'info',
      message: 'billing-service started',
      service: config.serviceName,
      release: config.release,
      port: config.port,
    }) + '\n',
  );
});

function shutdown(signal) {
  process.stdout.write(JSON.stringify({ level: 'info', message: `received ${signal}` }) + '\n');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
