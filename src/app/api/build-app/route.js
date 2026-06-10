export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// Get GitHub owner and repo from env vars only (no git shell commands — not available in Vercel)
function getGitRepoDetails() {
  return {
    owner: process.env.GITHUB_OWNER || 'amarbazar27',
    repo: process.env.GITHUB_REPO || 'webmaa'
  };
}

export async function POST(request) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'সিস্টেম রিফ্রেশ করুন (Database Error)' }, { status: 500 });
    }

    // 1. Authenticate caller (Super Admin check)
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    if (!token) {
      return NextResponse.json({ error: 'অনুমতি নেই। লগইন করুন।' }, { status: 401 });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const callerUid = decodedToken.uid;

    let userRole = decodedToken.role || 'user';
    try {
      const userDoc = await adminDb.collection('users').doc(callerUid).get();
      if (userDoc.exists) {
        userRole = userDoc.data().role || userRole;
      }
    } catch (e) {}

    const isSystemAdmin = userRole === 'superadmin' || decodedToken.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

    if (!isSystemAdmin) {
      return NextResponse.json({ error: 'এই কাজটি করার অনুমতি আপনার নেই।' }, { status: 403 });
    }

    // 2. Parse request payload
    const body = await request.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'শপ আইডি প্রয়োজন।' }, { status: 400 });
    }

    // Fetch shop details
    const shopDoc = await adminDb.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) {
      return NextResponse.json({ error: 'শপটি পাওয়া যায়নি।' }, { status: 404 });
    }

    const shopData = shopDoc.data();
    const shopSlug = shopData.subdomainSlug || shopData.shopSlug;

    if (!shopSlug) {
      return NextResponse.json({ error: 'শপের স্ল্যাগ (subdomainSlug) নেই।' }, { status: 400 });
    }

    // 3. Initialize build state in database
    await adminDb.collection('shops').doc(shopId).update({
      appBuildStatus: 'building',
      appBuildError: null,
      appBuildUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Build App] Starting compilation request for ${shopSlug} (ID: ${shopId})`);

    // 4. Determine compilation runner context
    const githubPat = process.env.GITHUB_PAT;
    const isProductionBuild = !!githubPat;

    if (!isProductionBuild) {
      // Local development context: spawn child process runner in background
      console.log('[Build App] Triggering LOCAL build process in background...');
      const { spawn } = require('child_process');
      // Obfuscate path string to prevent Turbopack static tracing during build
      const scriptPath = 'scr' + 'ipts/' + 'build-te' + 'nant-ap' + 'p.js';

      // Spawns detached node build script
      const child = spawn('node', [scriptPath, shopSlug], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      return NextResponse.json({ 
        success: true, 
        message: 'লোকাল অ্যাপ জেনারেশন শুরু হয়েছে। ব্যাকগ্রাউন্ডে বিল্ড চলছে।',
        runner: 'local_development'
      });
    } else {
      // Production context: Dispatch GitHub Actions run
      console.log('[Build App] Triggering PRODUCTION GitHub Actions run...');
      const repoDetails = getGitRepoDetails();
      const githubOwner = process.env.GITHUB_OWNER || repoDetails.owner;
      const githubRepo = process.env.GITHUB_REPO || repoDetails.repo;

      const dispatchUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/dispatches`;

      const response = await fetch(dispatchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubPat}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DaripallahNextServer',
        },
        body: JSON.stringify({
          event_type: 'build-app',
          client_payload: {
            shopId,
            shopSlug,
          }
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Build App] GitHub Actions dispatch failed:`, errText);
        
        // Reset build state to failure in database
        await adminDb.collection('shops').doc(shopId).update({
          appBuildStatus: 'failed',
          appBuildError: `GitHub Action trigger failed: ${response.statusText} (${errText})`,
          appBuildUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ 
          error: 'GitHub Actions রান করতে ব্যর্থ হয়েছে। অনুগ্রহ করে GITHUB_PAT চেক করুন।' 
        }, { status: 500 });
      }

      console.log(`[Build App] GitHub Actions workflow dispatched successfully to ${githubOwner}/${githubRepo}`);
      return NextResponse.json({ 
        success: true, 
        message: 'ক্লাউড অ্যাপ জেনারেশন শুরু হয়েছে। GitHub Actions ব্যাকগ্রাউন্ডে বিল্ড প্রসেস করছে।',
        runner: 'github_actions'
      });
    }

  } catch (error) {
    console.error('[Build App] Exception occurred:', error);
    return NextResponse.json({ error: 'অ্যাপ জেনারেশন প্রসেস শুরু করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
