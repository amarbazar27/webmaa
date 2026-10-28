<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may differ from training data. Read relevant guides in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
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
- Every time an app is built for a shop (`messerbazar`, `camerakini`, `main`), `scripts/build-tenant-app.js` MUST automatically auto-increment the version code (e.g. 3 -> 4 -> 5).
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
- Trigger Android builds via repository_dispatch API:
  - Endpoint: `POST https://api.github.com/repos/amarbazar27/webmaa/dispatches`
  - Auth: `token $GITHUB_PAT` (from .env.local → GITHUB_PAT)
  - Body: `{"event_type":"build-app","client_payload":{"shopSlug":"<slug>"}}`
  - Slugs: `main` = bdretailers app, `messerbazar` = Messer Bazar app
- Actions URL: https://github.com/amarbazar27/webmaa/actions

# Google Sign-In Native Auth Architecture
- The web app (`auth.js`) detects Flutter WebView via `window.flutter_inappwebview`.
- When in WebView: calls `NativeGoogleSignIn` JS handler → Flutter triggers native Android account picker.
- ServerClientId: `156216219253-4truhu9ta74ochdqc0bo995fgkpuqv2l.apps.googleusercontent.com`
- SHA-1 in Firebase Console: `25:78:60:62:A1:A1:47:B8:84:46:7F:38:E0:3C:0B:36:AE:1A:A6:09`

# ⚡ Ponytail Senior Developer Rules (YAGNI & Anti-Bloat)
- The best code is the code you never wrote. Decision Ladder:
  1. **Does this need to exist?** (YAGNI) -> Skip it if speculative.
  2. **Already in this codebase?** -> Search and reuse existing helpers, components, and hooks.
  3. **Stdlib does it?** -> Use standard language/runtime built-ins.
  4. **Native platform feature?** -> Prefer native HTML5/CSS/browser APIs over external packages.
  5. **Installed dependency?** -> Use existing packages in package.json.
  6. **Can it be one line?** -> Keep it one line.
  7. **Only then:** -> Write the minimum code that cleanly works.
- **Lazy, not negligent:** Never compromise database & data protection, input validation, authentication boundaries, security, or accessibility.
- **Root cause over symptoms:** Fix issues at their shared origin, never patch symptoms across multiple callers.
- **Deletion over addition:** Remove dead code, avoid speculative boilerplate.

# 🌟 Frontend Polish, SEO & High-Converting Copywriting Standards
- **Frontend Polish:** Maintain WCAG AA contrast, dark mode, 60fps responsiveness, hover/active states on buttons, loading skeletons, and print stylesheet.
- **Technical SEO:** Maintain comprehensive XML sitemaps, JSON-LD Schema markup, canonical tags, clean URL slugs, and exactly 1 H1 per page.
- **High-Converting Copy:** On all CTAs, use explicit action verbs + clear outcomes (e.g. "১ মিনিটে ফ্রি স্টোর তৈরি করুন"). Keep copy scannable, honest, and benefit-driven before technical specifications.

# 🛡️ Alibaba OpenCodeReview (OCR) & Security Standards
- Registered skill located at `.agents/skills/open-code-review/SKILL.md`.
- Enforce Alibaba standards: zero `var`, strict equality `===`, defensive null checking, zero unsanitized `innerHTML` or script injection vulnerabilities, and verified error boundaries.
- Run or verify with `scripts/ocr-check.js` on code changes.

# 🔒 MANDATORY NVIDIA SKILLSPECTOR REPO & SKILL SECURITY GATE
- **Absolute Rule**: Whenever the user asks to install, clone, import, or integrate ANY third-party repository, GitHub package, skill, MCP server, or tool:
  1. **NEVER install blindly.**
  2. ALWAYS scan the target repo/skill first with NVIDIA SkillSpector (`uv run --directory C:\Users\missi\.gemini\tools\skillspector skillspector scan <target> --no-llm`).
  3. Inspect the security report for malicious prompt injections, data exfiltration, webshells, backdoor credentials, destructive commands, or excessive agency.
  4. **Only proceed if verified SAFE.** If vulnerabilities or suspicious payloads are detected, HALT immediately, explain the risks in detail in Bengali, and DO NOT install.
- SkillSpector CLI engine is permanently maintained at `C:\Users\missi\.gemini\tools\skillspector`.

# 🧠 Autonomous 280+ Agency Agents Coordination (Zero Manual Overhead)
- The 280+ Agency Agents repository is permanently installed locally at `C:\Users\missi\.gemini\agency-agents` and `C:\Users\missi\.claude\agents`.
- Dynamically assume the specialist persona (Frontend Developer, UI Designer, Backend Architect, Security Auditor, Growth Marketer, QA Engineer) while strictly adhering to Ponytail anti-bloat and Alibaba quality rules.

# 🔍 Autonomous 3-Tier SEO & Generative Engine Optimization (GEO) Protocol
- **Tier 1 — Search Telemetry (Google Search Console MCP)**: Connect via `mcp-search-console` (`AminForou/mcp-gsc`). Read real-time search queries, impressions, CTR, average rankings (positions 11–20), and indexing/sitemap issues.
- **Tier 2 — Semantic SEO & Intent Mapping**: Built-in `.agents/skills/claude-seo` and `agency-agents` SEO Specialist for keyword intent mapping, semantic architecture, and content gap analysis without paid subscriptions.
- **Tier 3 — GEO & AI Discovery**: Maintain `public/llms.txt` with concise entity definitions for AI scrapers (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews). Maintain `src/app/robots.txt/route.js` allowing AI engines while blocking aggressive SEO scrapers. SSR-rendered JSON-LD schema on all storefront and product pages.

