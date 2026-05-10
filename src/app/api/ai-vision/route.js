import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for Vercel

const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReq = 15;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, time: now });
    return false;
  }
  const data = rateLimitMap.get(ip);
  if (now - data.time > windowMs) {
    rateLimitMap.set(ip, { count: 1, time: now });
    return false;
  }
  if (data.count >= maxReq) return true;
  data.count++;
  return false;
}

function getImageMimeType(base64) {
  if (!base64) return 'image/jpeg';
  if (base64.startsWith('data:image/png')) return 'image/png';
  if (base64.startsWith('data:image/webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { shopId, imageBase64 } = body;

    if (!imageBase64 || !shopId) {
      return NextResponse.json({ error: 'Data missing from request' }, { status: 400 });
    }

    if (!adminDb) {
       // Emergency fallback if Admin SDK is failing but env vars might be there
       console.error('[AI Vision] adminDb is NULL. Check environment variables.');
       return NextResponse.json({ error: 'Server configuration error (Admin SDK)' }, { status: 500 });
    }

    // ── Fetch Shop ─────────────────────────────────────
    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found in database' }, { status: 404 });
    }
    const shop = shopSnap.data();

    // ── Fetch Products ─────────────────────────────────
    const productsSnap = await adminDb.collection('shops').doc(shopId).collection('products').get();
    const activeProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.stock !== 0);

    if (activeProducts.length === 0) {
       return NextResponse.json({ error: 'No active products found for this shop' }, { status: 400 });
    }

    // ── API Key ────────────────────────────────────────
    let apiKey = shop?.aiConfig?.apiKey?.trim();
    if (!apiKey) {
      const globalSnap = await adminDb.collection('settings').doc('global').get();
      apiKey = globalSnap.data()?.geminiApiKey?.trim();
    }
    if (!apiKey) apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'AI API Key is missing. Please configure it.' }, { status: 400 });
    }

    const mimeType = getImageMimeType(imageBase64);
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const productList = activeProducts.map(p => `${p.id}|${(p.name || '').slice(0, 50)}|${p.price}`).join('\n');
    const systemPrompt = `Analyze this shopping list image. 
Match items ONLY to these available products (Format: ID|Name|Price):
${productList}

Return valid JSON ONLY: {"items":[{"productId":"ID","name":"Product Name","quantity":1,"confidence":"high"}]}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('[AI Vision] API Error:', result.error?.message || 'Unknown');
      console.error('[AI Vision] API Error:', result.error); return NextResponse.json({ error: `AI Error: ${result.error?.message || 'Vision service unavailable'}` }, { status: 503 });
    }

    const botText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{"items":[]}';
    let parsed;
    try {
      parsed = JSON.parse(botText);
    } catch (e) {
      // Sometimes Gemini wraps JSON in markdown blocks
      const cleaned = botText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }
    
    const validatedItems = (parsed.items || []).filter(item => {
      return activeProducts.some(p => p.id === item.productId);
    }).map(item => ({
      productId: item.productId,
      name: item.name || '',
      quantity: Math.max(1, parseInt(item.quantity) || 1),
      confidence: item.confidence || 'medium'
    }));

    return NextResponse.json({ items: validatedItems });

  } catch (error) {
    console.error('[AI Vision API Critical Error]', error);
    return NextResponse.json({ error: `Server Internal Error: ${error.message}` }, { status: 500 });
  }
}
