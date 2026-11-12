import { getShopByDomainServer } from './server-fetch';

/**
 * getShopByDomain — Resolve a hostname to a shop document on server.
 * Delegates to the unified server-fetch pipeline with:
 * - 0ms Verified domain map resolution
 * - Native Upstash Redis cross-lambda persistent caching (30-day TTL)
 * - In-flight promise deduplication
 * - Resilient stale fallback to eliminate Firestore query burn
 */
export const getShopByDomain = async (rawDomain) => {
  if (!rawDomain) return null;
  return getShopByDomainServer(rawDomain);
};
