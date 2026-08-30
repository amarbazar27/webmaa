<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# White-Label Mobile App Build & Versioning Rules
- Maintain persistent per-shop app version codes in `scripts/app-versions.json`.
- Every time an app is built for a shop (e.g. `messerbazar`, `camerakini`, `main`), `scripts/build-tenant-app.js` MUST automatically auto-increment the version code (e.g. 3 -> 4 -> 5).
- Never re-use previous version codes for Play Console uploads.

# Git Deployment & Vercel Push Rules
- ALWAYS run `npm run deploy` after completing any update, fix, or feature request from the user.
- Using `npm run deploy` guarantees a fixed command line so the IDE only asks for permanent permission once.
- ALWAYS place the successful GitHub push commit hash number (e.g. `Commit Hash: ...`) at the VERY FIRST LINE of the response before any other text or description.

# Auto-Proceed & No Manual Approval Rules (CRITICAL)
- NEVER set `RequestFeedback: true` in any artifact ArtifactMetadata. Always set it to `false` or omit it.
- NEVER ask the user for manual approval before running commands. Turbo Mode is permanently ON — execute immediately.
- NEVER wait for the user to "confirm" or "approve" a plan before coding. Just do it.
- If the user says "koro" / "do it" / "fix it" — execute directly without asking follow-up questions.

# Flutter App Build Rules (via GitHub Actions)
- Flutter is NOT installed locally. NEVER try to run `flutter` commands directly.
- To build Android apps, trigger GitHub Actions via repository_dispatch API:
  - Endpoint: `POST https://api.github.com/repos/amarbazar27/webmaa/dispatches`
  - Auth: `token $GITHUB_PAT` (from .env.local → GITHUB_PAT)
  - Body: `{"event_type":"build-app","client_payload":{"shopSlug":"<slug>"}}`
  - Slugs: `main` = bdretailers app, `messerbazar` = Messer Bazar app
- After triggering, tell the user to check: https://github.com/amarbazar27/webmaa/actions

# Google Sign-In Native Auth Architecture
- The web app (auth.js) detects Flutter WebView via `window.flutter_inappwebview`
- When in WebView: calls `NativeGoogleSignIn` JS handler → Flutter triggers native Android account picker
- Flutter `google_sign_in` package uses serverClientId: `156216219253-4truhu9ta74ochdqc0bo995fgkpuqv2l.apps.googleusercontent.com`
- SHA-1 registered in Firebase Console: `25:78:60:62:A1:A1:47:B8:84:46:7F:38:E0:3C:0B:36:AE:1A:A6:09`
