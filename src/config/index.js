'use strict';

const pkg = require('../../package.json');

const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  serviceName: process.env.SERVICE_NAME || 'billing-service',
  serviceVersion: process.env.SERVICE_VERSION || pkg.version,
  release: process.env.RELEASE || `billing-${pkg.version}`,
  apiKey: process.env.API_KEY || null,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
};

module.exports = config;
