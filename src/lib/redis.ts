/**
 * Redis Client for Rate Limiting & Caching
 * Uses @upstash/redis (HTTP-based, works on Vercel Edge)
 * Fallback to in-memory for local dev
 */

import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  total: number;
}

export interface RedisClient {
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ex?: number): Promise<'OK' | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  zadd(key: string, score: number, member: string): Promise<number>;
  zrem(key: string, member: string): Promise<number>;
  zrangebyscore(key: string, min: number, max: number): Promise<string[]>;
  zcard(key: string): Promise<number>;
  ping(): Promise<string>;
}

// In-memory fallback for local development
class MemoryRedis implements RedisClient {
  private store = new Map<string, { value: string; expiry?: number }>();
  private sortedSets = new Map<string, Map<string, number>>();

  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.expiry && data.expiry < now) {
        this.store.delete(key);
      }
    }
  }

  async incr(key: string): Promise<number> {
    this.cleanup();
    const current = parseInt(this.store.get(key)?.value || '0', 10);
    const next = current + 1;
    this.store.set(key, { value: String(next) });
    return next;
  }

  async decr(key: string): Promise<number> {
    this.cleanup();
    const current = parseInt(this.store.get(key)?.value || '0', 10);
    const next = current - 1;
    this.store.set(key, { value: String(next) });
    return next;
  }

  async get(key: string): Promise<string | null> {
    this.cleanup();
    const data = this.store.get(key);
    return data?.value || null;
  }

  async set(key: string, value: string, ex?: number): Promise<'OK' | null> {
    this.cleanup();
    this.store.set(key, {
      value,
      expiry: ex ? Date.now() + ex * 1000 : undefined
    });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    this.cleanup();
    return this.store.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    this.cleanup();
    return this.store.has(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    this.cleanup();
    const data = this.store.get(key);
    if (data) {
      data.expiry = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    const set = this.sortedSets.get(key)!;
    const isNew = !set.has(member);
    set.set(member, score);
    return isNew ? 1 : 0;
  }

  async zrem(key: string, member: string): Promise<number> {
    const set = this.sortedSets.get(key);
    if (!set) return 0;
    return set.delete(member) ? 1 : 0;
  }

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    const set = this.sortedSets.get(key);
    if (!set) return [];
    const results: string[] = [];
    for (const [member, score] of set.entries()) {
      if (score >= min && score <= max) {
        results.push(member);
      }
    }
    return results.sort((a, b) => (set.get(a) || 0) - (set.get(b) || 0));
  }

  async zcard(key: string): Promise<number> {
    const set = this.sortedSets.get(key);
    return set?.size || 0;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }
}

// Upstash Redis wrapper using official SDK
class UpstashRedisSDK implements RedisClient {
  private client: Redis;

  constructor(url: string, token: string) {
    this.client = new Redis({ url, token });
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ex?: number): Promise<'OK' | null> {
    if (ex) {
      await this.client.set(key, value, { ex });
    } else {
      await this.client.set(key, value);
    }
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.client.zadd(key, { score, member });
  }

  async zrem(key: string, member: string): Promise<number> {
    return this.client.zrem(key, member);
  }

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    return this.client.zrangebyscore(key, min, max);
  }

  async zcard(key: string): Promise<number> {
    return this.client.zcard(key);
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }
}

/**
 * Factory function to create Redis client
 * Uses Upstash in production, memory in development
 */
export function createRedisClient(): RedisClient {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    console.log('[Redis] Using Upstash Redis (official SDK)');
    return new UpstashRedisSDK(upstashUrl, upstashToken);
  }

  console.log('[Redis] Using in-memory fallback (development)');
  return new MemoryRedis();
}

/**
 * Sliding Window Rate Limiter
 */
export class SlidingWindowRateLimiter {
  private redis: RedisClient;
  private windowMs: number;
  private maxRequests: number;
  private prefix: string;

  constructor(
    redis: RedisClient,
    options: { windowMs: number; maxRequests: number; prefix?: string }
  ) {
    this.redis = redis;
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.prefix = options.prefix || 'ratelimit';
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const key = `${this.prefix}:${identifier}`;

    const requestId = `${now}:${Math.random().toString(36).slice(2)}`;
    await this.redis.zadd(key, now, requestId);
    await this.redis.expire(key, Math.ceil(this.windowMs / 1000) + 1);

    const count = await this.redis.zcard(key);

    if (count > this.maxRequests) {
      await this.redis.zrem(key, requestId);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + this.windowMs,
        total: this.maxRequests
      };
    }

    return {
      allowed: true,
      remaining: this.maxRequests - count,
      resetAt: now + this.windowMs,
      total: this.maxRequests
    };
  }

  async reset(identifier: string): Promise<void> {
    const key = `${this.prefix}:${identifier}`;
    await this.redis.del(key);
  }
}

