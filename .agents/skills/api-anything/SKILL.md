---
name: api-anything
description: >-
  Network operation and JSON API extraction protocol inspired by goodnight000/api-anything.
  Turns external web platforms, competitor product feeds, and supplier listings into clean, lightweight
  JSON operations via HTTP interception rather than heavy headless browser automation.
argument-hint: "<url-or-target-operation>"
---

# 🌐 API-Anything: Lightweight Network Operation Interception Protocol

Inspired by `goodnight000/api-anything`.
Allows AI agents and background workers to interact with external web pages and e-commerce platforms without spinning up heavy headless browsers (Puppeteer/Playwright/Chrome) that exhaust serverless RAM and CPU quotas.

## Operating Principles
1. **Network Operation Over Headless Browsers**:
   - Instead of launching a browser to render a page, identify the frontend API endpoints, GraphQL queries, or XHR payloads the website uses.
   - Replicate the exact HTTP headers (`User-Agent`, `Accept`, `Referer`) and fetch clean JSON data directly.
2. **Serverless & Edge Optimization**:
   - Zero browser binaries required. Code runs efficiently inside Vercel serverless functions, Next.js Edge routes, or local scripts.
3. **Resilience & Self-Healing**:
   - If an endpoint schema shifts, parse fallback HTML structures using lightweight regex or fast HTML parsers instead of crashing.
4. **Data Privacy & Security**:
   - Never serialize live session cookies or merchant authentication tokens in source control. Always source secrets from `.env.local` or runtime request headers.
