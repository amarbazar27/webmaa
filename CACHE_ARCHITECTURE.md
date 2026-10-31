# 🧱 CACHE ARCHITECTURE SPECIFICATION — BDRETAILERS SAAS

## 1. Multi-Tiered Caching Hierarchy

```
[ Client Browser ]
        │  (SessionStorage / LocalStorage / ServiceWorker)
        ▼
[ Vercel CDN Edge Network ]
        │  (HTTP Cache-Control: s-maxage=86400, stale-while-revalidate=86400)
        ▼
[ Serverless Function In-Memory Layer (LRU / Map) ]
        │  (Node memory cache with in-flight Promise deduplication)
        ▼
[ Distributed Upstash Redis Layer ]
        │  (Cross-lambda persistent cache with 24-hr to 30-day TTLs)
        ▼
[ Google Cloud Firestore Database (Origin) ]
```

---

## 2. Key Cache Stores & Expirations

| Key Pattern | Store | TTL | Invalidation Trigger |
|---|---|---|---|
| `cache:shop_products:{shopId}` | Upstash Redis | 30 days (2,592,000s) | Product create/edit/delete in dashboard |
| `cache:shop_categories:{shopId}` | Upstash Redis | 24 hours (86,400s) | Category create/edit/delete in dashboard |
| `cache:shop_domain:{domain}` | Upstash Redis | 24 hours (86,400s) | Domain binding in dashboard |
| `cache:all_shops` | Upstash Redis | 24 hours (86,400s) | Shop onboarding / status change |
| `cache:marketplace_products` | Upstash Redis | 24 hours (86,400s) | Whitelist update or product mutation |
| `bd_marketplace_products` | Client SessionStorage | 1 hour (3,600s) | Window session restart / hard reload |

---

## 3. Cache Stampede Prevention
All heavy aggregation endpoints (`getAllMarketplaceProductsServer`, `getAllShopsServer`) utilize **in-flight promise coalescing** via `dedupeRequest(key, fn)`. When multiple asynchronous requests hit the server during a cache miss, only one database read operation executes; all callers await the single promise.

---

## 4. Multi-Tenant Safety & Data Isolation
- **Tenant Scope Enforcement:** Cache keys are strictly namespaced with tenant identifiers (`shopId`, `domain`).
- **Private Data Protection:** Private customer information (orders, drafts, user profiles, authentication tokens) is **NEVER** stored in shared Redis or public CDN caches.
- **Atomic Checkout Verification:** Inventory decrement and stock availability validation always bypass public caches and execute inside Firestore transactions to prevent overselling.
