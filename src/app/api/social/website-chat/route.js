import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { createRateLimiter } from '@/lib/rate-limit';

// Security: Rate limit public chat endpoint (25 requests per minute per IP)
// ⚡ In-memory product catalog cache for website chat
const chatProductCache = new Map();

const chatLimiter = createRateLimiter({ maxRequests: 25, windowMs: 60000, prefix: 'website_chat' });

// Helper: Multi-Account Groq LPU (Llama 3.3 70B & DeepSeek R1) with Vyce AI Fallback
async function getAiReply(messages, shopContext) {
  const groqKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2
  ].filter(Boolean);

  // 1. Try Groq LPU across all configured keys and models
  for (const key of groqKeys) {
    for (const model of ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b', 'llama-3.1-8b-instant']) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: shopContext },
              ...messages
            ],
            max_tokens: 500,
            temperature: 0.35
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          let reply = groqData.choices?.[0]?.message?.content;
          if (reply) {
            // Strip DeepSeek R1 internal thought blocks <think>...</think>
            reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            if (reply) return reply;
          }
        } else if (groqRes.status === 429) {
          console.warn(`[Website Chat Groq 429] Key rate limited on ${model}, rotating to next key...`);
          break; // break inner model loop to try next key immediately
        }
      } catch (groqErr) {
        console.warn(`[Website Chat Groq Warning with ${model}]:`, groqErr.message);
      }
    }
  }

  // 2. Fallback to Vyce AI (Agnes 3.0 Flash)
  const vyceKey = process.env.VYCE_AI_API_KEY;
  if (vyceKey) {
    try {
      const res = await fetch('https://vyceai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${vyceKey}` 
        },
        body: JSON.stringify({
          model: 'agnes-3.0-flash',
          messages: [
            { role: 'system', content: shopContext },
            ...messages
          ],
          max_tokens: 450,
          temperature: 0.4
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.error('[Website Chat Vyce AI Error]:', err.message);
    }
  }
  return null;
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
    const { shopId = 'main', visitorId, visitorName = 'কাস্টমার', visitorPhone, message, platform: reqPlatform } = body;

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
      platform: reqPlatform || 'website',
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
      let productList = '';
      const cachedProds = chatProductCache.get(shopId);
      if (cachedProds && Date.now() < cachedProds.expiresAt) {
        productList = cachedProds.list;
      } else {
        const productsSnapshot = await adminDb.collection('shops').doc(shopId).collection('products').limit(25).get();
        productsSnapshot.forEach(doc => {
          const p = doc.data();
          if (p.name && p.price) {
            productList += `- ${p.name}: ৳${p.price}\n`;
          }
        });
        chatProductCache.set(shopId, { list: productList, expiresAt: Date.now() + 30 * 60 * 1000 });
      }

      const shopContext = `তুমি "${shopName}"-এর অফিসিয়াল ওয়েবসাইট লাইভ চ্যাট সেলস এক্সিকিউটিভ।

গুরুত্বপূর্ণ নির্দেশনা (কঠোরভাবে মানতে হবে):
১. ভাষা: সর্বদা অত্যন্ত মার্জিত, প্রমিত এবং ভদ্র বাংলায় কথা বলবে। কাস্টমারকে শ্রদ্ধার সাথে 'আপনি' বা মার্জিতভাবে 'ভাইয়া/আপু' সম্বোধন করবে।
২. নিষিদ্ধ: কখনোই অপভ্রংশ, অশুদ্ধ বা অদ্ভুত আঞ্চলিক শব্দ (যেমন: 'দাদু', 'আউদি', 'দোস্ত' ইত্যাদি) ব্যবহার করবে না।
৩. সত্যনিষ্ঠ তথ্য: তালিকার বাইরের কোনো কাল্পনিক পণ্যের নাম বা মিথ্যা দাম বানিয়ে বলবে না। যদি কোনো তথ্য তালিকায় না থাকে, তবে বিনয়ের সাথে বলবে যে আমাদের প্রতিনিধি দ্রুত যোগাযোগ করবে।
৪. দাম ও সংখ্যা: প্রমিত বাংলায় বা স্পষ্ট সংখ্যায় (যেমন: ৳৫০০ বা ৫০০ টাকা) লিখবে।
৫. উত্তর শৈলী: উত্তর হবে স্পষ্ট, সংক্ষিপ্ত (১-৩ বাক্য) এবং সরাসরি কাস্টমারের প্রশ্নের সমাধানকেন্দ্রিক।
৬. বাংলা বানানের ভিন্নতা ও সমার্থক পণ্য সমন্বয়: গ্রাহক বিভিন্ন বানানে বা উচ্চারণে পণ্যের নাম লিখতে পারে (যেমন: 'পেঁয়াজ' / 'পেয়াজ' / 'পিয়াজ' / 'Onion', 'মরিচ' / 'কাঁচামরিচ' / 'ঝাল', 'আলু' / 'Potato', 'তেল' / 'সয়াবিন', 'রসুন' / 'রশুন')। পণ্য তালিকায় কাছাকাছি বা সমার্থক কোনো পণ্য থাকলে কখনোই 'নাই' বলবে না! সরাসরি সেই পণ্যটি স্টোরে আছে বলে নিশ্চিত করবে এবং তার সঠিক দাম জানিয়ে অর্ডার করতে উৎসাহিত করবে।

দোকানের পণ্য তালিকা:
${productList || 'পণ্য তালিকা লোড করা হচ্ছে'}
ডেলিভারি সংক্রান্ত তথ্য:
${deliveryInfo || 'সারাদেশে হোম ডেলিভারি সুবিধা রয়েছে।'}
দোকানের পলিসি ও নিয়মাবলী:
${knowledgeBase}
${customPrompt ? `বিশেষ নির্দেশনা:\n${customPrompt}` : ''}`;

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
