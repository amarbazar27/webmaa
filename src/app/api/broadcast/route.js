export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

let nodemailerCache = null;
async function getTransporter() {
  if (nodemailerCache) return nodemailerCache;
  const nm = await import('nodemailer');
  nodemailerCache = nm.default.createTransport({
    service: 'gmail',
    auth: { user: process.env.RUFLO_EMAIL, pass: process.env.RUFLO_APP_PASSWORD },
    tls: { rejectUnauthorized: false }
  });
  return nodemailerCache;
}

function buildBroadcastHtml({ shopName, subject, body }) {
  return `<!DOCTYPE html><html lang="bn"><body style="margin:0;padding:32px 16px;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" style="max-width:600px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px;text-align:center;">
<h1 style="margin:0;color:white;font-size:22px;font-weight:900;">${shopName}</h1></td></tr>
<tr><td style="padding:32px;">
<h2 style="margin:0 0 16px;font-size:20px;font-weight:900;color:#0f172a;">${subject}</h2>
<div style="font-size:14px;color:#334155;line-height:1.8;">${body}</div></td></tr>
<tr><td style="padding:16px 32px 32px;text-align:center;border-top:1px solid #f1f5f9;">
<p style="margin:0;color:#94a3b8;font-size:11px;">Powered by Webmaa × Ruflo</p></td></tr>
</table></td></tr></table></body></html>`;
}

export async function POST(req) {
  try {
    if (!process.env.RUFLO_EMAIL) return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let decoded;
    try { decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]); }
    catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const body = await req.json();
    const { shopId, subject, message, segment } = body;
    if (!shopId || !subject || !message || !segment) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (subject.length > 200 || message.length > 2000) return NextResponse.json({ error: 'Content too long' }, { status: 400 });

    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    const shopData = shopSnap.data();
    const isOwner = shopData.ownerId === decoded.uid;
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const isSA = userDoc.exists && userDoc.data()?.role === 'superadmin';
    const isStaff = (shopData.staffEmails || []).includes(decoded.email?.toLowerCase());
    if (!isOwner && !isSA && !isStaff) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const ordersSnap = await adminDb.collection('shops').doc(shopId).collection('orders').get();
    const buyerEmails = new Set();
    const allEmails = new Set();
    ordersSnap.docs.forEach(d => {
      const e = d.data().customerEmail?.toLowerCase()?.trim();
      if (!e) return;
      allEmails.add(e);
      if (d.data().status === 'completed') buyerEmails.add(e);
    });

    const emailSet = new Set();
    if (segment === 'all') allEmails.forEach(e => emailSet.add(e));
    else if (segment === 'buyers') buyerEmails.forEach(e => emailSet.add(e));
    else if (segment === 'abandoned') allEmails.forEach(e => { if (!buyerEmails.has(e)) emailSet.add(e); });

    const targets = Array.from(emailSet).filter(e => e.includes('@')).slice(0, 50);
    if (targets.length === 0) return NextResponse.json({ error: 'No recipients found' }, { status: 404 });

    const transporter = await getTransporter();
    let sent = 0, failed = 0;
    const html = buildBroadcastHtml({ shopName: shopData.shopName || 'Store', subject, body: message.replace(/\n/g, '<br>') });
    for (const email of targets) {
      try {
        await transporter.sendMail({ from: `"${shopData.shopName}" <${process.env.RUFLO_EMAIL}>`, to: email, subject, html });
        sent++;
      } catch { failed++; }
    }

    await adminDb.collection('shops').doc(shopId).collection('broadcasts').add({
      subject, message, segment, totalTargets: targets.length, sent, failed,
      sentBy: decoded.uid, sentByName: decoded.name || 'Unknown',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, sent, failed, total: targets.length });
  } catch (err) {
    console.error('[Broadcast]', err);
    return NextResponse.json({ error: 'Broadcast failed' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    const snap = await adminDb.collection('shops').doc(shopId).collection('broadcasts').orderBy('createdAt', 'desc').limit(20).get();
    return NextResponse.json({ history: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
