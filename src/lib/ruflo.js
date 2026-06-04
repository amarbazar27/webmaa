/**
 * 🔔 RUFLO — Daripallah Automation Engine
 * Non-blocking, async email system using Nodemailer + Gmail SMTP
 *
 * .env.local এ এই variables দরকার:
 *   RUFLO_EMAIL=your.gmail@gmail.com
 *   RUFLO_APP_PASSWORD=xxxx xxxx xxxx xxxx  (Gmail App Password)
 *   RUFLO_FROM_NAME=Daripallah Notification
 */

// nodemailer শুধু server-side কাজ করে, তাই lazy import
let transporterCache = null;

async function getTransporter() {
  if (transporterCache) return transporterCache;
  const nodemailer = await import('nodemailer');
  
  transporterCache = nodemailer.default.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.RUFLO_EMAIL,
      pass: process.env.RUFLO_APP_PASSWORD,
    },
    tls: { rejectUnauthorized: false }
  });
  return transporterCache;
}

// ── Retry Logic ────────────────────────────────
async function sendWithRetry(mailOptions, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transporter = await getTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Ruflo] ✅ Email sent: ${info.messageId} (attempt ${attempt})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      lastError = err;
      console.warn(`[Ruflo] ⚠️ Attempt ${attempt} failed:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }
  }
  console.error('[Ruflo] ❌ All retries failed:', lastError?.message);
  return { success: false, error: lastError?.message };
}

// ── HTML Email Template ─────────────────────────
function buildOrderEmail({ shopName, customerName, orderId, items, total, status = 'pending' }) {
  const taka = '৳';
  const statusLabels = {
    pending: { label: 'অপেক্ষমান', color: '#f59e0b', bg: '#fef3c7' },
    confirmed: { label: 'নিশ্চিত হয়েছে', color: '#3b82f6', bg: '#dbeafe' },
    completed: { label: 'ডেলিভারি হয়েছে', color: '#10b981', bg: '#d1fae5' },
    cancelled: { label: 'বাতিল', color: '#ef4444', bg: '#fee2e2' },
  };
  const s = statusLabels[status] || statusLabels.pending;

  const itemRows = (items || []).map(item => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;font-weight:600;">${item.name}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:14px;color:#64748b;">${item.quantity}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;font-weight:700;color:#1e293b;">${taka}${(parseFloat(item.price) * item.quantity).toFixed(0)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>অর্ডার নিশ্চিতকরণ — ${shopName}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 32px 24px;text-align:center;">
            <h1 style="margin:0;color:white;font-size:24px;font-weight:900;letter-spacing:-0.5px;">${shopName}</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Powered by Daripallah</p>
          </td>
        </tr>
        <!-- Status Badge -->
        <tr>
          <td style="padding:24px 32px 0;text-align:center;">
            <span style="display:inline-block;background:${s.bg};color:${s.color};font-weight:800;font-size:13px;padding:6px 18px;border-radius:50px;letter-spacing:0.5px;">
              ${s.label}
            </span>
          </td>
        </tr>
        <!-- Greeting -->
        <tr>
          <td style="padding:24px 32px 16px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;font-weight:900;">আসসালামু আলাইকুম, ${customerName}!</h2>
            <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
              আপনার অর্ডার <strong style="color:#4f46e5;">#${orderId}</strong> পাওয়া গেছে। আমরা শীঘ্রই প্রসেস করব।
            </p>
          </td>
        </tr>
        <!-- Items Table -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:12px 16px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;">পণ্য</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;">পরিমাণ</th>
                  <th style="padding:12px 16px;text-align:right;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;">মূল্য</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
              <tfoot>
                <tr style="background:#0f172a;">
                  <td colspan="2" style="padding:14px 16px;color:white;font-weight:900;font-size:15px;">সর্বমোট</td>
                  <td style="padding:14px 16px;text-align:right;color:white;font-weight:900;font-size:18px;">${taka}${total}</td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 32px;text-align:center;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। উত্তর দেবেন না।</p>
            <p style="margin:8px 0 0;color:#cbd5e1;font-size:11px;">Powered by <strong>Daripallah</strong> × Ruflo Automation</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildOTPEmail({ name, otp, purpose = 'লগইন' }) {
  return `<!DOCTYPE html>
<html lang="bn">
<body style="margin:0;padding:32px 16px;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="480" style="max-width:480px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px;text-align:center;">
        <h2 style="margin:0;color:white;font-size:20px;font-weight:900;">🔐 Verification Code</h2>
      </td></tr>
      <tr><td style="padding:32px;text-align:center;">
        <p style="color:#64748b;font-size:14px;margin:0 0 24px;">আপনার ${purpose} কোড:</p>
        <div style="background:#f1f5f9;border:2px dashed #e2e8f0;border-radius:12px;padding:20px;display:inline-block;">
          <span style="font-size:40px;font-weight:900;color:#4f46e5;letter-spacing:12px;">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:20px 0 0;">এই কোডটি <strong>10 মিনিট</strong> বৈধ থাকবে।</p>
        <p style="color:#ef4444;font-size:12px;margin:8px 0 0;font-weight:700;">কোডটি কাউকে শেয়ার করবেন না।</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function buildRetailerEmail({ shopName, orderId, customerName, customerPhone, items, total }) {
  const taka = '৳';
  return `<!DOCTYPE html>
<html lang="bn">
<body style="margin:0;padding:32px 16px;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="520" style="max-width:520px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:#0f172a;padding:24px 28px;text-align:center;">
        <p style="margin:0;color:#a78bfa;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">📦 নতুন অর্ডার</p>
        <h2 style="margin:8px 0 0;color:white;font-size:22px;font-weight:900;">${shopName}</h2>
      </td></tr>
      <tr><td style="padding:28px;">
        <table width="100%" style="background:#f8fafc;border-radius:10px;padding:16px;" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">অর্ডার ID</td><td style="text-align:right;font-weight:900;color:#4f46e5;font-size:15px;">#${orderId}</td></tr>
          <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">গ্রাহক</td><td style="text-align:right;font-weight:700;color:#0f172a;">${customerName}</td></tr>
          <tr><td style="font-size:13px;color:#64748b;padding:4px 0;">ফোন</td><td style="text-align:right;font-weight:700;color:#0f172a;">${customerPhone}</td></tr>
          <tr><td colspan="2" style="padding-top:12px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">
            <strong>পণ্য:</strong> ${items.map(i => `${i.name} ×${i.quantity}`).join(' | ')}
          </td></tr>
          <tr><td colspan="2" style="padding-top:10px;text-align:right;font-size:20px;font-weight:900;color:#10b981;">${taka}${total}</td></tr>
        </table>
        <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;text-align:center;">ড্যাশবোর্ড থেকে অর্ডারটি পরিচালনা করুন।</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

// ══════════════════════════════════════════════════
// Helper to get dynamic, realtime shopName from database
async function getRealtimeShopName(shopId, defaultShopName) {
  if (!shopId) return defaultShopName || 'Shop';
  try {
    const { adminDb } = await import('./firebase-admin');
    if (adminDb) {
      const shopSnap = await adminDb.collection('shops').doc(shopId).get();
      if (shopSnap.exists) {
        return shopSnap.data().shopName || defaultShopName || 'Shop';
      }
    }
  } catch (err) {
    console.warn(`[Ruflo] Failed to fetch realtime shopName for ${shopId}:`, err.message);
  }
  return defaultShopName || 'Shop';
}

// 📨 PUBLIC RUFLO API FUNCTIONS
// ══════════════════════════════════════════════════

/**
 * অর্ডার confirmation email পাঠাও (গ্রাহকের কাছে)
 */
export async function sendOrderConfirmationEmail({ to, shopId, shopName, customerName, orderId, items, total }) {
  if (!to || !process.env.RUFLO_EMAIL) return { success: false, reason: 'no_config' };

  const activeShopName = await getRealtimeShopName(shopId, shopName);

  return sendWithRetry({
    from: `"${activeShopName}" <${process.env.RUFLO_EMAIL}>`,
    to,
    subject: `✅ অর্ডার নিশ্চিত হয়েছে — #${orderId} | ${activeShopName}`,
    html: buildOrderEmail({ shopName: activeShopName, customerName, orderId, items, total }),
  });
}

