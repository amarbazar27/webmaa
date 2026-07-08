import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { z } from 'zod';

import { createRateLimiter } from '@/lib/rate-limit';

// Phase 5: Distributed rate limiter (Upstash Redis with in-memory fallback)
const draftLimiter = createRateLimiter({ maxRequests: 30, windowMs: 600000, prefix: 'checkout_draft' });

const DraftCheckoutSchema = z.object({
  shopId: z.string().min(1),
  localId: z.string().min(1),
  customerName: z.string().nullable().optional().or(z.literal('')),
  customerPhone: z.string().nullable().optional().or(z.literal('')),
  customerEmail: z.string().nullable().optional().or(z.literal('')),
  customerAddress: z.string().nullable().optional().or(z.literal('')),
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

    // Phase 5: Distributed rate limit
    const { limited } = await draftLimiter.check(ip);
    if (limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

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
      total,
      items
    } = parsed.data;

    // We only want to save if the customer has entered at least a phone number or a name
    if (!customerPhone && !customerName && items.length === 0) {
      return NextResponse.json({ success: true, message: 'Empty draft skipped' });
    }

    const draftRef = adminDb
      .collection('shops')
      .doc(shopId)
      .collection('incomplete_orders')
      .doc(localId);

    const draftData = {
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      customerEmail: customerEmail || '',
      customerAddress: customerAddress || '',
      total: Number(total) || 0,
      items: items || [],
      status: 'abandoned',
      clientIp: ip,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Use set with merge so we don't overwrite the initial createdAt timestamp if it exists
    await draftRef.set({
      ...draftData,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Draft Checkout Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
