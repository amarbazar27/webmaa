# 🆕 নতুন ল্যাপটপে Webmaa সেটআপ গাইড

> এই গাইড অনুসরণ করলে **যেকোনো নতুন ল্যাপটপে** ৫ মিনিটে Webmaa চালু করতে পারবেন।  
> কোনো ফাইল কপি করার দরকার নেই — সব GitHub থেকে আসবে, env Vercel থেকে।

---

## ✅ প্রয়োজনীয় টুল (আগে ইন্সটল করুন)

| টুল | লিংক | চেক কমান্ড |
|-----|------|-----------|
| Node.js 20+ | https://nodejs.org | `node -v` |
| Git | https://git-scm.com | `git --version` |
| Vercel CLI | `npm i -g vercel` | `vercel --version` |
| VS Code (optional) | https://code.visualstudio.com | — |

---

## 🚀 সেটআপ (মাত্র ৫টি কমান্ড)

```bash
# ১. GitHub থেকে প্রজেক্ট ক্লোন করুন
git clone https://github.com/amarbazar27/webmaa.git
cd webmaa

# ২. প্যাকেজ ইন্সটল করুন
npm install

# ৩. Vercel-এ লগইন করুন (প্রথমবার)
vercel login

# ৪. Vercel প্রজেক্টের সাথে লিংক করুন
vercel link
# → "Link to existing project?" → Yes
# → "Which scope?" → আপনার account বা team
# → "Which project?" → webmaa

# ৫. Environment variables ডাউনলোড করুন
vercel env pull .env.local

# ৬. ডেভ সার্ভার চালু করুন
npm run dev
```

> ✅ এরপর http://localhost:3001 খুলুন — সব কাজ করবে!

---

## 🔧 ম্যানুয়ালি করার কিছু আছে?

### Firebase Console (একবারই করতে হবে):
1. https://console.firebase.google.com যান
2. **Authentication** → Settings → Authorized domains → `localhost` যোগ করুন
3. শুধু প্রথমবার লগইনে Google popup block হলে, Chrome-এ popup allow করুন

### Vercel Environment (যদি `vercel env pull` কাজ না করে):
```bash
# ম্যানুয়ালি .env.local তৈরি করুন:
cp .env.example .env.local
# তারপর .env.local খুলে সব values Vercel Dashboard থেকে কপি করুন
# Vercel → Project → Settings → Environment Variables
```

---

## 🔄 দৈনন্দিন ওয়ার্কফ্লো

```bash
# কাজ শুরুর আগে সর্বশেষ কোড নিন
git pull origin main

# কাজ করুন...
npm run dev

# কাজ শেষে কমিট ও পুশ করুন
git add .
git commit -m "feat: আপনার কাজের বিবরণ"
git push origin main
```

---

## ❗ সমস্যা হলে

| সমস্যা | সমাধান |
|--------|--------|
| `npm install` ত্রুটি | `npm install --legacy-peer-deps` |
| `vercel link` কাজ না করলে | `vercel logout && vercel login` |
| `.env.local` নেই | RECOVERY.md দেখুন |
| Port 3001 busy | `npm run dev -- -p 3002` |
| Firebase auth error | Chrome-এ localhost অনুমতি দিন |

---

## 📁 প্রজেক্ট স্ট্রাকচার

```
webmaa/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── context/       # React context (Auth, Theme)
│   ├── lib/           # Utilities (Firebase, FCM, etc.)
│   └── templates/     # Store template configs
├── public/            # Static files + Service Worker
├── .env.example       # Environment template
├── NEW-LAPTOP-SETUP.md
├── DEPLOYMENT.md
└── RECOVERY.md
```
