<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🚨 CRITICAL DATABASE & DATA PROTECTION RULE (ABSOLUTE RESTRICTION)
- NEVER, under any circumstance, delete, wipe, drop, clear, or bulk-remove any database, collection, document, table, user profile, or order data.
- NEVER run scripts, Firebase/Firestore batch deletes, SQL drop commands, or write code that purges live database records without:
  1. Giving a LARGE, PROMINENT WARNING to the user in Bengali explaining exactly what is at risk.
  2. Clearly listing all potential losses (users, orders, financial records, irreversible damage).
  3. Obtaining explicit, clear, manual written permission from the user specifically authorizing the deletion.
- Even with Turbo Mode or auto-proceed active, DATA DELETION / DATABASE PURGING IS STRICTLY FORBIDDEN without prior explicit user confirmation. Protecting the database and user data is the #1 highest priority at all times.

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

# ⚡ Ponytail Senior Developer Rules (YAGNI & Anti-Bloat)
- The best code is the code you never wrote. Before generating code, stop at the first rung of the Decision Ladder:
  1. **Does this need to exist?** (YAGNI) -> If speculative, skip it.
  2. **Already in this codebase?** -> Search first. Reuse existing helpers, components, and hooks.
  3. **Stdlib does it?** -> Use standard language/runtime built-ins.
  4. **Native platform feature?** -> Prefer native HTML5/CSS/browser APIs over heavy external packages.
  5. **Installed dependency?** -> Use existing packages in package.json.
  6. **Can it be one line?** -> Keep it one line.
  7. **Only then:** -> Write the minimum code that cleanly works.
- **Lazy, not negligent:** Never compromise database & user data protection, input validation, authentication boundaries, security, or accessibility.
- **Root cause over symptoms:** Fix issues at their shared origin, not by patching symptoms across multiple callers.
- **Deletion over addition:** Remove dead code, avoid speculative boilerplate.

# 🌟 Frontend Polish, SEO & High-Converting Copywriting Standards
- **Frontend Polish:** Maintain WCAG AA contrast, clean dark mode, 60fps responsiveness, hover/active states on buttons, loading skeletons, and print stylesheet.
- **Technical SEO:** Maintain comprehensive XML sitemaps, JSON-LD Schema markup, canonical tags, clean URL slugs, and exactly 1 H1 per page.
- **High-Converting Copy:** On all CTAs, use explicit action verbs + clear outcomes (e.g. "১ মিনিটে ফ্রি স্টোর তৈরি করুন"). Keep copy scannable, honest, and benefit-driven before technical specifications.

# 🛡️ Alibaba OpenCodeReview (OCR) & Security Standards
- Always enforce Alibaba code review standards: zero `var`, strict equality `===`, defensive null checking, zero unsanitized `innerHTML` or script injection vulnerabilities, and verified error boundaries.
- Run or verify with `scripts/ocr-check.js` on code changes.

# 🧠 Autonomous 280+ Agency Agents Coordination (Zero Manual Overhead)
- The entire 280+ Agency Agents repository is permanently installed locally at `C:\Users\missi\.gemini\agency-agents` and `C:\Users\missi\.claude\agents`.
- The user does not need to invoke agents manually. The AI autonomously detects the task domain and assumes the specialist persona (Frontend Developer, UI Designer, Backend Architect, Security Auditor, Growth Marketer, QA Engineer) while strictly adhering to Ponytail anti-bloat and Alibaba quality rules.

