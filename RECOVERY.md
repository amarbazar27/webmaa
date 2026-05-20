# 🆘 Webmaa রিকভারি গাইড

> ল্যাপটপ নষ্ট হলে, ফাইল হারালে, বা নতুন ডিভাইসে — এই গাইড অনুসরণ করুন।

---

## সম্পূর্ণ রিকভারি (ল্যাপটপ নষ্ট হলে)

```bash
# ১. GitHub থেকে ক্লোন
git clone https://github.com/amarbazar27/webmaa.git
cd webmaa

# ২. Packages ইন্সটল
npm install

# ৩. Vercel login ও link
vercel login
vercel link

# ৪. Environment variables
vercel env pull .env.local

# ৫. চালু করুন
npm run dev
```

> **কোড হারানোর চিন্তা নেই** — সব GitHub-এ আছে।  
> **Firebase data হারানোর চিন্তা নেই** — Firestore cloud-এ আছে।  
> **শুধু .env.local রিকভার করতে হবে** — Vercel থেকে pull করুন।

---

## .env.local হারিয়ে গেলে

### পদ্ধতি ১: Vercel CLI (সবচেয়ে সহজ)
```bash
vercel env pull .env.local
```

### পদ্ধতি ২: Vercel Dashboard
1. https://vercel.com/amarbazar27/webmaa/settings/environment-variables
2. সব variables কপি করুন
3. `.env.local` ফাইল তৈরি করুন:

```bash
cp .env.example .env.local
# তারপর .env.local খুলে values পূরণ করুন
```

### পদ্ধতি ৩: Firebase Console থেকে সরাসরি
1. https://console.firebase.google.com → আপনার প্রজেক্ট
2. Project Settings → Your apps → Config কপি করুন

---

## ব্যাকআপ ব্রাঞ্চ থেকে রিস্টোর

```bash
# সব ব্যাকআপ ব্রাঞ্চ দেখুন
git branch -a | grep backup

# নির্দিষ্ট ব্যাকআপে ফিরে যান
git checkout backup/pre-major-features-20260521-0410

# বা ব্যাকআপ থেকে নতুন ব্রাঞ্চ তৈরি করুন
git checkout -b recovery/fix backup/pre-major-features-20260521-0410
```

---

## Firestore Data ব্যাকআপ

Firestore cloud-এ আছে, তাই ডেটা কখনো হারায় না।  
তবু manual export করতে চাইলে:

1. Firebase Console → Firestore → Export
2. Cloud Storage bucket-এ export হবে

---

## Firebase Auth হারানো ব্যবহারকারী রিকভার

যদি কোনো কারণে superadmin email পরিবর্তন করতে হয়:
1. Firebase Console → Authentication → Users
2. Vercel Dashboard → Environment Variables → `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` আপডেট
3. নতুন deploy হবে স্বয়ংক্রিয়ভাবে

---

## অন্য ল্যাপটপে কোড আপডেট করার নিয়ম

```bash
# ১. আগে সর্বশেষ কোড নিন (ALWAYS!)
git pull origin main

# ২. কাজ করুন...

# ৩. পুশ করুন
git add .
git commit -m "feat: কাজের বিবরণ বাংলায়"
git push origin main
```

### ⚠️ যা কখনো করবেন না:
- দুটো ল্যাপটপে একসাথে একই ফাইল পরিবর্তন করবেন না
- `git push --force` করবেন না (data হারাবে)
- node_modules কপি করবেন না — `npm install` করুন

---

## Git Conflict হলে

```bash
# Conflict দেখুন
git status

# VS Code-এ resolve করুন
code .

# Resolve করার পর
git add .
git commit -m "fix: merge conflict resolved"
git push origin main
```

---

## জরুরি যোগাযোগ

- **GitHub:** https://github.com/amarbazar27/webmaa
- **Vercel:** https://vercel.com/amarbazar27/webmaa
- **Firebase:** https://console.firebase.google.com
