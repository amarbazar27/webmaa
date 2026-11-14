---
name: modern-web-guidance
description: Google Chrome official Modern Web Guidance (MWG) suite. Scans codebases with local AST/DOM parsers via `npx modern-web-guidance@latest legacy-scan` to identify and replace outdated web APIs with modern Baseline web standards (native dialog, popover, CSS light-dark, container queries, scheduler.yield, IME-safe keydown handlers, view transitions).
---

# Google Chrome Modern Web Guidance (MWG)

The Google Chrome team's official suite for modernizing web applications with Baseline-compliant web standards.

## Capabilities & Commands

### 1. Legacy Code Scanning
Static analysis of local directories (HTML, CSS, JS/TS, React/Next.js components) using zero-token AST, DOM, and CSS parsers:
```bash
npx modern-web-guidance@latest legacy-scan .
```

### 2. Search Web Platform Guidelines
```bash
npx modern-web-guidance@latest search "<topic>"
```

### 3. Retrieve Specific Guide
```bash
npx modern-web-guidance@latest retrieve "<guide-id>"
```

## Key Modern Patterns Enforced

1. **Dark Mode & Theming (`dark-mode-toggle`)**:
   - Synchronize `<meta name="color-scheme">` ("light dark", "light", "dark")
   - Declare `document.documentElement.style.colorScheme = theme`
   - Pair with CSS `light-dark()` and `:root { color-scheme: light dark; }`

2. **IME-Safe Enter Submission (`ime-safe-enter-submit`)**:
   - In any `keydown` listener listening for `e.key === 'Enter'`, guard with `!e.isComposing && e.keyCode !== 229` to avoid breaking Japanese, Chinese, or Bengali Avro phonetic character conversion.

3. **Modern CSS & Layout (`css-layout`, `popover-api`, `dialog-element`)**:
   - Prefer native `<dialog>` and HTML `popover` API over custom click-outside JavaScript overlays.
   - Prefer CSS Subgrid and Container Queries (`@container`) over window resize JavaScript listeners.
