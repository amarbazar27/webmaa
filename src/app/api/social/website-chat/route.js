import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';

// Helper: Call Vyce AI (Agnes 3.0 Flash) with shop catalog RAG context
async function getAiReply(messages, shopContext) {
  const apiKey = process.env.VYCE_AI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://vyceai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: 'agnes-3.0-flash',
        messages: [
          { role: 'system', content: shopContext },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error('[Website Chat Vyce AI Error]:', err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { shopId = 'main', visitorId, visitorName = 'কাস্টমার', visitorPhone, message } = body;

    if (!visitorId || !message?.trim()) {
      return NextResponse.json({ error: 'visitorId এবং message প্রয়োজন' }, { status: 400 });
    }

    const cleanMsg = message.trim();

    // 1. Fetch shop & settings
    let shopName = 'BD Retailers';
    let deliveryInfo = '';
    let customPrompt = '';
    let isAiPaused = false;
    let knowledgeBase = '';

    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (shopDoc.exists) {
        const sData = shopDoc.data() || {};
        shopName = sData.shopName || sData.name || 'Store';
        deliveryInfo = sData.aiSettings?.deliveryInfo || '';
        customPrompt = sData.aiSettings?.customPrompt || '';
        isAiPaused = Boolean(sData.aiSettings?.globallyPaused);
        knowledgeBase = sData.knowledgeBase || '';
      }
    }

    // 2. Load or initialize conversation
    const convRef = adminDb.collection('shops').doc(shopId).collection('conversations').doc(visitorId);
    const convDoc = await convRef.get();
    let convData = convDoc.exists ? convDoc.data() : {
      platform: 'website',
      senderName: visitorName,
      senderPsid: visitorId,
      phone: visitorPhone || null,
      messages: [],
      aiPaused: false,
      shopId,
      createdAt: new Date().toISOString()
    };

    // If customer provided a phone number, update it
    if (visitorPhone && !convData.phone) {
      convData.phone = visitorPhone;
    }

    // Check if human handoff is currently active for this chat
    const chatPaused = convData.aiPaused || isAiPaused;

    // Append customer message
    const userMsg = {
      role: 'user',
      content: cleanMsg,
      timestamp: new Date().toISOString()
    };
    convData.messages.push(userMsg);

    await convRef.set({
      ...convData,
      lastMessage: cleanMsg,
      lastMessageAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // 3. Capture / update lead
    await adminDb.collection('shops').doc(shopId).collection('leads').doc(visitorId).set({
      name: visitorName,
      phone: visitorPhone || convData.phone || 'N/A',
      source: 'website_chat',
      fbId: visitorId,
      message: cleanMsg,
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
      shopId
    }, { merge: true });

    // 4. Generate AI response if not paused
    let aiReply = null;
    if (!chatPaused) {
      // Build product catalog RAG context
      const productsSnapshot = await adminDb.collection('shops').doc(shopId).collection('products').limit(30).get();
      let productList = '';
      productsSnapshot.forEach(doc => {
        const p = doc.data();
        productList += `- ${p.name || ''}: ৳${p.price || ''}\n`;
      });

      const shopContext = `তুমি ${shopName}-এর ওয়েবসাইট লাইভ চ্যাট সেলস এক্সিকিউটিভ। বাংলায় অত্যন্ত বিনয়ী, স্মার্ট ও সংক্ষিপ্ত উত্তর দাও।\nপণ্য তালিকা:\n${productList}\nডেলিভারি সংক্রান্ত:\n${deliveryInfo}\nবিজনেস প্রশ্নোত্তর ও নিয়মাবলী:\n${knowledgeBase}\n${customPrompt}`;

      const aiMessages = convData.messages.slice(-8).map(m => ({
        role: m.role === 'retailer' ? 'assistant' : m.role,
        content: m.content
      }));

      aiReply = await getAiReply(aiMessages, shopContext);

      if (aiReply) {
        const assistantMsg = {
          role: 'assistant',
          content: aiReply,
          timestamp: new Date().toISOString()
        };
        convData.messages.push(assistantMsg);

        await convRef.set({
          messages: convData.messages,
          lastMessage: aiReply,
          lastMessageAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }

    return NextResponse.json({
      success: true,
      reply: aiReply,
      aiPaused: chatPaused
    });
  } catch (error) {
    console.error('[Website Chat API Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
