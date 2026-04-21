export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  // Simple health check endpoint that can be polled by UptimeRobot or Cloudflare Load Balancer.
  // We can include database connectivity tests here if strictly needed, 
  // but for Vercel edge/node instance health, a simple 200 OK is the bare minimum.
  
  return NextResponse.json(
    { 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'webmaa-production'
    },
    { status: 200 }
  );
}
