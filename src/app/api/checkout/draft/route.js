import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { z } from 'zod';
import { createRateLimiter } from '@/lib/rate-limit';

// Rate limiter: 120 requests per 10 minutes per IP/session to support active typing & prevent CGNAT blocking
const draftLimiter = createRateLimiter({ maxRequests: 120, windowMs: 600000, prefix: 'checkout_draft' });

const DraftCheckoutSchema = z.object({
  shopId: z.string().min(1),
  localId: z.string().min(1),
  customerName: z.any().optional(),
  customerPhone: z.any().optional(),
  customerEmail: z.any().optional(),
  customerAddress: z.any().optional(),
  customerNote: z.any().optional(),
  district: z.any().optional(),
  step: z.string().optional().default('checkout_open'),
  device: z.string().optional().default('unknown'),
  source: z.string().optional().default('web'),
  total: z.any().optional().default(0),
  items: z.array(z.object({
    id: z.any().optional(),
    name: z.any().optional(),
    quantity: z.any().optional(),
    price: z.any().optional()
  })).optional().default([])
});

// Helper to verify caller has permission to view/modify shop data
async function verifyShopAccess(req, shopId) {
  if (!adminAuth || !adminDb) {
    return { error: 'Server database uninitialized', status: 500 };
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return { error: 'Unauthorized: missing token', status: 401 };
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (e) {
    return { error: 'Unauthorized: invalid token', status: 401 };
  }

  const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  const isSuperAdmin = userData?.role === 'superadmin' || userData?.role === 'sub_superadmin' || decodedToken.email === 'amarbazar27@gmail.com';
  const isDirectOwner = decodedToken.uid === shopId || userData?.shopId === shopId;
  const isStaff = (userData?.role === 'staff' || userData?.role === 'admin') && userData?.accessShopId === shopId;

  if (isSuperAdmin || isDirectOwner || isStaff) {
    return { success: true, decodedToken, userData };
  }

  // Check shop document
  const shopDoc = await adminDb.collection('shops').doc(shopId).get();
  if (shopDoc.exists) {
    const sData = shopDoc.data();
    if (
      sData.ownerId === decodedToken.uid ||
      sData.ownerUid === decodedToken.uid ||
      sData.retailerId === decodedToken.uid ||
      (Array.isArray(sData.staffEmails) && decodedToken.email && sData.staffEmails.includes(decodedToken.email))
    ) {
      return { success: true, decodedToken, userData };
    }
  }

  return { error: 'Forbidden: you do not have permission to access this shop', status: 403 };
}

// ── GET: Retailer Dashboard Drafts Fetch ──
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
    }

    const auth = await verifyShopAccess(req, shopId);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let snap;
    try {
      snap = await adminDb
        .collection('shops')
        .doc(shopId)
        .collection('incomplete_orders')
        .orderBy('updatedAt', 'desc')
        .limit(100)
        .get();
    } catch (orderErr) {
      // In case composite index or orderBy fails, fallback to simple limit
      snap = await adminDb
        .collection('shops')
        .doc(shopId)
        .collection('incomplete_orders')
        .limit(100)
        .get();
    }

    const drafts = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : d.updatedAt,
        recoveredAt: d.recoveredAt?.toDate ? d.recoveredAt.toDate().toISOString() : d.recoveredAt,
      };
    });

    // Ensure sorted by newest first
    drafts.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ success: true, drafts });
  } catch (error) {
    console.error('[GET Draft Checkout Error]', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// ── DELETE: Manually remove single draft session ──
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const draftId = searchParams.get('draftId');

    if (!shopId || !draftId) {
      return NextResponse.json({ error: 'Missing shopId or draftId' }, { status: 400 });
    }

    const auth = await verifyShopAccess(req, shopId);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await adminDb
      .collection('shops')
      .doc(shopId)
      .collection('incomplete_orders')
      .doc(draftId)
      .delete();

    return NextResponse.json({ success: true, message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('[DELETE Draft Checkout Error]', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// ── POST: Real-Time Lead & Draft Cart Capture ──
export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    const body = await req.json();

    const parsed = DraftCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      console.error('[Draft Checkout Validation Failed]:', parsed.error.format());
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const {
      shopId,
      localId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerNote,
      district,
      step,
      device,
      source,
      total,
      items
    } = parsed.data;

    // Phase 5: Distributed rate limit scoped to IP + shop
    const rateLimitKey = `${ip.split(',')[0].trim()}_${shopId}`;
    const { limited } = await draftLimiter.check(rateLimitKey);
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    let trimmedPhone = String(customerPhone || '').trim();
    let trimmedName = String(customerName || '').trim();
    const trimmedEmail = String(customerEmail || '').trim();
    const trimmedAddress = String(customerAddress || '').trim();

    // Smart phone detection: If customer typed phone number in Name field
    const bdPhoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    const cleanedName = trimmedName.replace(/[\s-]/g, '');
    if (!trimmedPhone && bdPhoneRegex.test(cleanedName)) {
      trimmedPhone = cleanedName.startsWith('+88') ? cleanedName : ('+88' + cleanedName.replace(/^0/, '0'));
    }

    // Skip if completely empty (no phone, no name, no email, no address, no items)
    if (!trimmedPhone && !trimmedName && !trimmedEmail && !trimmedAddress && (!items || items.length === 0)) {
      return NextResponse.json({ success: true, message: 'Empty draft skipped' });
    }

    const draftRef = adminDb
      .collection('shops')
      .doc(shopId)
      .collection('incomplete_orders')
      .doc(localId);

    const docSnap = await draftRef.get();
    const existingData = docSnap.exists ? docSnap.data() : null;

    // If already converted to an order, keep its recovered status
    if (existingData?.status === 'recovered') {
      return NextResponse.json({ success: true, message: 'Already recovered' });
    }

    const hasContact = Boolean(trimmedPhone || trimmedName || trimmedEmail);
    const leadType = trimmedPhone ? 'hot_lead' : (trimmedEmail ? 'warm_lead' : 'cart_only');

    const draftData = {
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      customerEmail: trimmedEmail,
      customerAddress: trimmedAddress,
      customerNote: String(customerNote || '').trim(),
      district: String(district || '').trim(),
      total: Number(total) || 0,
      items: (items || []).map(i => ({
        id: String(i.id || 'item'),
        name: String(i.name || 'পণ্য'),
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0
      })),
      step: step || 'checkout',
      device: device || 'unknown',
      source: source || 'web',
      hasContact,
      leadType,
      status: existingData?.status || 'abandoned',
      clientIp: ip.split(',')[0].trim(),
      visitCount: (existingData?.visitCount || 0) + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Only set createdAt if newly created, so original visit timestamp is never wiped out
    if (!docSnap.exists || !existingData?.createdAt) {
      draftData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await draftRef.set(draftData, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Draft Checkout Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
