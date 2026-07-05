# Deployment Guide

Follow these steps to build and deploy the BDRetailers platform.

---

## 1. Production Bundle Build Verification

Before deploying, verify that the project compiles with React 19 and Next.js 16 requirements:

```bash
# Install dependencies
npm install

# Run the Next.js production build compiler
npm run build
```

Verify that there are no compilation errors, Edge runtime issues, or invalid imports.

---

## 2. Deploying to Vercel (Recommended)

1. Connect your GitHub repository to your Vercel Account.
2. In the Vercel project settings, add the environment variables defined in `SETUP.md`.
3. Click **Deploy**. Vercel will automatically configure the edge routes, API folders, and client assets.

---

## 3. Webhook Registration (Steadfast Courier)

Once your domain is live (e.g. `https://bdretailers.com`):
1. Copy the webhook callback URL:
   `https://bdretailers.com/api/courier/steadfast/webhook?shopId=YOUR_SHOP_ID`
2. Navigate to your Steadfast Merchant panel.
3. Paste the URL under the API Settings tab.
4. Input a custom webhook token (e.g. `secret_webhook_key_2026`) in Steadfast and save the exact same key in BDRetailers Dashboard settings under the *Steadfast Webhook Token* field. This ensures incoming webhooks are validated and authorized.
