# Security Policy

This document outlines the security measures implemented in the BDRetailers platform.

---

## 1. Webhook Validation (Steadfast Courier)

To prevent unauthorized status manipulation, the webhook endpoint (`/api/courier/steadfast/webhook`) verifies incoming payloads:
- Validates the merchant's secret webhook token against the query parameter.
- Skips processing if the signature token is missing or incorrect.

---

## 2. Server-Side Data Privacy (Meta CAPI)

To comply with Meta's privacy standards, customer details (email and phone number) are hashed using **SHA-256** on the server side (`src/lib/serverTracking.js`) before transmission to the Meta Graph API. No plain text customer contact details are transmitted.

---

## 3. Firestore Rules Enforcement

The system uses rules defined in `firestore.rules` to enforce authorization scopes:
- **`shops/{shopId}/incomplete_orders`**: Only shop administrators and authorized staff are allowed to read or write abandoned cart sessions.
- **`shops/{shopId}/orders`**: Public creation is disabled. Reads are allowed for shop admins or verified customers whose emails match their authenticated tokens.

---

## 4. Edge Auth Middleware (Vercel)

Sensitive action endpoints require verification:
- Validate authorization headers via `bearer` tokens using the Firebase Admin SDK.
- Restrict actions (e.g. Steadfast booking triggers) to verified active admin/staff accounts.
