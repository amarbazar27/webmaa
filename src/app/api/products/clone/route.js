import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

function isShopOwner(shopData, uid) {
  return (
    shopData.ownerId === uid ||
    shopData.ownerUid === uid ||
    shopData.createdBy === uid ||
    shopData.userId === uid
  );
}

// Clean HTML to essential content
function extractPageText(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);
}

// Extract OpenGraph tags
function extractOgMeta(html) {
  const getTag = (prop) => {
    const match = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
                  html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i')) ||
                  html.match(new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
    return match ? match[1] : null;
  };

  return {
    title: getTag('og:title') || getTag('title'),
    image: getTag('og:image'),
    description: getTag('og:description') || getTag('description'),
    price: getTag('product:price:amount') || getTag('price'),
  };
}

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    const body = await request.json();
    const { shopId, url, autoSave = true } = body;

    if (!shopId || !url) {
      return NextResponse.json({ error: 'Shop ID এবং প্রোডাক্ট/ওয়েবসাইট URL প্রয়োজন' }, { status: 400 });
    }

    // Verify ownership
    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      const shopData = shopDoc.data() || {};
      if (!isShopOwner(shopData, authResult.uid) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
      }
    }

    // 1. Fetch competitor/supplier webpage
    let pageHtml = '';
    try {
      const fetchRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(12000),
      });
      pageHtml = await fetchRes.text();
    } catch (fetchErr) {
      return NextResponse.json({ error: `ওয়েবসাইট থেকে ডাটা আনতে ব্যর্থ: ${fetchErr.message}` }, { status: 400 });
    }

    const ogData = extractOgMeta(pageHtml);
    const textSnippet = extractPageText(pageHtml);

    // 2. Extract products using Groq LPU AI parser
    const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2;
    let extractedProducts = [];

    if (groqKey) {
      try {
        const aiPrompt = `তুমি একজন এক্সপার্ট ই-কমার্স ডাটা এক্সট্রাক্টর (REA Reverse Engineer Agent)।
নিচে দেওয়া ওয়েবসাইটের টেক্সট ও মেটাডাটা থেকে প্রোডাক্ট বা পণ্যসমূহের তথ্য বের করো।

URL: ${url}
OG Data: ${JSON.stringify(ogData)}
ওয়েবসাইট কন্টেন্ট:
${textSnippet}

নির্দেশনা:
- ওয়েবসাইটের পণ্যগুলোর নাম (বাংলা বা ইংরেজিতে), মূল্য (BDT সংখ্যায়), বিবরণ, ক্যাটাগরি এবং ছবির লিংক থাকলে বের করো।
- যদি নির্দিষ্ট ছবি না পাওয়া যায়, তবে পণ্যের ধরণের সাথে মিলে এমন রিয়ালিস্টিক আনস্প্ল্যাশ ইমেজ URL দাও।
- আউটপুট হতে হবে STRICT JSON ARRAY (কোনো অতিরিক্ত টেক্সট বা মার্কডাউন ছাড়া):
[
  {
    "name": "পণ্যের নাম",
    "price": 550,
    "costPrice": 400,
    "stock": 50,
    "category": "ক্যাটাগরি",
    "description": "বিস্তারিত বিবরণ",
    "imageUrl": "https://images.unsplash.com/..."
  }
]`;

        const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: aiPrompt }],
            temperature: 0.2,
            response_format: { type: 'json_object' }
          })
        });

        const aiJson = await aiRes.json();
        const contentStr = aiJson.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(contentStr);
        extractedProducts = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || []);
      } catch (aiErr) {
        console.warn('[Clone API] Groq parsing fallback:', aiErr.message);
      }
    }

    // Fallback if AI didn't return or failed: use OG meta
    if (!extractedProducts || extractedProducts.length === 0) {
      if (ogData.title) {
        extractedProducts.push({
          name: ogData.title,
          price: parseFloat(ogData.price) || 450,
          costPrice: (parseFloat(ogData.price) || 450) * 0.7,
          stock: 40,
          category: 'সাধারণ',
          description: ogData.description || ogData.title,
          imageUrl: ogData.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
        });
      }
    }

    if (extractedProducts.length === 0) {
      return NextResponse.json({ error: 'এই লিংক থেকে কোনো প্রোডাক্ট তথ্য পাওয়া যায়নি।' }, { status: 422 });
    }

    // 3. Auto-save to shop if requested
    if (autoSave) {
      const batch = adminDb.batch();
      const existingCats = new Set();
      const catSnap = await adminDb.collection('shops').doc(shopId).collection('categories').get();
      catSnap.forEach(d => existingCats.add((d.data().name || '').trim().toLowerCase()));

      let savedCount = 0;
      for (const p of extractedProducts.slice(0, 30)) {
        if (!p.name) continue;
        const pRef = adminDb.collection('shops').doc(shopId).collection('products').doc();
        const catName = (p.category || 'ক্যাটাগরি').trim();

        if (catName && !existingCats.has(catName.toLowerCase())) {
          existingCats.add(catName.toLowerCase());
          const catRef = adminDb.collection('shops').doc(shopId).collection('categories').doc();
          batch.set(catRef, {
            name: catName,
            slug: catName.toLowerCase().replace(/\s+/g, '-'),
            createdAt: new Date().toISOString()
          });
        }

        const img = p.imageUrl || ogData.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

        batch.set(pRef, {
          name: p.name.trim(),
          price: parseFloat(p.price) || 350,
          costPrice: parseFloat(p.costPrice) || 200,
          stock: parseInt(p.stock, 10) || 50,
          category: catName,
          description: p.description || '',
          imageUrl: img,
          images: [img],
          sourceUrl: url,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        savedCount++;
      }

      await batch.commit();

      return NextResponse.json({
        success: true,
        savedCount,
        products: extractedProducts,
        message: `${savedCount} টি প্রোডাক্ট প্রতিযোগী ওয়েবসাইট থেকে সফলভাবে কপি ও যুক্ত হয়েছে! 🚀`
      });
    }

    return NextResponse.json({
      success: true,
      products: extractedProducts
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Clone product error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
