import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.role !== 'superadmin' && authResult.role !== 'sub_superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const snap = await adminDb.collection('retailer_invites').get();
    const invites = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        invitedAt: data.invitedAt?.toDate ? data.invitedAt.toDate().toISOString() : data.invitedAt
      };
    });

    return NextResponse.json({ success: true, invites });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Retailer Invite GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const body = await request.json();
    const email = (body.email || '').toLowerCase().trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Check if already invited
    const existing = await adminDb.collection('retailer_invites').where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ error: 'This email is already invited as a retailer.' }, { status: 400 });
    }

    const docRef = await adminDb.collection('retailer_invites').add({
      email,
      invitedAt: FieldValue.serverTimestamp(),
      status: 'active',
      invitedBy: authResult.email || authResult.uid
    });

    return NextResponse.json({ success: true, id: docRef.id, email });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Retailer Invite POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 });
    }

    await adminDb.collection('retailer_invites').doc(id).delete();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Retailer Invite DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
