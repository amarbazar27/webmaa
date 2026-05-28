import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReq = 15;
  if (!rateLimitMap.has(ip)) { rateLimitMap.set(ip, { count: 1, time: now }); return false; }
  const data = rateLimitMap.get(ip);
  if (now - data.time > windowMs) { rateLimitMap.set(ip, { count: 1, time: now }); return false; }
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

// Try Gemini with multiple model fallbacks
async function tryGeminiVision(apiKey, systemPrompt, base64Data, mimeType) {
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  for (const modelName of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 2048 }
        })
      });

      const result = await response.json();
      if (response.ok) {
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{"items":[]}';
        return { success: true, text, model: modelName };
      }

      // If 404 (model not found), try next model
      if (response.status === 404 || result.error?.message?.includes('not found')) {
        console.warn(`[AI Vision] Model ${modelName} not found, trying next...`);
        continue;
      }

      // Other error — log and try next
      console.error(`[AI Vision] Model ${modelName} error:`, result.error?.message);
      continue;
    } catch (err) {
      console.error(`[AI Vision] Model ${modelName} threw:`, err.message);
      continue;
    }
  }

  return { success: false, text: null, model: null };
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
      console.error('[AI Vision] adminDb is NULL.');
      return NextResponse.json({ error: 'Server configuration error (Admin SDK)' }, { status: 500 });
    }

    // ── Fetch Shop ──────────────────────────────────
    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shop = shopSnap.data();

    // ── Fetch Products ──────────────────────────────
    const productsSnap = await adminDb.collection('shops').doc(shopId).collection('products').get();
    const activeProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.stock !== 0);

    if (activeProducts.length === 0) {
      return NextResponse.json({ error: 'No active products found' }, { status: 400 });
    }

    // ── API Key Resolution Fallback Chain ──────────────────────────
    const keysToTry = [];
    const isValidApiKey = (key) => {
      if (!key || typeof key !== 'string') return false;
      const k = key.trim();
      return k.startsWith('AIza') || k.startsWith('gsk_') || k.startsWith('sk-') || k.startsWith('sk-or-');
    };

    // 1. Try shop-specific API key first
    const shopKey = shop?.aiConfig?.apiKey?.trim();
    if (isValidApiKey(shopKey)) {
      keysToTry.push({ key: shopKey, source: `Shop Custom Key (${shopId})` });
    }

    // 2. Try global settings API key second (fixes settings -> config collection typo)
    const globalSnap = await adminDb.collection('config').doc('global').get();
    if (globalSnap.exists) {
      const dbKey = globalSnap.data()?.geminiApiKey?.trim();
      if (isValidApiKey(dbKey)) {
        keysToTry.push({ key: dbKey, source: 'Global Config Key' });
      }
    }

    // 3. Try environment variables third
    const envKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (isValidApiKey(envKey)) {
      keysToTry.push({ key: envKey, source: 'System Environment Key' });
    } else if (envKey && envKey.trim()) {
      keysToTry.push({ key: envKey.trim(), source: 'System Environment Key (Raw)' });
    }

    if (keysToTry.length === 0) {
      return NextResponse.json({ error: 'AI API Key missing. Add it in Dashboard → Settings → AI.' }, { status: 400 });
    }

    const mimeType = getImageMimeType(imageBase64);
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const productList = activeProducts.map(p => `${p.id}|${(p.name || '').slice(0, 50)}|${p.price}`).join('\n');
    const systemPrompt = `Analyze this shopping list image written in Bengali or English.
Match the items you see ONLY to these available products (Format: ID|Name|Price):
${productList}

Return ONLY valid JSON: {"items":[{"productId":"ID","name":"Product Name","quantity":1,"customizedText":"৪০০ গ্রাম","confidence":"high"}]}
If nothing matches, return {"items":[]}. Do NOT add any explanation.
If the user specifies a specific amount like '400 gram' or '10 piece', set the quantity based on the base unit or set it to 1, and put '400 গ্রাম' or '১০ পিস' in the customizedText field.`;

    let lastError = null;
    let visionSuccess = false;
    let text = null;
    let model = null;

    // Call Gemini Vision with key fallback chain
    for (const keyObj of keysToTry) {
      const currentApiKey = keyObj.key;
      const keySource = keyObj.source;

      console.log(`[AI Vision] Trying call using key source: ${keySource}`);
      const result = await tryGeminiVision(currentApiKey, systemPrompt, base64Data, mimeType);

      if (result.success && result.text) {
        text = result.text;
        model = result.model;
        visionSuccess = true;
        console.log(`[AI Vision] Success using key source: ${keySource}`);
        break;
      }
      lastError = new Error(`API call failed or returned empty response using key source ${keySource}`);
    }

    if (!visionSuccess || !text) {
      return NextResponse.json({
        error: `ছবি विश्लेषण করা যায়নি। API Key সঠিক আছে কিনা নিশ্চিত করুন। (${lastError?.message || 'Quota exceeded or invalid API key'})`
      }, { status: 503 });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      try { parsed = JSON.parse(cleaned); } catch { parsed = { items: [] }; }
    }

    const validatedItems = (parsed.items || [])
      .filter(item => activeProducts.some(p => p.id === item.productId))
      .map(item => ({
        productId: item.productId,
        name: item.name || activeProducts.find(p => p.id === item.productId)?.name || '',
        quantity: Math.max(1, parseInt(item.quantity) || 1),
        customizedText: item.customizedText || '',
        confidence: item.confidence || 'medium'
      }));

    console.log(`[AI Vision] Used model: ${model}, found ${validatedItems.length} items`);
    return NextResponse.json({ items: validatedItems });

  } catch (error) {
    console.error('[AI Vision Critical Error]', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}
