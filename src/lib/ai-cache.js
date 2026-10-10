/**
 * AI Response Cache — Upstash Redis with in-memory fallback
 * 
 * Caches AI chat responses by hashing the last user message + shopId.
 * Identical queries from different customers of the same shop get cached responses.
 * TTL: 30 minutes (configurable). Saves ~50-60% API cost.
 * 
 * Usage:
 *   import { aiCache } from '@/lib/ai-cache';
 *   const cached = await aiCache.get(shopId, userMessage);
 *   if (cached) return cached;
 *   // ... call AI API ...
 *   await aiCache.set(shopId, userMessage, aiResponse);
 */

const CACHE_TTL_SECONDS = 1800; // 30 minutes
const MAX_MEMORY_ENTRIES = 500;

// ── In-Memory Fallback Cache ─────────────────────────────────
const memoryCache = new Map();

function hashKey(shopId, message) {
  // Simple string hash — good enough for cache keys
  const input = `${shopId || 'global'}:${message.toLowerCase().trim().slice(0, 200)}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `ai_cache:${Math.abs(hash).toString(36)}`;
}

function evictMemoryCache() {
  if (memoryCache.size <= MAX_MEMORY_ENTRIES) return;
  const now = Date.now();
  // Remove expired entries first
  for (const [key, entry] of memoryCache) {
    if (now > entry.expiresAt) memoryCache.delete(key);
  }
  // If still too large, remove oldest entries
  if (memoryCache.size > MAX_MEMORY_ENTRIES) {
    const entries = [...memoryCache.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toRemove = entries.slice(0, entries.length - MAX_MEMORY_ENTRIES);
    for (const [key] of toRemove) memoryCache.delete(key);
  }
}

// ── Upstash Redis Cache ──────────────────────────────────────
let redisClient = null;
let redisChecked = false;

async function getRedis() {
  if (redisChecked) return redisClient;
  redisChecked = true;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  try {
    const { Redis } = await import(/* webpackIgnore: true */ '@upstash/redis');
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch {
    return null;
  }
}

// ── Daily Usage Tracking (per-shop quota) ────────────────────
async function getDailyUsage(shopId) {
  const key = `ai_usage:${shopId || 'global'}:${new Date().toISOString().slice(0, 10)}`;
  const redis = await getRedis();
  if (redis) {
    try {
      const count = await redis.get(key);
      return parseInt(count, 10) || 0;
    } catch { /* fall through */ }
  }
  // Memory fallback
  const entry = memoryCache.get(key);
  return entry?.count || 0;
}

async function incrementDailyUsage(shopId) {
  const key = `ai_usage:${shopId || 'global'}:${new Date().toISOString().slice(0, 10)}`;
  const redis = await getRedis();
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 86400); // TTL: 24h
      return count;
    } catch { /* fall through */ }
  }
  // Memory fallback
  const entry = memoryCache.get(key);
  const newCount = (entry?.count || 0) + 1;
  memoryCache.set(key, { count: newCount, expiresAt: Date.now() + 86400000 });
  return newCount;
}

// ── Public API ───────────────────────────────────────────────
export const aiCache = {
  /**
   * Get cached AI response
   * @param {string} shopId
   * @param {string} userMessage - The last user message
   * @returns {Promise<string|null>} Cached response or null
   */
  async get(shopId, userMessage) {
    if (!userMessage || userMessage.length < 3) return null;
    const key = hashKey(shopId, userMessage);

    // Try Redis first
    const redis = await getRedis();
    if (redis) {
      try {
        const cached = await redis.get(key);
        if (cached) {
          console.log(`[AI Cache] HIT (Redis) for shop=${shopId}`);
          return cached;
        }
      } catch { /* fall through */ }
    }

    // Memory fallback
    const entry = memoryCache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
      console.log(`[AI Cache] HIT (Memory) for shop=${shopId}`);
      return entry.response;
    }

    return null;
  },

  /**
   * Cache an AI response
   * @param {string} shopId
   * @param {string} userMessage
   * @param {string} aiResponse
   */
  async set(shopId, userMessage, aiResponse) {
    if (!userMessage || !aiResponse || userMessage.length < 3) return;
    const key = hashKey(shopId, userMessage);

    // Save to Redis
    const redis = await getRedis();
    if (redis) {
      try {
        await redis.set(key, aiResponse, { ex: CACHE_TTL_SECONDS });
      } catch { /* fall through */ }
    }

    // Always save to memory too (fast local cache)
    evictMemoryCache();
    memoryCache.set(key, {
      response: aiResponse,
      createdAt: Date.now(),
      expiresAt: Date.now() + (CACHE_TTL_SECONDS * 1000)
    });
  },

  /** Check if shop has exceeded daily AI quota */
  async checkQuota(shopId, maxDaily = 500) {
    const usage = await getDailyUsage(shopId);
    return { usage, exceeded: usage >= maxDaily, remaining: Math.max(0, maxDaily - usage) };
  },

  /** Increment daily usage counter */
  async trackUsage(shopId) {
    return incrementDailyUsage(shopId);
  }
};
