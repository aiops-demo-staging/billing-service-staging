'use strict';

const { randomUUID } = require('crypto');
const config = require('../config');

const buckets = new Map();

function requestId(req, res, next) {
  req.requestId = req.get('x-request-id') || randomUUID();
  res.set('x-request-id', req.requestId);
  next();
}

function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || 'anonymous';
  const bucket = buckets.get(key) || { count: 0, resetAt: now + config.rateLimitWindowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + config.rateLimitWindowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > config.rateLimitMax) {
    return res.status(429).json({ error: 'RateLimited', requestId: req.requestId });
  }
  return next();
}

function apiKeyAuth(req, res, next) {
  if (!config.apiKey) return next();
  if (req.get('x-api-key') === config.apiKey) return next();
  return res.status(401).json({ error: 'Unauthorized', requestId: req.requestId });
}

function accessLog(req, res, next) {
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    process.stdout.write(
      JSON.stringify({
        level: 'info',
        service: config.serviceName,
        release: config.release,
        requestId: req.requestId,
        method: req.method,
        route: req.originalUrl,
        status: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      }) + '\n',
    );
  });
  next();
}

module.exports = { requestId, rateLimit, apiKeyAuth, accessLog };
