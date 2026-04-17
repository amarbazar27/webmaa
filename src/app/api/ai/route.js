import { NextResponse } from 'next/server';
import { getGlobalConfig, getShop } from '@/lib/firestore';

// In-memory rate limiter (simple protection for DDos)
const rateLimitMap = new Map();

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const userLimit = rateLimitMap.get(ip) || { count: 0, lastRequest: now };
    
    // Reset window every 60 seconds
    if (now - userLimit.lastRequest > 60000) {
      userLimit.count = 0;
      userLimit.lastRequest = now;
    }
    
    // Max 10 requests per minute per IP
    if (userLimit.count > 10) { 
       return NextResponse.json({ error: { message: "Too many AI requests. Please wait a moment." } }, { status: 429 });
    }
    
    userLimit.count++;
    rateLimitMap.set(ip, userLimit);

    const { shopId, messages, model } = await req.json();

    let apiKey = null;

    // Determine the exact key securely on the BACKEND
    if (shopId) {
       const shop = await getShop(shopId);
       if (shop?.aiConfig?.apiKey?.trim()) {
           apiKey = shop.aiConfig.apiKey.trim();
           console.log(`Using shop-specific AI key for shop: ${shopId}`);
       }
    }

    if (!apiKey) {
       const globalConfig = await getGlobalConfig();
       if (globalConfig?.geminiApiKey?.trim()) {
           apiKey = globalConfig.geminiApiKey.trim();
           console.log("Using global Gemini API key from Firestore.");
       }
    }

    // Final Fallback to Vercel Environment Variables (Securely)
    if (!apiKey) {
       apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    }

    if (!apiKey) {
       return NextResponse.json({ error: { message: "API key not configured in Firestore or Vercel." } }, { status: 400 });
    }

    // ── SMART DETECT: Gemini vs Groq ────────────────────────
    const isGemini = apiKey.startsWith('AIzaSy');

    if (isGemini) {
      // 🚀 Gemini API Call (2026 — Only live models)
      // 🚀 Gemini API Call (Stable models — 2025/2026)
      const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
      
      // Extract system message and user/bot messages separately
      // Gemini API does NOT accept 'system' role in contents — it must go in systemInstruction
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

      // Ensure conversation starts with 'user' role (Gemini requirement)
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

            // If quota exceeded, wait and retry
            if (response.status === 429 || data.error?.status === 'RESOURCE_EXHAUSTED') {
              console.warn(`Gemini ${modelName} quota hit (attempt ${attempt + 1}). Retrying in 3s...`);
              if (attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, 3000));
                continue;
              }
            }

            // If model not found, skip to next model immediately
            if (response.status === 404 || data.error?.message?.includes('not found')) {
              console.error(`Gemini ${modelName}: Model not found, skipping.`);
              lastError = data;
              break; // break retry loop, go to next model
            }

            lastError = data;
            break; // other error, skip retries
          } catch (err) {
            lastError = { error: { message: err.message } };
          }
        }
      }

      return NextResponse.json(
        lastError || { error: { message: "All Gemini models failed." } }, 
        { status: 500 }
      );

    } else {
      // 🚀 Groq API Call
      const bodyParameters = {
          model: model || 'llama-3.3-70b-versatile',
          messages: messages.map(m => ({ role: m.role, content: m.text || m.content })),
          temperature: 0.7,
      };

      // Force numeric response if specific prompt signatures are found
      const lastMsg = messages[messages.length - 1];
      const promptText = (lastMsg?.text || lastMsg?.content || '').toLowerCase();
      if (promptText.includes('respond only with') && promptText.includes('price')) {
          bodyParameters.temperature = 0.1; // More deterministic for pricing
          bodyParameters.max_tokens = 50;
      }

      const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(bodyParameters)
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

  } catch (error) {
    console.error("AI Proxy Error:", error);
    return NextResponse.json({ error: { message: "Server error handling AI request." } }, { status: 500 });
  }
}
