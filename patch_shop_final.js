const fs = require('fs');
let c = fs.readFileSync('src/app/shop/[shopSlug]/ShopClient.jsx', 'utf8');

// ── 1. Pass orderHistory in sendChatMessage ────────────────────────────────
const oldPayload = `body: JSON.stringify({
          shopId: shop.id,
          messages: [`;
const newPayload = `body: JSON.stringify({
          shopId: shop.id,
          orderHistory: userOrders ? userOrders.slice(0,5).map(o => ({ id: o.id, orderIdVisual: o.orderIdVisual, total: o.total, items: (o.items||[]).map(i=>({name:i.name,quantity:i.quantity,price:i.price})) })) : [],
          messages: [`;

if (c.includes(oldPayload)) {
  c = c.replace(oldPayload, newPayload);
  console.log('✅ Added orderHistory to sendChatMessage payload');
} else {
  console.log('❌ Could not find sendChatMessage payload');
}

// ── 2. Add order history to system prompt ─────────────────────────────────
const oldSystemPrompt = `4. বাংলায়, সংক্ষিপ্ত উত্তর।\` },`;
const newSystemPrompt = `4. বাংলায়, সংক্ষিপ্ত উত্তর।
5. কাস্টমারের অর্ডার ইতিহাস দেখে পার্সোনালাইজড value-for-money সাজেশন দাও।\` },`;

if (c.includes(oldSystemPrompt)) {
  c = c.replace(oldSystemPrompt, newSystemPrompt);
  console.log('✅ Updated system prompt with order history instruction');
} else {
  console.log('❌ Could not find old system prompt');
}

// ── 3. PWA — better install fallback message ──────────────────────────────
const oldPWAFallback = `toast('আপনার ব্রাউজারের মেনু (⋮) থেকে \"Install App\" বা \"Add to Home screen\" নির্বাচন করুন।', { duration: 5000 });`;
const newPWAFallback = `const isIOS2 = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS2) {
        toast('আইফোনে: নিচের Share আইকন 🔗 → "Add to Home Screen" ট্যাপ করুন।', { icon: '📱', duration: 8000 });
      } else {
        // Try to trigger using window.deferredPrompt as fallback
        if (window.deferredPrompt) {
          window.deferredPrompt.prompt();
          window.deferredPrompt.userChoice.then(c => { if (c.outcome === 'accepted') { setPwaInstalled(true); localStorage.setItem('pwa_installed','true'); toast.success('অ্যাপ ইন্সটল হয়েছে! 🎉'); } });
        } else {
          toast('এই ব্রাউজারে সরাসরি ইন্সটল সম্ভব নয়। Chrome ব্যবহার করুন।', { icon: '💡', duration: 6000 });
        }
      }`;

if (c.includes(oldPWAFallback)) {
  c = c.replace(oldPWAFallback, newPWAFallback);
  console.log('✅ Fixed PWA fallback install flow');
} else {
  console.log('❌ Could not find PWA fallback text');
}

// ── 4. Mic button — trigger getUserMedia first ──────────────────────────────
const oldMicBtnAttr = 'className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all';
// This is in AiVoicePanel, not ShopClient. Skip here.

fs.writeFileSync('src/app/shop/[shopSlug]/ShopClient.jsx', c, 'utf8');
console.log('Done patching ShopClient.jsx');
