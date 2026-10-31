# 🎯 RESOURCE BUDGET & USAGE GUARDRAILS — BDRETAILERS SAAS

## 1. Operational Resource Budgets (For <5 Concurrent Visitors)

| Metric | Previous Observed | Hard Engineering Target | Status |
|---|---|---|---|
| **Daily Firestore Reads** | 129,000 / day | < 2,000 / day | **Hard Limit: Guarded by 30-day Redis & Edge Cache** |
| **Daily Firestore Writes** | 258 / day | < 500 / day | **Compliant** |
| **Vercel Fluid CPU (7 Days)** | 10m 26s | < 5m / 7 days | **Optimized via Edge Log & ISR Elimination** |
| **Vercel ISR Reads (30 Days)**| 44,000 | < 500 / month | **Optimized via revalidate=2592000 (30 days)** |
| **Fast Origin Transfer** | 1.47 GB / month | < 500 MB / month | **Optimized via Curation Filtering** |
| **Public Cache Hit Ratio** | ~60% | > 98% | **Enforced via Browser + Edge + Redis 30-day Caches** |
| **Unapproved Shop Leaks** | 100% leak when off | 0% (Zero leak) | **Mathematically Enforced in Code** |

---

## 2. Telemetry & Alerting Thresholds
- **Firestore Read Alert:** Trigger alert if daily reads exceed 10,000 operations.
- **Vercel Function Error Alert:** Sentry notifies if serverless function error rate exceeds 1%.
- **Rate Limit Trigger:** Upstash Redis flags IPs exceeding 100 requests/minute on public endpoints.
