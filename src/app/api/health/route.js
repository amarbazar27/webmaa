export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

import { sendTelegramAlert } from '@/lib/telegram';

export async function GET() {
  return NextResponse.json(
    { 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'webmaa-production'
    },
    { status: 200 }
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, message, stack, url, timestamp } = body;

    // Send critical frontend errors to Telegram
    if (type === 'frontend_crash') {
      await sendTelegramAlert({
        level: 'error',
        message: `🚨 Frontend Crash Report\n\nError: ${message}\nURL: ${url}\nTime: ${timestamp}`,
        context: { stack: stack?.slice(0, 1000) }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
