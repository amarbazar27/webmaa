/**
 * Production Rate Limiter — Upstash Redis with in-memory fallback
 * 
 * Uses @upstash/ratelimit when UPSTASH_REDIS_REST_URL is configured.
 * Falls back to in-memory Map when Upstash is unavailable.
 * 
 * Usage:
 *   import { createRateLimiter } from '@/lib/rate-limit';
 *   const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60000, prefix: 'api_checkout' });
 *   const { limited, remaining } = await limiter.check(identifier);
 */

// ── In-Memory Fallback ─────────────────────────────────────────
// Best-effort on serverless — resets on cold start but catches burst abuse
const memoryStores = new Map();

function getMemoryStore(prefix) {
  if (!memoryStores.has(prefix)) {
    memoryStores.set(prefix, new Map());
  }
  return memoryStores.get(prefix);
}

function memoryRateLimit(store, key, maxRequests, windowMs) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { limited: false, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { limited: true, remaining: 0 };
  }

  entry.count++;
  return { limited: false, remaining: maxRequests - entry.count };
}

// ── Upstash Redis (Production) ─────────────────────────────────
let upstashAvailable = null; // null = not checked yet

async function getUpstashRatelimit(prefix, maxRequests, windowSec) {
  // Only attempt import once
  if (upstashAvailable === false) return null;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    upstashAvailable = false;
    return null;
  }

  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');

    const redis = new Redis({ url, token });
    upstashAvailable = true;

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
      prefix: `ratelimit:${prefix}`,
      analytics: true,
    });
  } catch {
    upstashAvailable = false;
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────
/**
 * @param {Object} options
 * @param {number} options.maxRequests - Max requests per window
 * @param {number} options.windowMs - Window duration in milliseconds
 * @param {string} options.prefix - Unique prefix for this rate limiter
 */
export function createRateLimiter({ maxRequests, windowMs, prefix }) {
  const windowSec = Math.ceil(windowMs / 1000);
  let upstashLimiter = null;
  let upstashChecked = false;

  return {
    /**
     * @param {string} identifier - IP address or user ID
     * @returns {Promise<{limited: boolean, remaining: number}>}
     */
    async check(identifier) {
      // Try Upstash first (lazy init)
      if (!upstashChecked) {
        upstashLimiter = await getUpstashRatelimit(prefix, maxRequests, windowSec);
        upstashChecked = true;
      }

      if (upstashLimiter) {
        try {
          const result = await upstashLimiter.limit(identifier);
          return { limited: !result.success, remaining: result.remaining };
        } catch {
          // Upstash failed — fall through to memory
        }
      }

      // Fallback: in-memory
      const store = getMemoryStore(prefix);
      return memoryRateLimit(store, identifier, maxRequests, windowMs);
    }
  };
}
