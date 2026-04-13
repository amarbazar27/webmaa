# Implementation Plan - Storefront & Settings Critical Fixes

This plan addresses several reported bugs in the Webmaa platform, focusing on persistence, storefront correctness, and user experience.

## User Review Required

> [!IMPORTANT]
> **PWA Installation**: Browser security prevents a "silent" or "one-click" background installation. We will trigger the browser's native install prompt directly from the "Download App" button, but the user must still click "Install" in the browser's system dialog. 

> [!WARNING]
> **Total Payment (Non-COD)**: When Cash on Delivery is disabled, the customer must pay the FULL amount (Subtotal + Delivery). We will update the UI to clearly show the "Required Advance" as the full total in this scenario.

## Proposed Changes

### 1. Database & Persistence Layer

#### [MODIFY] [firestore.js](file:///d:/webmaa/src/lib/firestore.js)
- [NEW] `getUserOrders(shopId, customerEmail)`: Fetch real order history for a specific customer.
- Ensure `updateShop` correctly merges `staffEmails` and `socialLinks` without conflicts.

### 2. Retailer Dashboard

#### [MODIFY] [SettingsPage](file:///d:/webmaa/src/app/dashboard/settings/page.js)
- Add **WhatsApp** field to `socialLinks` state and UI.
- Refactor `handleSave` to pick explicit fields from states (`staffEmails`, `socialLinks`, `authSettings`, etc.) instead of spreading the entire `shop` object. This ensures data is clean and persistent.
- Add WhatsApp icon to the social links section.

### 3. Storefront UI (ShopClient)

#### [MODIFY] [ShopClient.jsx](file:///d:/webmaa/src/app/shop/[shopSlug]/ShopClient.jsx)
- **Real Order History**: 
    - Fetch real orders from Firestore when a user is logged in.
    - Replace the hardcoded demo orders with the dynamic list.
    - Update the PDF download link to use the real order ID.
- **PWA Install logic**:
    - Add listener for `beforeinstallprompt` event.
    - Trigger native install prompt directly from the "App Download" button.
- **Payment Logic (COD Fix)**:
    - If `isCOD` is false, update help text and validation to require the **Full Total**.
- **Loyalty Points**:
    - Display `userData.loyaltyPoints` in the profile drawer.
- **Social Icons**:
    - Add **WhatsApp** icon to the footer and link it to `wa.me`.
- **UI Polishing**:
    - Fix user profile photo styling (ensure `aspect-square`, `object-cover`, and proper `rounded` classes).
    - Remove all static order placeholders.

### 4. PDF Invoice Generation

#### [MODIFY] [InvoicePage](file:///d:/webmaa/src/app/shop/[shopSlug]/invoice/[orderId]/page.js)
- Ensure the page handles genuine IDs coming from the dynamic history list.

## Verification Plan

### Manual Verification
1. **Settings**: Add a staff email and WhatsApp number, save, and refresh. Verify they stay.
2. **Social**: Verify WhatsApp icon appears and links correctly in the shop footer.
3. **PWA**: Click "Download App" and verify the browser's native install prompt appears.
4. **Checkout**: Turn off COD in settings. Try to order. Verify it asks for the full amount.
5. **Orders**: Place a new order while logged in. Verify it appears in the profile drawer and the PDF link works.
6. **Loyalty**: Complete an order in the dashboard and verify points increase in the customer drawer.
