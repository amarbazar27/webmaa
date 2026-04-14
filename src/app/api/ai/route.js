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
       if (shop?.aiConfig?.apiKey) {
           apiKey = shop.aiConfig.apiKey;
       }
    }

    if (!apiKey) {
       const globalConfig = await getGlobalConfig();
       apiKey = globalConfig?.geminiApiKey;
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
      // 🚀 Gemini API Call (Using v1 for better stability)
      const modelName = 'gemini-1.5-flash';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
      
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages.map(m => ({
            role: m.role === 'assistant' || m.role === 'bot' ? 'model' : 'user',
            parts: [{ text: m.text || m.content }]
          })),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });

      const data = await response.json();
      
      // If v1 fails with "not found", try v1beta as fallback
      if (!response.ok && data.error?.message?.includes('not found')) {
         const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
         const fallbackRes = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: messages.map(m => ({
                role: m.role === 'assistant' || m.role === 'bot' ? 'model' : 'user',
                parts: [{ text: m.text || m.content }]
              })),
              generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
            })
         });
         const fallbackData = await fallbackRes.json();
         if (!fallbackRes.ok) return NextResponse.json(fallbackData, { status: fallbackRes.status });
         
         const botText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
         return NextResponse.json({ choices: [{ message: { content: botText } }] });
      }

      if (!response.ok) return NextResponse.json(data, { status: response.status });

      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      return NextResponse.json({
        choices: [{ message: { content: botText } }]
      });

    } else {
      // 🚀 Groq API Call
      const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'llama-3.3-70b-versatile',
          messages: messages.map(m => ({ role: m.role, content: m.text || m.content })),
          temperature: 0.7,
        })
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

  } catch (error) {
    console.error("AI Proxy Error:", error);
    return NextResponse.json({ error: { message: "Server error handling AI request." } }, { status: 500 });
  }
}
