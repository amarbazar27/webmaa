---
name: replica
description: >-
  Autonomous software reverse-engineering and feature deconstruction suite inspired by Jakeschincariol/replica-skill.
  Deconstructs competitor platforms (Shopify, AiPraktor, Chaldal, Daraz) and guides clean-room reconstruction
  into BD Retailers with Ponytail simplicity, custom branding, and proactive fixes for competitor pain points.
argument-hint: "<target-feature-or-app>"
---

# 🔬 Replica: Autonomous Clean-Room Feature Replication & Engineering

Inspired by `Jakeschincariol/replica-skill` (by Jake Schincariol, author of `arena-skill`).
Replica provides a structured 9-phase framework to deconstruct competitor features, eliminate their flaws, and rebuild them cleanly into BD Retailers with zero code bloat.

## The 9 Modular Phases

### 1. `replica-recon` (Feature & Flow Deconstruction)
- Map user journeys, screen states (loading, empty, filled, error), and network contracts down to exact request/response schemas.
- Document permissions, edge cases, and client-server boundaries.

### 2. `replica-architect` (Data & Route Modeling)
- Translate features into BD Retailers native Firestore collections, security rules, and Next.js App Router API endpoints.
- Preserve zero-data-loss architecture and prevent schema drift.

### 3. `replica-design` (Design Token & Component Translation)
- Extract layout proportions, typography scale, responsive breakpoints, and color roles into Tailwind CSS classes.
- Completely avoid copyrighted assets, third-party logos, or proprietary code; replace with original SVG icons and clean UI patterns.

### 4. `replica-build` (Screen-by-Screen Implementation)
- Code UI components cleanly with React 19 / Next.js 16 conventions.
- Build mobile-first, ensuring 60fps smoothness inside Android Flutter WebViews.

### 5. `replica-backend` (Logic & Third-Party Integration)
- Integrate backend logic cleanly (Firestore transactions, Firebase Auth, FCM push notifications, Resend email, Meta Graph API).

### 6. `replica-test` (Edge Case & Boundary Verification)
- Verify edge cases: network disconnection, empty query results, unauthorized access attempts, and long character inputs.

### 7. `replica-entrepreneur` (Competitor Pain Point Inversion)
- Identify common merchant and customer complaints on competitor platforms (e.g. slow checkout, complicated menus, lack of Bengali support).
- Turn competitor weaknesses into BD Retailers key strengths (e.g. 1-click checkout, instant Bengali AI responses, zero setup fee).

### 8. `replica-brand` (Native BD Retailers Identity Sweep)
- Eliminate all foreign terminology; adapt copywriting for Bangladeshi merchants and shoppers.
- Ensure consistent brand voice, WCAG AA contrast, and localized currency formatting (`৳`).

### 9. `replica-launch` (Production Verification & Deployment)
- Verify clean build (`npm run build`), stage changes, commit, and auto-deploy to production (`npm run deploy`).
