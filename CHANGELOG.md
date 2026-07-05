# Changelog

All notable changes to the BDRetailers SaaS E-Commerce platform will be documented in this file.

## [1.1.0] - 2026-07-05

### Added
- **Dynamic Map Modal (Google Maps Integration)**: Upgraded Leaflet maps to official Google Maps JS SDK with support for Places Autocomplete address searching, dragging pins, geolocation centering, reverse geocoding, and maximum delivery radius limits (in kilometers) matching retailer configs.
- **Intelligent Fraud Risk Heuristics Engine**: Scans incoming checkout requests using disposable email checks, name gibberish pattern heuristics, phone frequency velocity matching, and address keywords (proxies, VPN IPs, and mismatched international country codes).
- **Steadfast Courier API Integration**:
  - One-tap booking from dashboard orders panel.
  - Automated tracking status webhook mapping `/api/courier/steadfast/webhook` to handle status changes (`delivered`, `cancelled`).
  - Automatic inventory release upon parcel cancellation.
- **Advanced Multi-Pixel Script Injector**: Loads analytics tags dynamically on storefronts based on merchant preferences for Meta (Facebook), TikTok, Google Ads, GA4, Pinterest, Snapchat, and LinkedIn.
- **Meta Conversion API (CAPI) Integration**: Sends server-side purchase events with SHA-256 encrypted customer parameters (phone/email) and matching browser event IDs for 100% deduplication coverage.
- **Incomplete Orders Manager**:
  - Debounced auto-saving checkout drafts to Firestore `incomplete_orders` collection.
  - Real-time recovery analytics dashboard detailing potential revenue, recovered totals, success rate, and active abandoned carts.
  - One-tap communication templates for WhatsApp (in Bengali) and direct phone calling.

### Changed
- **Storefront Performance Optimization**: Converted heavy shopping, voice panel, reviews, and maps bundle modules to dynamic non-SSR imports (`next/dynamic` with `ssr: false`), dropping main bundle storefront weight by ~80KB for faster loading speed.
- **Dashboard Preferences Panel**: Redesigned settings UI with Outfit/Inter typography, responsive input grids, and active switches to let merchants configure pixel IDs, CAPI keys, Steadfast credentials, and Google Maps setups.
- **Firestore Security Rules**: Restricted access to `incomplete_orders` subcollection to authorized shop admins.

### Fixed
- **Meta Pixel Deduplication Issue**: Client-side pixel event IDs now match server-side CAPI event IDs exactly to prevent double counting.
- **Inventory Mismatch on Reject**: Inventory stock counts are automatically reversed when Steadfast courier parcels are cancelled or rejected by customers.
