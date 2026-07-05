import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { z } from 'zod';

const DraftCheckoutSchema = z.object({
  shopId: z.string().min(1),
  localId: z.string().min(1),
  customerName: z.string().optional().or(z.literal('')),
  customerPhone: z.string().optional().or(z.literal('')),
  customerEmail: z.string().optional().or(z.literal('')),
  customerAddress: z.string().optional().or(z.literal('')),
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
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
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