# ☁️ Webmaa Production Cloud Stack Status & Persistent Memory
- **Active & Configured Services (NEVER FORGET OR RE-SUGGEST SETTING UP)**:
  - **Cloudflare DNS & CDN**: Configured and active for `bdretailers.com` (SSL Full/Strict, Vercel CNAME).
  - **Resend Transactional Email**: Verified for `bdretailers.com`. Domain verified; personal MX records remain untouched.
  - **Upstash Redis**: Configured in Vercel Production environment (`UPSTASH_REDIS_*` / `KV_REST_API_*`).
  - **Sentry Error Tracking**: Configuration files established (`sentry.*.config.js`).
  - **Google Search Console MCP**: Service Account configured at `D:/search-console-ai-510515-6f3365e7d7df.json` for `gsc-reader@search-console-ai-510515.iam.gserviceaccount.com`.

# 🔔 Push Notification Architecture (FCM)
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY` MUST be set in `.env.local` AND Vercel env for push notifications to work.
- Service Worker: `public/firebase-messaging-sw.js` handles background push + click actions.
- Client: `src/lib/fcm.js` handles token generation, caching, foreground messages.
- API: `/api/broadcast` sends FCM push; `/api/fcm-token` registers device tokens.
- Tokens stored in: `global_fcm_tokens` (all devices) + `shops/{shopId}/fcmTokens` (shop-scoped).

# 📱 Social Media Automation & One-Click Facebook Login Architecture
- **1-Click Facebook OAuth**: Retailer connects via "Connect with Facebook" button (`/api/social/facebook/oauth/init` -> Meta authorization dialog -> `/api/social/facebook/oauth/callback`). Auto-exchanges for never-expiring Page Access Token and subscribes webhooks.
- **Manual Fallback**: Advanced collapsible token input available for testing via Graph API Explorer.
- **Facebook Comment Auto-Reply & Messenger**: Meta Webhooks -> `/api/social/facebook-webhook` -> AI reply via Groq LPU (Llama 3.3 70B) with Vyce AI fallback.
- **Meta Data Deletion Callback**: Mandatory compliance endpoint at `/api/social/facebook/data-deletion`.
- **Human-AI Handoff**: Retailer types "." to pause AI, "." again to resume — stored in conversation state in Firestore.
- **WhatsApp Business**: Meta Cloud API integration in Social Hub (`/api/social/connect`).

# 🤖 Groq LPU Multi-Account & Dual-Engine AI Architecture
- **Primary Inference**: Groq LPU (`llama-3.3-70b-versatile`) at temperature 0.35 for fast (300+ tps), natural Bengali conversations.
- **Failover Rotation**: Automatic rotation between `GROQ_API_KEY` (Account 1) and `GROQ_API_KEY_2` (Account 2) if rate limits (HTTP 429) occur.
- **Negative Constraints**: Strictly forbid rural slang or over-familiar terms. Always address users respectfully with "আপনি" or polite "ভাইয়া/আপু". Ground answers strictly in the shop product catalog.
- **Bengali Phonetic & Synonym Normalization**: Map common Bengali colloquial spellings (পেঁয়াজ / পেয়াজ / পিয়াজ, আলু / Potato, তেল / সয়াবিন).
- **Secondary Fallback**: Vyce AI (`agnes-3.0-flash` at `https://vyceai.com/v1`) if Groq keys are exhausted.

# 🎨 Modern UI/UX, Design Systems & AI UI Cloner
- **Instant Competitor UI Cloner**: Retailers can paste any competitor website URL in `/dashboard/templates` (`/api/design/clone-theme`). Extracts brand colors, hero banners, logo, and layout preset into native BD Retailers template without touching core React cart/checkout functions.
- **Micro-interactions**: Use pure, zero-dependency Tailwind CSS for buttons, inputs, toggles, badges, and skeleton loaders.
- **Brand & Header Zero-Truncation**: NEVER use artificial width restrictions (e.g. `max-w-[95px]`, `truncate`) on store titles in headers. Always render with `whitespace-nowrap` and adaptive font sizing.
- **Liquid UI Micro-Interactions & Tactile Sound Engine**: Zero-asset Web Audio API sound synthesis (`src/lib/sound.js`) delivering instant mechanical pops and tab transitions. Includes merchant sound toggle in dashboard.
- **Universal Multi-Language Engine**: Support English, Bengali, and global languages via dynamic Google Website Translator script with custom Tailwind styling.

# 📱 Android 15 (SDK 35) & Google Play R8 Optimization Protocol
- **Edge-to-Edge Compatibility**: Android 15 targets SDK 35 rendering edge-to-edge natively. Flutter handles window insets natively — never call `ComponentActivity.enableEdgeToEdge()` inside `FlutterActivity` to prevent Kotlin receiver type mismatch errors.
- **R8 Proguard**: Set `minifyEnabled true` and `shrinkResources true` on release builds with keep rules for Flutter channels, InAppWebView, and Firebase Messaging.

# 🛡️ Cloudflare Security Audit Protocol
- Enforce 6-phase evidence-based vulnerability hunting on sensitive endpoints: Reconnaissance, Coverage-Led Hunting, Adversarial Validation, Strict Schema, Independent Verification, and Hardened Defense (HMAC verification, rate limiting, and sanitized inputs).
