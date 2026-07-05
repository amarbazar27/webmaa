# Platform Setup Guide

This guide outlines the steps required to configure, test, and run the BDRetailers SaaS E-Commerce platform.

---

## 1. Environment Variables Configuration

Create a `.env.local` file in your project root and add the following keys:

```env
# Google Maps JS API Key (Public fallback)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Meta Conversion API & Graph API Tokens (Fallback credentials)
META_ACCESS_TOKEN=your_meta_system_user_access_token
META_PIXEL_ID=your_default_facebook_pixel_id
META_CAPI_TEST_CODE=your_test_event_code_if_testing

# Firebase Admin SDK Credentials (JSON Format)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

## 2. Firestore Rules Setup

Deploy the updated `firestore.rules` file to your Firebase console. The rules restrict access to order drafts to authorized shop administrators:

```firestore
match /shops/{shopId} {
  // Check if caller is shop owner/admin/staff
  function isShopAdmin(id) {
    return request.auth != null && (
      id == request.auth.uid || 
      exists(/databases/$(database)/documents/shops/$(id)/staff/$(request.auth.token.email))
    );
  }

  // Restricts access to incomplete order drafts
  match /incomplete_orders/{orderId} {
    allow read, write: if isShopAdmin(shopId);
  }
}
```

---

## 3. Google Maps Autocomplete Settings

To enable Places Autocomplete, verify that the following APIs are enabled in your Google Cloud Console:
1. **Maps JavaScript API**
2. **Places API**
3. **Geocoding API**

---

## 4. Steadfast Courier Setup

1. Log in to your **Steadfast Merchant Portal** (portal.steadfast.com.bd).
2. Go to **Settings > API Information**.
3. Generate your **API Key** and **Secret Key**.
4. Set the **Webhook URL** to:
   `https://yourdomain.com/api/courier/steadfast/webhook?shopId=YOUR_SHOP_ID`
5. Save the generated credentials under the merchant dashboard's **Preferences** panel.
