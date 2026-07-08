import { NextResponse } from 'next/server';
import { getGlobalConfig, getShop } from '@/lib/firestore';

import { createRateLimiter } from '@/lib/rate-limit';

// Phase 5: Distributed rate limiter (Upstash Redis with in-memory fallback)
const aiLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60000, prefix: 'ai_chat' });

export async function POST(req) {
  try {
    // Phase 5: Distributed rate limit by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { limited } = await aiLimiter.check(clientIp);
    if (limited) {
      return NextResponse.json({ error: { message: 'Too many requests. Please wait.' } }, { status: 429 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: { message: 'Invalid content type' } }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || '';
    if (!userAgent || userAgent.length < 10) {
      return NextResponse.json({ error: { message: 'Request blocked.' } }, { status: 403 });
    }

    const body = await req.json();
    const { shopId, messages, model, orderHistory, botTone } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: { message: 'Messages array is required.' } }, { status: 400 });
    }
    if (messages.length > 20) {
      return NextResponse.json({ error: { message: 'Too many messages. Max 20.' } }, { status: 400 });
    }

    // ── API Key Resolution Fallback Chain ──────────────────────────
    const keysToTry = [];
    const isValidApiKey = (key) => {
      if (!key || typeof key !== 'string') return false;
      const k = key.trim();
      return k.startsWith('AIza') || k.startsWith('gsk_') || k.startsWith('sk-') || k.startsWith('sk-or-');
    };

    // 1. Try shop custom key first
    if (shopId) {
      const shop = await getShop(shopId);
      const shopKey = shop?.aiConfig?.apiKey?.trim();
      if (isValidApiKey(shopKey)) {
        keysToTry.push({ key: shopKey, source: `Shop Custom Key (${shopId})` });
      }
    }

    // 2. Try global settings key second
    const globalConfig = await getGlobalConfig();
    const dbKey = globalConfig?.geminiApiKey?.trim();
    if (isValidApiKey(dbKey)) {
      keysToTry.push({ key: dbKey, source: 'Global Config Key' });
    }

    // 3. Try environment keys third
    const envKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.AI_API_KEY;
    if (isValidApiKey(envKey)) {
      keysToTry.push({ key: envKey, source: 'System Environment Key' });
    } else if (envKey && envKey.trim()) {
      keysToTry.push({ key: envKey.trim(), source: 'System Environment Key (Raw)' });
    }

    if (keysToTry.length === 0) {
      return NextResponse.json({ error: { message: 'AI API key not configured.' } }, { status: 400 });
    }

    // ── Build System Context (Order history + Value for Money AI) ───
    let systemText = `তুমি একটি বুদ্ধিমান AI Shopping Assistant। তুমি বাংলাদেশি রিটেইল স্টোরে কাজ করছ।

নিয়মাবলী:
- সর্বদা "আসসালামু আলাইকুম" দিয়ে শুরু করো (শুধু প্রথমবার)।
- বাংলায় কথা বলো, সহজ ও প্রাকৃতিক ভাষায়।
- কথা বলার স্টাইল/টোন হবে: ${botTone || 'বন্ধুত্বপূর্ণ ও সাহায্যকারী (Friendly)'}।
- ব্যবহারকারী কী অর্ডার করতে চাইছে তা বোঝো।
- সম্পর্কিত পণ্য (value-for-money) প্রস্তাব করো।
- ছোট ও সহায়ক উত্তর দাও, কিন্তু কোনো অবস্থাতেই উত্তর মাঝপথে থামাবে না। সম্পূর্ণ উত্তর শেষ করবে।`;

    // Add order history context if available
    if (orderHistory && orderHistory.length > 0) {
      const recentOrders = orderHistory.slice(0, 5);
      const orderSummary = recentOrders.map(o =>
        `- অর্ডার ${o.orderIdVisual || o.id}: ${(o.items || []).map(i => `${i.name} (×${i.quantity})`).join(', ')} | মোট: ৳${o.total}`
      ).join('\n');
      systemText += `\n\nএই কাস্টমারের সাম্প্রতিক অর্ডার ইতিহাস:\n${orderSummary}\n\nএই তথ্য ব্যবহার করে পার্সোনালাইজড সাজেশন দাও।`;
    }

    let lastError = null;

    // Iterate through all resolved keys until one succeeds
    for (const keyObj of keysToTry) {
      const apiKey = keyObj.key;
      const keySource = keyObj.source;

      console.log(`[AI API] Trying key source: ${keySource}`);

      // ── Provider Detection ──────────────────────────
      let isGemini = apiKey.startsWith('AIzaSy') || apiKey.startsWith('AIza');
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

      try {
        if (isGemini) {
          // 🚀 Gemini models to try in sequence
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

          let keySuccess = false;
          let responseData = null;

          for (const modelName of modelsToTry) {
            try {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
              const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: systemText }] },
                  contents: chatMessages,
                  generationConfig: { maxOutputTokens: 8192 }
                })
              });

              const data = await response.json();

              if (response.ok) {
                const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।';
                responseData = { choices: [{ message: { content: botText } }] };
                keySuccess = true;
                break;
              }

              // Model not found — try next model
              if (response.status === 404 || data.error?.message?.includes('not found')) {
                console.warn(`[AI API] Gemini Model ${modelName} not found using ${keySource}, trying next model...`);
                lastError = new Error(data.error?.message || 'Model not found');
                continue;
              }

              // Rate limit — wait and retry same model once
              if (response.status === 429) {
                console.warn(`[AI API] Gemini Model ${modelName} rate limited using ${keySource}.`);
                lastError = new Error(data.error?.message || 'Rate limit exceeded');
                continue;
              }

              console.error(`[AI API] Gemini ${modelName} error with ${keySource}:`, data.error?.message);
              lastError = new Error(data.error?.message || `Error status ${response.status}`);
              break; // Try next key
            } catch (err) {
              console.error(`[AI API] Gemini ${modelName} threw for ${keySource}:`, err.message);
              lastError = err;
              continue;
            }
          }

          if (keySuccess && responseData) {
            console.log(`[AI API] Successfully answered request using key: ${keySource}`);
            return NextResponse.json(responseData);
          }

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
              'HTTP-Referer': 'https://bdretailers.com',
              'X-Title': 'BDRetailers SaaS'
            },
            body: JSON.stringify(bodyParameters)
          });

          const data = await response.json();
          if (response.ok) {
            console.log(`[AI API] Successfully answered request using OpenAI-compatible key: ${keySource}`);
            return NextResponse.json(data);
          }

          console.error(`[AI API] OpenAI-compatible key failed for ${keySource}:`, data.error?.message);
          lastError = new Error(data.error?.message || `Error status ${response.status}`);
        }
      } catch (err) {
        console.error(`[AI API] Key execution failed for ${keySource}:`, err.message);
        lastError = err;
      }
    }

    // Silent Groq fallback as a last system-wide resort
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        console.log('[AI API] Attempting system-wide silent Groq fallback...');
        const groqMessages = messages
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role === 'bot' ? 'assistant' : m.role, content: m.text || m.content }));
        groqMessages.unshift({ role: 'system', content: systemText });

        const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
          body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: groqMessages, temperature: 0.7, max_tokens: 4000 })
        });
        const groqData = await groqResp.json();
        if (groqResp.ok && groqData.choices?.[0]?.message?.content) {
          console.log('[AI API] Successfully answered request using silent Groq fallback.');
          return NextResponse.json({ choices: [{ message: { content: groqData.choices[0].message.content } }] });
        }
      } catch (groqErr) {
        console.error('[AI API] Groq fallback failed:', groqErr.message);
      }
    }

    return NextResponse.json({ 
      error: { message: `AI সার্ভিস সাময়িকভাবে অনুপলব্ধ। পরে চেষ্টা করুন। (${lastError?.message || 'Quota exceeded or invalid API Key'})` } 
    }, { status: 503 });

  } catch (error) {
    console.error('[AI API] Critical Error:', error.message);
    return NextResponse.json({ error: { message: 'AI processing failed. Please try again.' } }, { status: 500 });
  }
}
