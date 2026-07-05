# Platform Features

This document provides a detailed overview of the enterprise-grade features implemented in the BDRetailers SaaS e-commerce framework.

---

## 1. ⚡ Storefront Speed & Bundle Optimization
* **Lazy Module Bundling**: Offloads interactive code from the initial page weight. Components such as AI voice controls, custom reviews, map selector dialogs, and smart shopping engines load asynchronously (`next/dynamic`) when the user interacts with the page.
* **Low Initial Load Latency**: Achieves optimized page-speed scores to maximize conversion rates on low-bandwidth mobile connections.

---

## 2. 🛡️ Intelligent Fraud Risk Assessment Engine
* **Multilayered Check Heuristics**: Calculates a fraud risk score (0-100%) and categorizes the transaction risk level (Low, Medium, High, Very High).
* **Scanning Criteria**:
  * **Short & Gibberish Names**: Evaluates name lengths and consonant-to-vowel ratios.
  * **Mismatched Country Codes**: Flags mismatched international codes or virtual numbers.
  * **Disposable Emails**: Identifies fake addresses using a blacklist of temporary domains.
  * **Duplicate IP Rates**: Checks for multiple orders originating from the same IP address in a short time frame.
  * **Proxy / VPN / Hosting Ranges**: Flags serverless or virtual hosting addresses.
* **Dashboard Warnings**: Displays risk levels and detailed flagging reasons directly inside the merchant order review console.

---

## 3. 🚚 Steadfast Courier API Integration
* **One-Click Bookings**: Prefills client names, addresses, and order values, enabling merchants to book courier parcels with one tap.
* **Real-time Tracking Updates**: A secure endpoint receives updates from Steadfast (`/api/courier/steadfast/webhook`).
* **Automated Status Mapping**: Maps courier statuses (`delivered`, `cancelled`) to order statuses.
* **Stock Release Handling**: Releases product inventory back to active store listings when shipments are rejected or cancelled.

---

## 4. 🗺️ Google Maps API Integration
* **Google Maps JS API**: Supports accurate shipping pinpoints.
* **Places Autocomplete**: Autocompletes Bangladeshi roads, building details, and areas.
* **Centering Button**: Pans to the client's current GPS location.
* **Delivery Zone Constraints**: Evaluates client location coordinates against the merchant's coordinates, showing warnings if a pin is placed outside the delivery radius.

---

## 5. 📊 Advanced Multi-Pixel Script Injector
* **Multi-Platform Tags**: Supports Meta (Facebook), TikTok, Google Ads, GA4, Pinterest, Snapchat, and LinkedIn.
* **Event Mapper**: Translates storefront events (Page View, Add to Cart, Begin Checkout, Purchase) into platform-specific standards.

---

## 6. 🌐 Meta Conversion API (CAPI) Integration
* **Server-Side Purchases**: Sends server-side conversion payloads.
* **SHA-256 Hashing**: Complies with privacy standards by hashing customer phone numbers and emails on the server before transmission.
* **Deduplication Engine**: Uses the unique Firestore order ID as the event ID on both browser pixels and server-side CAPI to prevent double-counting.

---

## 7. 🛒 Incomplete Orders Recovery Manager
* **Debounced Auto-Saving**: Periodically saves in-progress carts, addresses, and contact info to Firestore as drafts.
* **Recovery Console**:
  * **Quick Dial**: Call customers with one tap.
  * **WhatsApp Templates**: Generates prefilled WhatsApp text templates in Bengali.
  * **Recovery Analytics**: Displays recovery rate, potential revenue, recovered totals, and active sessions.
  * **Status Logging**: Automatically transitions drafts to a `recovered` status when a checkout is completed.
