# 🚀 Webmaa ডেপ্লয়মেন্ট গাইড

## Vercel Auto-Deploy (প্রধান পদ্ধতি)

```bash
# main branch-এ push করলেই Vercel স্বয়ংক্রিয়ভাবে deploy করে
git push origin main
```

> GitHub → Vercel integration চালু থাকলে কোনো extra কমান্ড লাগে না।

---

## Environment Variables — Vercel-এ সেট করার নিয়ম

### ⚠️ গুরুত্বপূর্ণ: কখনো .env ফাইল GitHub-এ push করবেন না!

```bash
# Vercel Dashboard থেকে env টেনে আনুন (local dev-এর জন্য)
vercel env pull .env.local

# অথবা Vercel CLI দিয়ে সরাসরি সেট করুন:
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
```

### প্রয়োজনীয় সব Environment Variables:

| Variable | কোথায় পাবেন |
|----------|------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Firebase Console → Cloud Messaging → Web Push certificates |
| `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` | আপনার নিজের Gmail |
| `SUPERADMIN_IMPERSONATE_SECRET` | যেকোনো random string (32+ chars) |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account (Admin SDK) |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account (Admin SDK) |

### Firebase Service Account কোথায় পাবেন:
1. Firebase Console → Project Settings → Service Accounts
2. "Generate new private key" ক্লিক করুন
3. JSON ফাইল ডাউনলোড হবে
4. `client_email` → `FIREBASE_CLIENT_EMAIL`
5. `private_key` → `FIREBASE_PRIVATE_KEY` (Vercel-এ হুবহু paste করুন, newline সহ)

---

## Preview Deploy

```bash
# main ছাড়া অন্য branch push করলে preview URL পাবেন
git checkout -b feature/my-new-feature
git push origin feature/my-new-feature
# Vercel থেকে preview URL পাবেন
```

---

## Production Build টেস্ট (locally)

```bash
npm run build    # build করুন
npm run start    # production mode চালান
# http://localhost:3001 এ চেক করুন
```

---

## Custom Domain সেটআপ

1. Vercel Dashboard → Project → Settings → Domains
2. Domain যোগ করুন (যেমন: `webmaa.com`)
3. DNS-এ CNAME record: `cname.vercel-dns.com`
4. অথবা A record: `76.76.19.61`

---

## ম্যানুয়ালি Deploy (বিশেষ প্রয়োজনে)

```bash
vercel --prod
```
