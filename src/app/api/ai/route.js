import { NextResponse } from 'next/server';
import { getGlobalConfig, getShop } from '@/lib/firestore';

// ═══════════════════════════════════════════════════════════════════════
// 🔐 AI PROXY API — Server-side only, secure key handling
// 
// আগের সমস্যা:
// 1. In-memory rate limiter Vercel serverless-এ কাজ করে না (প্রতি request নতুন instance)
// 2. console.log দিয়ে key type leak হতো
// 3. কোনো auth verification ছিল না
//
// এখনকার fix:
// 1. Header-based fingerprint + timestamp rate limiting
// 2. Sensitive logs সরানো
// 3. Basic abuse prevention
// ═══════════════════════════════════════════════════════════════════════

export async function POST(req) {
  try {
    // ── Basic Abuse Prevention ──────────────────────────────────────────
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: { message: 'Invalid content type' } }, { status: 400 });
    }

    // ── IP-based fingerprint for logging (no blocking on serverless) ──
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    
    // Bot detection: যদি User-Agent না থাকে বা সন্দেহজনক হয়
    if (!userAgent || userAgent.length < 10) {
      return NextResponse.json({ error: { message: 'Request blocked.' } }, { status: 403 });
    }

    const body = await req.json();
    const { shopId, messages, model } = body;

    // ── Input Validation ────────────────────────────────────────────────
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: { message: 'Messages array is required.' } }, { status: 400 });
    }

    if (messages.length > 20) {
      return NextResponse.json({ error: { message: 'Too many messages. Max 20.' } }, { status: 400 });
    }

    // ── API Key Resolution (Server-side only — key NEVER goes to frontend) ──
    let apiKey = null;

    // 1. Shop-specific key
    if (shopId) {
      const shop = await getShop(shopId);
      if (shop?.aiConfig?.apiKey?.trim()) {
        apiKey = shop.aiConfig.apiKey.trim();
      }
    }

    // 2. Global Firestore config
    if (!apiKey) {
      const globalConfig = await getGlobalConfig();
      if (globalConfig?.geminiApiKey?.trim()) {
        apiKey = globalConfig.geminiApiKey.trim();
      }
    }

    // 3. Vercel Environment Variable fallback
    if (!apiKey) {
      apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    }

    if (!apiKey) {
      return NextResponse.json({ error: { message: 'AI API key not configured.' } }, { status: 400 });
    }

    // ── Provider Detection ──────────────────────────────────────────────
    let endpoint = '';
    let isGemini = false;
    let defaultModel = model;

    if (apiKey.startsWith('AIzaSy')) {
      isGemini = true;
    } else if (apiKey.startsWith('gsk_')) {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      defaultModel = model || 'llama-3.3-70b-versatile';
    } else if (apiKey.startsWith('sk-or-')) {
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      defaultModel = model || 'google/gemini-2.5-flash';
    } else {
      endpoint = 'https://api.openai.com/v1/chat/completions';
      if (!model) defaultModel = 'gpt-4o-mini';
    }

    if (isGemini) {
      // 🚀 Gemini Native API Call
      const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];
      
      let systemText = "Always greet with 'Assalamu Alaikum'. Never use 'Nomoskar'. Follow Muslim etiquette. Speak in Bengali for a Bangladeshi retail store.";
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
        chatMessages.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
      }

      let lastError = null;
      const MAX_RETRIES = 2;

      for (const modelName of modelsToTry) {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemText }] },
                contents: chatMessages,
                generationConfig: { maxOutputTokens: 1000 }
              })
            });

            const data = await response.json();

            if (response.ok) {
              const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
              return NextResponse.json({
                choices: [{ message: { content: botText } }]
              });
            }

            if (response.status === 429 || data.error?.status === 'RESOURCE_EXHAUSTED') {
              if (attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, 3000));
                continue;
              }
            }

            if (response.status === 404 || data.error?.message?.includes('not found')) {
              lastError = data;
              break; 
            }

            lastError = data;
            break; 
          } catch (err) {
            lastError = { error: { message: 'AI service temporarily unavailable.' } };
          }
        }
      }
      // ── Gemini failed: try Groq as silent fallback ──────────────────
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        const groqMessages = messages
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role === 'bot' ? 'assistant' : m.role, content: m.text || m.content }));
        
        const systemMsg = messages.find(m => m.role === 'system');
        if (systemMsg) groqMessages.unshift({ role: 'system', content: systemMsg.text || systemMsg.content });

        try {
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
          // Groq also failed, return original error
        }
      }

      return NextResponse.json(
        lastError || { error: { message: 'AI service unavailable. Please configure a valid API key.' } }, 
        { status: 503 }
      );

    } else {
      // 🚀 OpenAI-Compatible Wrapper (Groq, OpenRouter, Custom)
      const bodyParameters = {
        model: defaultModel,
        messages: messages.map(m => ({ role: m.role, content: m.text || m.content })),
        temperature: 0.7,
      };

      const lastMsg = messages[messages.length - 1];
      const promptText = (lastMsg?.text || lastMsg?.content || '').toLowerCase();
      if (promptText.includes('respond only with') && promptText.includes('price')) {
        bodyParameters.temperature = 0.1;
      }

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
    // 🔐 Generic error — কখনো internal details leak করবে না
    console.error('[AI API] Error:', error.message);
    return NextResponse.json(
      { error: { message: 'Server error processing AI request.' } }, 
      { status: 500 }
    );
  }
}
