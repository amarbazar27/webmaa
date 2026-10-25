# Performance & Architecture Rollback Guide

## 1. Safe Reversion Procedures

All performance optimizations implemented in this cycle are small, modular, non-destructive, and strictly backward-compatible. No database schemas were altered, dropped, or migrated.

### Option A: Clean Git Revert (Recommended)
To revert all changes to the exact previous commit state:
```bash
git revert HEAD --no-edit
npm run deploy
```

### Option B: Granular Per-Component Rollback
If you wish to revert an individual optimization without affecting other fixes:

1. **Rollback Marketplace API Route**:
   - Delete `src/app/api/marketplace/products/route.js`.
   - Revert `src/lib/firestore.js` to bypass the REST check and use direct collection queries.

2. **Rollback Billing Page Shimmer & Fallback**:
   - Revert `src/app/dashboard/billing/page.js` to previous commit version:
   ```bash
   git checkout HEAD~1 -- src/app/dashboard/billing/page.js
   ```

3. **Rollback Mobile Dashboard Topbar**:
   - Revert `src/app/dashboard/layout.js`:
   ```bash
   git checkout HEAD~1 -- src/app/dashboard/layout.js
   ```

4. **Rollback Social Hub Multi-Field Resolver**:
   - Revert `src/app/api/social/connect/route.js`, `settings/route.js`, `conversations/route.js`:
   ```bash
   git checkout HEAD~1 -- src/app/api/social/
   ```

---

## 2. Production Rollback Precautions
- **Database Safety**: Zero data deletion scripts were executed. No Firestore documents, collections, or indexes require restoration.
- **Client Cache Flush**: If rolling back `sessionStorage` or `localStorage` caches, advise testing in an incognito window or updating cache version keys (`bd_marketplace_products`).
