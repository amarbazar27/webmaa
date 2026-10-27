import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/verifyAuth';

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.role !== 'superadmin' && authResult.role !== 'sub_superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all three collections server-side with Admin SDK (single read, no listeners)
    const [leadsSnap, convsSnap, connsSnap] = await Promise.all([
      adminDb.collectionGroup('leads').orderBy('createdAt', 'desc').limit(50).get(),
      adminDb.collectionGroup('conversations').orderBy('lastMessageAt', 'desc').limit(30).get(),
      adminDb.collection('social_connections').limit(50).get(),
    ]);

    const leads = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const conversations = convsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const connections = connsSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        pageId: data.pageId || d.id,
        pageName: data.pageName,
        shopId: data.shopId,
        webhookSubscribed: data.webhookSubscribed || false,
        connectedAt: data.connectedAt,
      };
    });

    return NextResponse.json({ leads, conversations, connections });
  } catch (error) {
    console.error('Social overview error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
