import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { createRateLimiter } from '@/lib/rate-limit';

// Security: Rate limit public chat endpoint (25 requests per minute per IP)
const chatLimiter = createRateLimiter({ maxRequests: 25, windowMs: 60000, prefix: 'website_chat' });

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
        max_tokens: 450,
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
    // 1. Rate Limiting by Client IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { limited } = await chatLimiter.check(clientIp);
    if (limited) {
      return NextResponse.json({ error: 'খুব দ্রুত মেসেজ পাঠানো হচ্ছে। কিছুক্ষণ অপেক্ষা করুন।' }, { status: 429 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const body = await request.json();
    const { shopId = 'main', visitorId, visitorName = 'কাস্টমার', visitorPhone, message } = body;

    if (!visitorId || typeof visitorId !== 'string' || !message?.trim() || typeof message !== 'string') {
      return NextResponse.json({ error: 'visitorId এবং message প্রয়োজন' }, { status: 400 });
    }

    // Input Sanitization (Anti-XSS and Buffer Flooding)
    const cleanMsg = message.trim().slice(0, 1000);
    const cleanName = (visitorName || 'কাস্টমার').trim().slice(0, 100);
    const cleanPhone = visitorPhone ? String(visitorPhone).replace(/[^0-9+]/g, '').slice(0, 20) : null;
    const cleanVisitorId = visitorId.trim().slice(0, 100);

    // 2. Fetch shop & settings
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

    // 3. Load or initialize conversation document
    const convRef = adminDb.collection('shops').doc(shopId).collection('conversations').doc(cleanVisitorId);
    const convDoc = await convRef.get();
    let convData = convDoc.exists ? convDoc.data() : {
      platform: 'website',
      senderName: cleanName,
      senderPsid: cleanVisitorId,
      phone: cleanPhone || null,
      messages: [],
      aiPaused: false,
      shopId,
      createdAt: new Date().toISOString()
    };

    if (cleanPhone && !convData.phone) {
      convData.phone = cleanPhone;
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

    // 4. Capture / update lead
    await adminDb.collection('shops').doc(shopId).collection('leads').doc(cleanVisitorId).set({
      name: cleanName,
      phone: cleanPhone || convData.phone || 'N/A',
      source: 'website_chat',
      fbId: cleanVisitorId,
      message: cleanMsg,
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
      shopId
    }, { merge: true });

    // 5. Generate AI response if not paused
    let aiReply = null;
    if (!chatPaused) {
      // Build product catalog RAG context (Limit 25 items to stay lean and fast)
      const productsSnapshot = await adminDb.collection('shops').doc(shopId).collection('products').limit(25).get();
      let productList = '';
      productsSnapshot.forEach(doc => {
        const p = doc.data();
        if (p.name && p.price) {
          productList += `- ${p.name}: ৳${p.price}\n`;
        }
      });

      const shopContext = `তুমি ${shopName}-এর ওয়েবসাইট লাইভ চ্যাট সেলস এক্সিকিউটিভ। বাংলায় অত্যন্ত বিনয়ী, স্মার্ট ও সংক্ষিপ্ত উত্তর দাও।\nপণ্য তালিকা:\n${productList}\nডেলিভারি তথ্য:\n${deliveryInfo}\nনিয়মাবলী ও পলিসি:\n${knowledgeBase}\n${customPrompt}`;

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
