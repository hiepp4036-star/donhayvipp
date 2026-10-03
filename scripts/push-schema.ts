/**
 * Database Schema Push Script
 * For Upstash Redis - creates necessary indexes/structures
 * Run: npx tsx scripts/push-schema.ts
 */

import { createRedisClient } from '../src/lib/redis';

async function pushSchema(): Promise<void> {
  console.log('📦 Pushing schema to Redis...');

  const redis = createRedisClient();

  try {
    // Test connection
    const ping = await redis.ping();
    console.log(`✅ Redis connection: ${ping}`);

    // Create sample rate limit keys to verify structure
    const testKey = 'ratelimit:test:verify';
    await redis.incr(testKey);
    await redis.expire(testKey, 60);
    const val = await redis.get(testKey);
    console.log(`✅ Rate limit test: ${val} requests`);

    // Test sorted set operations (for analytics)
    const analyticsKey = 'analytics:events:test';
    await redis.zadd(analyticsKey, Date.now(), JSON.stringify({
      event: 'test',
      data: { verified: true },
      timestamp: Date.now()
    }));
    await redis.expire(analyticsKey, 3600);
    const count = await redis.zcard(analyticsKey);
    console.log(`✅ Analytics test: ${count} events`);

    // Cleanup test keys
    await redis.del(testKey);
    await redis.del(analyticsKey);

    console.log('\n✅ Schema verification complete - Redis is ready!');
  } catch (err) {
    console.error('\n❌ Schema push failed:', err);
    process.exit(1);
  }
}

pushSchema();