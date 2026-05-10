import { NextResponse } from 'next/server';
import { getGlobalConfig, getShop } from '@/lib/firestore';

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: { message: 'Invalid content type' } }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || '';
    if (!userAgent || userAgent.length < 10) {
      return NextResponse.json({ error: { message: 'Request blocked.' } }, { status: 403 });
    }

    const body = await req.json();
    const { shopId, messages, model, orderHistory } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: { message: 'Messages array is required.' } }, { status: 400 });
    }
    if (messages.length > 20) {
      return NextResponse.json({ error: { message: 'Too many messages. Max 20.' } }, { status: 400 });
    }

    // ── API Key Resolution ──────────────────────────
    let apiKey = null;
    if (shopId) {
      const shop = await getShop(shopId);
      if (shop?.aiConfig?.apiKey?.trim()) apiKey = shop.aiConfig.apiKey.trim();
    }
    if (!apiKey) {
      const globalConfig = await getGlobalConfig();
      if (globalConfig?.geminiApiKey?.trim()) apiKey = globalConfig.geminiApiKey.trim();
    }
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.AI_API_KEY;
    }

    if (!apiKey) {
      return NextResponse.json({ error: { message: 'AI API key not configured.' } }, { status: 400 });
    }

    // ── Provider Detection ──────────────────────────
    let isGemini = apiKey.startsWith('AIzaSy');
    let endpoint = '';
    let defaultModel = model;

    if (!isGemini) {
      if (apiKey.startsWith('gsk_')) {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        defaultModel = model || 'llama-3.3-70b-versatile';
      } else if (apiKey.startsWith('sk-or-')) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        defaultModel = model || 'google/gemini-2.5-flash';
      } else {
        endpoint = 'https://api.openai.com/v1/chat/completions';
        defaultModel = model || 'gpt-4o-mini';
      }
    }

    // ── Build System Context (Order history + Value for Money AI) ───
    let systemText = `তুমি একটি বুদ্ধিমান AI Shopping Assistant। তুমি বাংলাদেশি রিটেইল স্টোরে কাজ করছ।

নিয়মাবলী:
- সর্বদা "আসসালামু আলাইকুম" দিয়ে শুরু করো (শুধু প্রথমবার)।
- বাংলায় কথা বলো, সহজ ও প্রাকৃতিক ভাষায়।
- ব্যবহারকারী কী অর্ডার করতে চাইছে তা বোঝো।
- সম্পর্কিত পণ্য (value-for-money) প্রস্তাব করো।
- ছোট ও সহায়ক উত্তর দাও।`;

    // Add order history context if available
    if (orderHistory && orderHistory.length > 0) {
      const recentOrders = orderHistory.slice(0, 5);
      const orderSummary = recentOrders.map(o =>
        `- অর্ডার ${o.orderIdVisual || o.id}: ${(o.items || []).map(i => `${i.name} (×${i.quantity})`).join(', ')} | মোট: ৳${o.total}`
      ).join('\n');
      systemText += `\n\nএই কাস্টমারের সাম্প্রতিক অর্ডার ইতিহাস:\n${orderSummary}\n\nএই তথ্য ব্যবহার করে পার্সোনালাইজড সাজেশন দাও।`;
    }

    if (isGemini) {
      // 🚀 Gemini with fallback chain
      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ];

      const chatMessages = [];
      for (const m of messages) {
        const text = m.text || m.content || '';
        if (m.role === 'system') {
          systemText += '\n' + text;
        } else {
          chatMessages.push({
            role: m.role === 'assistant' || m.role === 'bot' ? 'model' : 'user',
            parts: [{ text }]
          });
        }
      }

      if (chatMessages.length === 0 || chatMessages[0].role !== 'user') {
        chatMessages.unshift({ role: 'user', parts: [{ text: 'হ্যালো' }] });
      }

      for (const modelName of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemText }] },
              contents: chatMessages,
              generationConfig: { maxOutputTokens: 1024 }
            })
          });

          const data = await response.json();

          if (response.ok) {
            const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।';
            return NextResponse.json({ choices: [{ message: { content: botText } }] });
          }

          // Model not found — try next
          if (response.status === 404 || data.error?.message?.includes('not found')) {
            console.warn(`[AI] Model ${modelName} not found, trying next...`);
            continue;
          }

          // Rate limit — wait and retry same model once
          if (response.status === 429) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }

          console.error(`[AI] Gemini ${modelName} error:`, data.error?.message);
          break;
        } catch (err) {
          console.error(`[AI] Gemini ${modelName} threw:`, err.message);
          continue;
        }
      }

      // Silent Groq fallback
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        try {
          const groqMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role === 'bot' ? 'assistant' : m.role, content: m.text || m.content }));
          groqMessages.unshift({ role: 'system', content: systemText });

          const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
            body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: groqMessages, temperature: 0.7, max_tokens: 1000 })
          });
          const groqData = await groqResp.json();
          if (groqResp.ok && groqData.choices?.[0]?.message?.content) {
            return NextResponse.json({ choices: [{ message: { content: groqData.choices[0].message.content } }] });
          }
        } catch (groqErr) {
          console.error('[AI] Groq fallback failed:', groqErr.message);
        }
      }

      return NextResponse.json({ error: { message: 'AI সার্ভিস সাময়িকভাবে অনুপলব্ধ। পরে চেষ্টা করুন।' } }, { status: 503 });

    } else {
      // OpenAI-compatible (Groq/OpenRouter)
      const bodyParameters = {
        model: defaultModel,
        messages: [
          { role: 'system', content: systemText },
          ...messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role === 'bot' ? 'assistant' : m.role,
            content: m.text || m.content
          }))
        ],
        temperature: 0.7,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://webmaa.vercel.app',
          'X-Title': 'Webmaa SaaS'
        },
        body: JSON.stringify(bodyParameters)
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

  } catch (error) {
    console.error('[AI API] Error:', error.message);
    return NextResponse.json({ error: { message: 'Server error processing AI request.' } }, { status: 500 });
  }
}
