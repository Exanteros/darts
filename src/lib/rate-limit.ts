import Redis from 'ioredis';

// Redis client for rate limiting
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (!redisUrl) {
      // Silent fail in dev/build if not configured
      return null;
    }
    redis = new Redis(redisUrl, {
      // Don't retry indefinitely in dev if connection fails
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (process.env.NODE_ENV === 'development' && times > 3) {
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      }
    });
    
    // Handle connection errors to prevent app crash
    redis.on('error', (err) => {
      // Only log once or if verbose
      if (process.env.NODE_ENV === 'development') {
        console.warn('Redis connection error (Rate Limiting disabled):', err.message);
      } else {
        console.error('Redis connection error:', err);
      }
    });
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
  // Always allow in development
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true };
  }

  try {
    const redis = getRedisClient();
    
    if (!redis) {
      // Fallback if no Redis configured
      return { allowed: true };
    }

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