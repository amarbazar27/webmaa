---
name: archify
description: >-
  System architecture and data-flow visualization protocol inspired by tt-a1i/archify.
  Generates interactive, accessible system diagrams, request lifecycles, and architecture delta maps
  for BD Retailers multi-tenant routing, cloud infrastructure, and Flutter WebView bridges.
argument-hint: "<system-or-flow-description>"
---

# 🗺️ Archify: Visual Architecture & System Flow Protocol

Inspired by `tt-a1i/archify`.
Provides visual clarity on system architecture, data pipelines, and third-party integrations across the BD Retailers platform.

## Supported Visual Formats
- **Mermaid Flowcharts & Sequence Diagrams**: Native, zero-dependency Markdown diagrams rendered in artifacts and documentation.
- **Interactive Architecture Artifacts**: Clean standalone HTML visualizations with light/dark theme support, node relationships, and live status states.
- **Delta Architecture Comparison**: Visualizing "before vs after" when introducing new cloud services, database collections, or API routes.

## Core Schemas to Maintain
1. **Multi-Tenant Request Pipeline**: Cloudflare CDN → Next.js App Router Middleware → Shop Slug Resolver → Firestore Cache → React Server Component.
2. **Push Notification Lifecycle**: Event trigger → FCM Admin API → Background Service Worker (`firebase-messaging-sw.js`) / Flutter native handler → Device screen.
3. **Social Media Automation**: Meta Webhook (`/api/social/facebook-webhook`) → HMAC validation → Vyce AI / Groq LPU engine → Graph API reply / DM.
