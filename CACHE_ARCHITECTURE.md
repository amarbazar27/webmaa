# 🧱 CACHE ARCHITECTURE SPECIFICATION — BDRETAILERS SAAS

## 1. Multi-Tiered Caching Hierarchy

```
[ Client Browser ]
        │  (SessionStorage / LocalStorage / ServiceWorker)
        ▼
[ Vercel CDN Edge Network ]
        │  (HTTP Cache-Control: s-maxage=2592000, stale-while-revalidate=2592000)
        ▼
[ Serverless Function In-Memory Layer (LRU / Map) ]
        │  (Node memory cache with in-flight Promise deduplication)
        ▼
[ Distributed Upstash Redis Layer ]
        │  (Cross-lambda persistent cache with 30-day TTLs)
        ▼
[ Google Cloud Firestore Database (Origin) ]
```

---

## 2. Key Cache Stores & Expirations

| Key Pattern | Store | TTL | Invalidation Trigger |
|---|---|---|---|
| `cache:shop_products:{shopId}` | Upstash Redis | 30 days (2,592,000s) | Product create/edit/delete in dashboard |
| `cache:shop_categories:{shopId}` | Upstash Redis | 30 days (2,592,000s) | Category create/edit/delete in dashboard |
| `cache:shop_domain:{domain}` | Upstash Redis | 30 days (2,592,000s) | Domain binding in dashboard |
| `cache:shop_slug:{slug}` | Upstash Redis | 30 days (2,592,000s) | Shop settings change |
| `cache:all_shops` | Upstash Redis | 30 days (2,592,000s) | Shop onboarding / status change |
| `cache:marketplace_products` | Upstash Redis | 30 days (2,592,000s) | Whitelist update or product mutation |
| `bd_marketplace_products` | Client SessionStorage | 24 hours | Window session restart / hard reload |

---

## 3. Cache Stampede Prevention
All heavy aggregation endpoints (`getAllMarketplaceProductsServer`, `getAllShopsServer`) utilize **in-flight promise coalescing** via `dedupeRequest(key, fn)`. When multiple asynchronous requests hit the server during a cache miss, only one database read operation executes; all callers await the single promise.

---

## 4. ISR (Incremental Static Regeneration) Revalidation
All ISR routes use `revalidate = 2592000` (30 days). On-demand revalidation via `/api/revalidate` endpoint handles freshness when products/shops change.

---

## 5. Multi-Tenant Safety & Data Isolation
- **Tenant Scope Enforcement:** Cache keys are strictly namespaced with tenant identifiers (`shopId`, `domain`).
- **Private Data Protection:** Private customer information (orders, drafts, user profiles, authentication tokens) is **NEVER** stored in shared Redis or public CDN caches.
- **Atomic Checkout Verification:** Inventory decrement and stock availability validation always bypass public caches and execute inside Firestore transactions to prevent overselling.

---

## 6. Instant Cache Invalidation
`invalidateShopCache(shopId, slug)` purges ALL related caches across:
- In-memory Map (products, categories, shop, all_shops, marketplace_products, global_config)
- Upstash Redis (all matching keys via `redis.del()`)
- Called automatically by dashboard product/shop update APIs
