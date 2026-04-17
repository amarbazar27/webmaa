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

    // ── SMART DETECT: Gemini vs OpenAI-Compatible (Groq, OpenRouter, DeepSeek) ────────────────────────
    
    // Determine provider and endpoint based on key
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
      defaultModel = model || 'google/gemini-2.5-flash'; // Good default for openrouter
    } else {
      // Standard OpenAI / DeepSeek
      endpoint = 'https://api.openai.com/v1/chat/completions';
      if (!model) defaultModel = 'gpt-4o-mini';
    }

    if (isGemini) {
      // 🚀 Gemini Native API Call
      const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      
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
            lastError = { error: { message: err.message } };
          }
        }
      }
      return NextResponse.json(
        lastError || { error: { message: "All Gemini models failed." } }, 
        { status: 500 }
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
          'HTTP-Referer': 'https://webmaa.pro.bd',
          'X-Title': 'Webmaa SaaS'
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
