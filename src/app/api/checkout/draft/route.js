import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { z } from 'zod';

import { createRateLimiter } from '@/lib/rate-limit';

// Rate limiter: 120 requests per 10 minutes per IP/session to support active typing & prevent CGNAT blocking
const draftLimiter = createRateLimiter({ maxRequests: 120, windowMs: 600000, prefix: 'checkout_draft' });

const DraftCheckoutSchema = z.object({
  shopId: z.string().min(1),
  localId: z.string().min(1),
  customerName: z.string().nullable().optional().or(z.literal('')),
  customerPhone: z.string().nullable().optional().or(z.literal('')),
  customerEmail: z.string().nullable().optional().or(z.literal('')),
  customerAddress: z.string().nullable().optional().or(z.literal('')),
  customerNote: z.string().nullable().optional().or(z.literal('')),
  district: z.string().nullable().optional().or(z.literal('')),
  step: z.string().optional().default('checkout_open'),
  device: z.string().optional().default('unknown'),
  source: z.string().optional().default('web'),
  total: z.number().optional().default(0),
  items: z.array(z.object({
    id: z.string().min(1),
    name: z.string(),
    quantity: z.number(),
    price: z.any()
  })).optional().default([])
});

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

    const trimmedPhone = (customerPhone || '').trim();
    const trimmedName = (customerName || '').trim();
    const trimmedEmail = (customerEmail || '').trim();
    const trimmedAddress = (customerAddress || '').trim();

    // Skip if completely empty
    if (!trimmedPhone && !trimmedName && !trimmedEmail && items.length === 0) {
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
      customerNote: (customerNote || '').trim(),
      district: (district || '').trim(),
      total: Number(total) || 0,
      items: items || [],
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
