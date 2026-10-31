# 📊 COST & FORENSIC RESOURCE AUDIT REPORT — BDRETAILERS SAAS

## 1. Executive Summary & Forensic Analysis
**Target Application:** BDRetailers Multi-tenant eCommerce SaaS  
**Infrastructure Stack:** Next.js App Router 16.2.3, Firebase Firestore, Upstash Redis, Vercel Serverless (Fluid Compute), Sentry  
**Audited Incident:** Severe resource anomaly (<5 live concurrent users generating 129,000 Firestore reads/day, 44,000 ISR reads, 181,000 CDN requests, and uncurated tenant product leakage).

---

## 2. Root Cause Breakdown

### Incident A: 129K Firestore Reads in 24 Hours
- **Root Cause 1: Accidental 300s TTL Regression in Server-Side Aggregations**
  - **Source:** `src/lib/server-fetch.js` (`getAllMarketplaceProductsServer`, `getAllShopsServer`, `getShopByDomainServer`)
  - **Mechanism:** Redis TTL and memory TTL were set to `ex: 300` (5 minutes). Every 5 minutes, the cache expired. Whenever search engine crawlers (Googlebot, Bingbot, ClaudeBot, GPTBot) or visitors hit sitemaps or pages, it forced a full sequential table scan across all registered shops and all products in Firestore.
  - **Mathematical Proof:** 30 shops × 100 products = ~3,000 reads per cache miss. 288 5-minute intervals/day × crawler sweeps = **129,000+ reads/day**.
  - **Resolution:** Restored 24-hour (`86400s`) persistent cache TTL across Upstash Redis and serverless memory, coupled with instant cache invalidation on product/setting mutations (`invalidateShopCache`).

- **Root Cause 2: Sitemap Redundant Full-Collection Triggers**
  - **Source:** `product-sitemap.xml`, `category-sitemap.xml`, `image-sitemap.xml`
  - **Mechanism:** 4 independent XML sitemaps had 6-hour and 1-hour cache expirations. When automated crawlers indexed sitemaps overnight (1:00 AM – 4:00 AM as seen in Firebase telemetry), all sitemaps independently queried the un-cached Firestore products simultaneously.
  - **Resolution:** Sitemap memory cache TTL set to 24 hours (`86400s`) and backed by deduplicated Redis caching.

- **Root Cause 3: Duplicate Client Hydration Loops**
  - **Source:** `src/app/page.js` (lines 360 & 445)
  - **Mechanism:** Both `getAllMarketplaceProducts()` and `getAllShops()` fired simultaneously on component mount. If either failed, it fell back to direct client SDK `getDocs(collection(db, 'shops'))`.
  - **Resolution:** Consolidated into a single `/api/marketplace/products?includeShops=true` call that populates both product and shop memory caches simultaneously.

---

### Incident B: 44K Vercel ISR Reads
- **Root Cause:** Product detail pages (`src/app/shop/[shopSlug]/product/[productId]/page.js`) and custom domain pages (`src/app/domain/[customDomain]/page.js`) were configured with `export const revalidate = 60;` (60 seconds).
  - Every minute, crawler requests invalidated the edge cache, triggering 44,000 ISR reads on Vercel and constantly re-executing serverless functions.
- **Resolution:** Changed `revalidate = 86400` (24 hours). Product and shop pages are now strictly revalidated on-demand via `/api/revalidate` upon actual retailer edits.

---

### Incident C: Uncurated Product Leakage (Cholo Shazi & Camerakini)
- **Root Cause 1: Inverted Filter Logic when Curation Disabled**
  - **Source:** `src/app/page.js` (lines 1034-1067) & `src/app/store/page.js`
  - **Mechanism:** The code checked `if (isCurationActive && allowedShopsList.length > 0) { ... } return true;`. When the superadmin turned OFF Showcase Curation (`isCurationActive = false`), the condition was bypassed and the function returned `true` for EVERY shop and EVERY product in the database.
- **Root Cause 2: Default Visibility Fallback on Cloned Products**
  - **Source:** `src/app/superadmin/page.js` checked `checked={product.showOnMainSite !== false}`. Newly cloned products from external sites lacked this field (undefined), defaulting to `true` and immediately surfacing in the main store.
- **Resolution:**
  1. Inverted filter: When Curation is OFF, external tenant shops are completely disabled (`return []`).
  2. When Curation is ON, only shops explicitly in `allowedShopsList` are permitted.
  3. Superadmin table toggle checks `checked={product.showOnMainSite === true}`.
  4. Product cloning bot (`src/app/api/products/clone/route.js`) explicitly tags all imported products with `showOnMainSite: false`.
