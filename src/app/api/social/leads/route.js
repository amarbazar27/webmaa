import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

export async function PATCH(request) {
  try {
    const authResult = await verifyAuth(request);
    const body = await request.json();
    const { shopId, leadId, status, notes } = body;

    if (!shopId || !leadId) {
      return NextResponse.json({ error: 'Shop ID এবং Lead ID প্রয়োজন' }, { status: 400 });
    }

    const leadRef = adminDb.collection('shops').doc(shopId).collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();

    if (!leadDoc.exists) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updateData = {
      updatedAt: new Date().toISOString()
    };
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    await leadRef.set(updateData, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'লিড স্ট্যাটাস সফলভাবে আপডেট হয়েছে'
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Leads Update Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    const body = await request.json();
    const { shopId, name, phone, source = 'manual', notes = '' } = body;

    if (!shopId || !name) {
      return NextResponse.json({ error: 'Shop ID এবং গ্রাহকের নাম প্রয়োজন' }, { status: 400 });
    }

    const leadRef = adminDb.collection('shops').doc(shopId).collection('leads').doc();
    const newLead = {
      name: name.trim(),
      phone: phone?.trim() || 'N/A',
      source,
      status: 'new',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shopId
    };

    await leadRef.set(newLead);

    return NextResponse.json({
      success: true,
      lead: { id: leadRef.id, ...newLead },
      message: 'নতুন লিড সফলভাবে সংরক্ষিত হয়েছে'
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Leads Create Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
