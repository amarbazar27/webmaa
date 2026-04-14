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

    if (!apiKey) {
       return NextResponse.json({ error: { message: "API key not configured." } }, { status: 400 });
    }

    // Proxy securely to Groq
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
      })
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error("AI Proxy Error:", error);
    return NextResponse.json({ error: { message: "Server error handling AI request." } }, { status: 500 });
  }
}
