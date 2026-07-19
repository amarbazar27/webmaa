<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# White-Label Mobile App Build & Versioning Rules
- Maintain persistent per-shop app version codes in `scripts/app-versions.json`.
- Every time an app is built for a shop (e.g. `messerbazar`, `camerakini`, `main`), `scripts/build-tenant-app.js` MUST automatically auto-increment the version code (e.g. 3 -> 4 -> 5).
- Never re-use previous version codes for Play Console uploads.

