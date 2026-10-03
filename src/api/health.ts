/**
 * Vercel Serverless Function - Health Check
 * GET /api/health
 */

import { createApiEndpoint } from '../lib/api-middleware';
import { getRedis } from '../lib/redis';
import { checkSentryHealth } from '../lib/sentry';

export default createApiEndpoint(
  async () => {
    const startTime = Date.now();

    let redisStatus = 'unknown';
    let redisLatency = 0;
    try {
      const redis = getRedis();
      const redisStart = Date.now();
      await redis.ping();
      redisLatency = Date.now() - redisStart;
      redisStatus = 'healthy';
    } catch {
      redisStatus = 'unhealthy';
    }

    let sentryStatus = 'disabled';
    if (process.env.SENTRY_DSN) {
      sentryStatus = await checkSentryHealth() ? 'healthy' : 'unhealthy';
    }

    const totalLatency = Date.now() - startTime;
    const isHealthy = redisStatus === 'healthy' && (sentryStatus === 'healthy' || sentryStatus === 'disabled');

    return new Response(JSON.stringify({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: Date.now(),
      latency: totalLatency,
      checks: {
        redis: { status: redisStatus, latency: redisLatency },
        sentry: { status: sentryStatus },
        api: { status: 'healthy', latency: totalLatency }
      },
      version: process.env.npm_package_version || '8.0.0',
      environment: process.env.NODE_ENV || 'development'
    }), {
      status: isHealthy ? 200 : 503,
      headers: { 'Content-Type': 'application/json' }
    });
  },
  { limiter: 'api' }
);