/**
 * নতুন অর্ডারের notification email (রিটেইলারের কাছে)
 */
export async function sendRetailerNotificationEmail({ to, shopId, shopName, orderId, customerName, customerPhone, items, total }) {
  if (!to || !process.env.RUFLO_EMAIL) return { success: false, reason: 'no_config' };

  const activeShopName = await getRealtimeShopName(shopId, shopName);

  return sendWithRetry({
    from: `"Daripallah Ruflo" <${process.env.RUFLO_EMAIL}>`,
    to,
    subject: `📦 নতুন অর্ডার #${orderId} — ${activeShopName}`,
    html: buildRetailerEmail({ shopName: activeShopName, orderId, customerName, customerPhone, items, total }),
  });
}

/**
 * OTP email পাঠাও
 */
export async function sendOTPEmail({ to, name, otp, purpose = 'লগইন' }) {
  if (!to || !process.env.RUFLO_EMAIL) return { success: false, reason: 'no_config' };

  return sendWithRetry({
    from: `"Daripallah Security" <${process.env.RUFLO_EMAIL}>`,
    to,
    subject: `🔐 আপনার ${purpose} কোড: ${otp}`,
    html: buildOTPEmail({ name, otp, purpose }),
  });
}

/**
 * Status update email পাঠাও (গ্রাহকের কাছে)
 */
export async function sendStatusUpdateEmail({ to, shopId, shopName, customerName, orderId, items, total, status }) {
  if (!to || !process.env.RUFLO_EMAIL) return { success: false, reason: 'no_config' };

  const activeShopName = await getRealtimeShopName(shopId, shopName);

  const subjectMap = {
    confirmed: '✅ আপনার অর্ডার নিশ্চিত হয়েছে',
    completed: '🎉 ডেলিভারি সম্পন্ন হয়েছে',
    cancelled: '❌ অর্ডার বাতিল হয়েছে',
  };
  const subject = `${subjectMap[status] || 'অর্ডার আপডেট'} — #${orderId}`;

  return sendWithRetry({
    from: `"${activeShopName}" <${process.env.RUFLO_EMAIL}>`,
    to,
    subject,
    html: buildOrderEmail({ shopName: activeShopName, customerName, orderId, items, total, status }),
  });
}
