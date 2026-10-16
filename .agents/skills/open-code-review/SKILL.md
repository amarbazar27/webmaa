---
name: open-code-review
description: >
  Alibaba OpenCodeReview (OCR) automated standards and defect prevention engine.
  Enforces deterministic code quality: zero "var", strict equality (===), defensive
  null checks, safe DOM manipulations (no unsanitized innerHTML or eval), SQL/NoSQL
  injection protection, and React component performance standards. Run locally
  via `node scripts/ocr-check.js` or during CI/CD.
argument-hint: "[--path <fileOrDir> | --all]"
license: Apache-2.0
---

# Alibaba OpenCodeReview (OCR) Skill

Automated code review and defect detection engine based on Alibaba's OpenCodeReview (OCR) engineering practices.

## Core Rules & Quality Bar
1. **Zero `var`**: Always use `const` or `let`.
2. **Strict Equality**: Always use `===` and `!==` over `==` and `!=` to eliminate implicit type coercion bugs.
3. **Safe DOM & Zero Dynamic Injection**:
   - Strictly prohibit `eval()`, `new Function()`, and `document.write()`.
   - Never assign directly to `innerHTML` without DOMPurify sanitization; prefer `textContent`.
4. **React & Component Best Practices**:
   - Never declare inner React components inside the render cycle of parent components.
   - Clean dependencies in `useEffect` and `useCallback`.
5. **NoSQL / SQL Injection & Database Protection**:
   - Always sanitize and validate client inputs before Firestore/DB queries.
   - Strictly forbid destructive bulk purge or drop operations.

## Running the Scanner
```bash
# Scan changed / staged files
node scripts/ocr-check.js

# Scan a specific file or folder
node scripts/ocr-check.js --path src/app/api/products

# Scan all core APIs and libraries
node scripts/ocr-check.js --all
```