/**
 * Fixed Window Rate Limiter
 */
export class FixedWindowRateLimiter {
  private redis: RedisClient;
  private windowMs: number;
  private maxRequests: number;
  private prefix: string;

  constructor(
    redis: RedisClient,
    options: { windowMs: number; maxRequests: number; prefix?: string }
  ) {
    this.redis = redis;
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.prefix = options.prefix || 'ratelimit:fixed';
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowKey = Math.floor(now / this.windowMs);
    const key = `${this.prefix}:${identifier}:${windowKey}`;

    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, Math.ceil(this.windowMs / 1000) + 1);
    }

    if (current > this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: (windowKey + 1) * this.windowMs,
        total: this.maxRequests
      };
    }

    return {
      allowed: true,
      remaining: this.maxRequests - current,
      resetAt: (windowKey + 1) * this.windowMs,
      total: this.maxRequests
    };
  }

  async reset(identifier: string): Promise<void> {
    // Would need SCAN to find all keys, skip for simplicity
  }
}

// Singleton instances
let redisClient: RedisClient | null = null;
let apiRateLimiter: FixedWindowRateLimiter | null = null;
let adminRateLimiter: FixedWindowRateLimiter | null = null;
let licenseRateLimiter: FixedWindowRateLimiter | null = null;

export function getRedis(): RedisClient {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export function getApiRateLimiter(): FixedWindowRateLimiter {
  if (!apiRateLimiter) {
    apiRateLimiter = new FixedWindowRateLimiter(getRedis(), {
      windowMs: 60000,
      maxRequests: 30,
      prefix: 'ratelimit:api'
    });
  }
  return apiRateLimiter;
}

export function getAdminRateLimiter(): FixedWindowRateLimiter {
  if (!adminRateLimiter) {
    adminRateLimiter = new FixedWindowRateLimiter(getRedis(), {
      windowMs: 60000,
      maxRequests: 10,
      prefix: 'ratelimit:admin'
    });
  }
  return adminRateLimiter;
}

export function getLicenseRateLimiter(): FixedWindowRateLimiter {
  if (!licenseRateLimiter) {
    licenseRateLimiter = new FixedWindowRateLimiter(getRedis(), {
      windowMs: 60000,
      maxRequests: 20,
      prefix: 'ratelimit:license'
    });
  }
  return licenseRateLimiter;
}

/**
 * Analytics event tracking (stored in Redis for admin dashboard)
 */
export async function trackEvent(
  event: string,
  data: Record<string, any>
): Promise<void> {
  const redis = getRedis();
  const timestamp = Date.now();
  const eventKey = `analytics:events:${Math.floor(timestamp / 60000)}`;
  const eventData = JSON.stringify({ event, data, timestamp });

  await redis.zadd(eventKey, timestamp, eventData);
  await redis.expire(eventKey, 86400 * 7);
}

export interface AnalyticsSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByHour: Record<string, number>;
  topDevices: Array<{ brand: string; model: string; count: number }>;
  licenseValidations: { success: number; failed: number };
}

/**
 * Get analytics summary for dashboard
 */
export async function getAnalyticsSummary(hours: number = 24): Promise<AnalyticsSummary> {
  const redis = getRedis();
  const now = Date.now();
  const startTime = now - hours * 3600000;

  const eventsByType: Record<string, number> = {};
  const eventsByHour: Record<string, number> = {};
  const deviceCounts: Record<string, number> = {};
  let licenseSuccess = 0;
  let licenseFailed = 0;
  let totalEvents = 0;

  for (let i = 0; i < hours * 60; i++) {
    const minuteKey = `analytics:events:${Math.floor((now - i * 60000) / 60000)}`;
    const events = await redis.zrangebyscore(minuteKey, startTime, now);

    for (const eventStr of events) {
      try {
        const { event, data, timestamp } = JSON.parse(eventStr);
        totalEvents++;
        eventsByType[event] = (eventsByType[event] || 0) + 1;

        const hourKey = new Date(timestamp).toISOString().slice(0, 13);
        eventsByHour[hourKey] = (eventsByHour[hourKey] || 0) + 1;

        if (event === 'license_validated') {
          if (data.valid) licenseSuccess++;
          else licenseFailed++;
        }

        if (data.brandKey && data.modelKey) {
          const deviceKey = `${data.brandKey}:${data.modelKey}`;
          deviceCounts[deviceKey] = (deviceCounts[deviceKey] || 0) + 1;
        }
      } catch {
        // Skip malformed events
      }
    }
  }

  const topDevices = Object.entries(deviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => {
      const [brand, model] = key.split(':');
      return { brand, model, count };
    });

  return {
    totalEvents,
    eventsByType,
    eventsByHour,
    topDevices,
    licenseValidations: { success: licenseSuccess, failed: licenseFailed }
  };
}

export type { RedisClient };