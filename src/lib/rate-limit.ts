import Redis from 'ioredis';

// Redis client for rate limiting
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL or UPSTASH_REDIS_REST_URL must be set for rate limiting');
    }
    redis = new Redis(redisUrl);
  }
  return redis;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const redis = getRedisClient();
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;

    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.pexpire(windowKey, windowMs);

    const results = await pipeline.exec();
    if (!results) {
      return { allowed: false };
    }

    const count = results[0][1] as number;
    const allowed = count <= limit;

    return {
      allowed,
      retryAfter: allowed ? undefined : windowMs - (now % windowMs),
      remaining: Math.max(0, limit - count)
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fallback: allow request if Redis fails
    return { allowed: true };
  }
}

// Cleanup function for graceful shutdown
export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}