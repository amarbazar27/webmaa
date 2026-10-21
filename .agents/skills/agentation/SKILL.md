---
name: agentation
description: >-
  Visual feedback, DOM inspection, and component hierarchy mapping protocol inspired by benjitaylor/agentation.
  Provides structured context bridging browser DOM elements to exact React components, CSS selectors, and source file locations.
argument-hint: "<ui-element-or-screen>"
---

# 🎯 Agentation: Visual UI Element Locator & Context Protocol

Inspired by `benjitaylor/agentation`.
Agentation provides a deterministic bridge between what the user sees in the browser and the exact underlying source code files in Next.js / React 19.

## When to Apply
- When fixing UI bugs, alignment issues, or styling inconsistencies reported on specific page sections.
- When transforming a visual screenshot or user bug description into exact codebase edits.

## Core Directives
1. **Target Identification**:
   - Resolve visual elements to their precise React App Router file (e.g. `src/app/page.js`, `src/components/...`, `src/app/store/[shopSlug]/page.js`).
   - Identify exact CSS classes, Tailwind utility classes, and data-attributes (`data-testid`, `aria-label`).
2. **Animation & Frame Inspection**:
   - For interactive elements (dropdowns, drawer sheets, modal overlays, animated banners), inspect both entry and exit transition states to avoid layout jumps or clipping.
3. **Structured Handoff**:
   - When generating or proposing UI updates, always cite the exact file path and line numbers with markdown links (e.g. `[Component](file:///path/to/file#L10-L20)`).
