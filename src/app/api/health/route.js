export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

/**
 * PROD-2: Health Check Endpoint
 * Used by monitoring systems (UptimeRobot, Vercel, etc.) to verify the app is running.
 * Returns 200 if the server is healthy, 503 if Firebase Admin SDK failed to initialize.
 */
export async function GET() {
  try {
    // Check if Firebase Admin is initialized
    const admin = (await import('firebase-admin')).default;
    const isFirebaseReady = admin.apps.length > 0;

    if (!isFirebaseReady) {
      return NextResponse.json({
        status: 'degraded',
        firebase: false,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'healthy',
      firebase: true,
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
