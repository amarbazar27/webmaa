import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    const body = await request.json();
    const { shopId, conversationId, aiPaused } = body;

    if (!shopId || !conversationId) {
      return NextResponse.json({ error: 'Shop ID এবং Conversation ID প্রয়োজন' }, { status: 400 });
    }

    const convRef = adminDb.collection('shops').doc(shopId).collection('conversations').doc(conversationId);
    const convDoc = await convRef.get();
    
    if (!convDoc.exists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const currentPaused = convDoc.data()?.aiPaused || false;
    const nextPaused = typeof aiPaused === 'boolean' ? aiPaused : !currentPaused;

    await convRef.set({
      aiPaused: nextPaused,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      aiPaused: nextPaused,
      message: nextPaused 
        ? 'এই চ্যাটে AI বিরতি নিয়েছে (হিউম্যান মোড ⏸️)' 
        : 'এই চ্যাটে AI পুনরায় চালু হয়েছে 🤖'
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Toggle AI Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
