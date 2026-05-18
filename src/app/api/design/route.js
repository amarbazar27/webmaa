export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// ═══════════════════════════════════════════════════════════════
// 🎨 DESIGN API — 10 Theme Presets + Real-time Updates
// GET  ?shopId=xxx          → Get current theme
// POST { shopId, preset }   → Apply theme preset
// ═══════════════════════════════════════════════════════════════

// ── WCAG AA contrast-safe theme presets
// Rule: dark bg → light text | light bg → dark text (NO EXCEPTIONS)
// These values MUST match SHOP_THEME_PRESETS in ShopClient.jsx
const THEME_PRESETS = {
  // Light backgrounds → dark text
  classic: {
    name: 'Classic', namebn: 'ক্লাসিক',
    primary: '#4f46e5', accent: '#7c3aed', bg: '#ffffff', text: '#0f172a',
    card: '#ffffff', border: '#e2e8f0', radius: '16px', font: 'Inter',
    headerBg: 'linear-gradient(135deg, #4f46e5, #7c3aed)', headerText: '#ffffff', btnText: '#ffffff',
  },
  forest: {
    name: 'Forest', namebn: 'ফরেস্ট',
    primary: '#059669', accent: '#34d399', bg: '#f0fdf4', text: '#064e3b',
    card: '#ffffff', border: '#bbf7d0', radius: '12px', font: 'Inter',
    headerBg: 'linear-gradient(135deg, #065f46, #047857)', headerText: '#ecfdf5', btnText: '#ffffff',
  },
  sunset: {
    name: 'Sunset', namebn: 'সানসেট',
    primary: '#ea580c', accent: '#f97316', bg: '#fff7ed', text: '#431407',
    card: '#ffffff', border: '#fed7aa', radius: '24px', font: 'Outfit',
    headerBg: 'linear-gradient(135deg, #c2410c, #ea580c)', headerText: '#ffffff', btnText: '#ffffff',
  },
  ocean: {
    name: 'Ocean', namebn: 'ওসান',
    primary: '#0284c7', accent: '#38bdf8', bg: '#f0f9ff', text: '#0c4a6e',
    card: '#ffffff', border: '#bae6fd', radius: '16px', font: 'Inter',
    headerBg: 'linear-gradient(135deg, #0369a1, #0284c7)', headerText: '#ffffff', btnText: '#ffffff',
  },
  rose: {
    name: 'Rose Gold', namebn: 'রোজ গোল্ড',
    primary: '#be185d', accent: '#f43f5e', bg: '#fff1f2', text: '#4c0519',
    card: '#ffffff', border: '#fecdd3', radius: '20px', font: 'Outfit',
    headerBg: 'linear-gradient(135deg, #9f1239, #be185d)', headerText: '#ffffff', btnText: '#ffffff',
  },
  minimal: {
    name: 'Minimal', namebn: 'মিনিমাল',
    primary: '#18181b', accent: '#71717a', bg: '#fafafa', text: '#18181b',
    card: '#ffffff', border: '#e4e4e7', radius: '8px', font: 'Inter',
    headerBg: '#18181b', headerText: '#fafafa', btnText: '#ffffff',
  },
  royal: {
    name: 'Royal', namebn: 'রয়েল',
    primary: '#7c3aed', accent: '#a78bfa', bg: '#faf5ff', text: '#2e1065',
    card: '#ffffff', border: '#ddd6fe', radius: '24px', font: 'Outfit',
    headerBg: 'linear-gradient(135deg, #5b21b6, #7c3aed)', headerText: '#ffffff', btnText: '#ffffff',
  },
  earth: {
    name: 'Earth Tone', namebn: 'আর্থ টোন',
    primary: '#92400e', accent: '#d97706', bg: '#fffbeb', text: '#451a03',
    card: '#ffffff', border: '#fde68a', radius: '16px', font: 'Inter',
    headerBg: 'linear-gradient(135deg, #78350f, #92400e)', headerText: '#ffffff', btnText: '#ffffff',
  },
  // Dark backgrounds → light text (CRITICAL: always use light text on dark bg)
  midnight: {
    name: 'Midnight', namebn: 'মিডনাইট',
    primary: '#a5b4fc', accent: '#c084fc', bg: '#0f172a', text: '#f8fafc',
    card: '#1e293b', border: '#334155', radius: '20px', font: 'Outfit',
    headerBg: 'linear-gradient(135deg, #1e1b4b, #312e81)', headerText: '#e0e7ff', btnText: '#ffffff',
  },
  neon: {
    name: 'Neon Dark', namebn: 'নিয়ন ডার্ক',
    primary: '#22d3ee', accent: '#a855f7', bg: '#020617', text: '#f0fdfa',
    card: '#0f172a', border: '#1e293b', radius: '20px', font: 'Outfit',
    headerBg: 'linear-gradient(135deg, #0e7490, #7c3aed)', headerText: '#f0fdfa', btnText: '#ffffff',
  },
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    // Return all presets if no shopId
    if (!shopId) {
      return NextResponse.json({ presets: THEME_PRESETS });
    }

    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const shopData = shopSnap.data();
    const activePreset = shopData.designPreset || 'classic';
    const customOverrides = shopData.designOverrides || {};

    return NextResponse.json({
      activePreset,
      theme: { ...THEME_PRESETS[activePreset], ...customOverrides },
      presets: THEME_PRESETS,
    });
  } catch (err) {
    console.error('[Design GET]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let decoded;
    try { decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]); }
    catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    const body = await req.json();
    const { shopId, preset, overrides } = body;
    if (!shopId || !preset) return NextResponse.json({ error: 'shopId and preset required' }, { status: 400 });
    if (!THEME_PRESETS[preset]) return NextResponse.json({ error: 'Invalid preset' }, { status: 400 });

    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    const shopData = shopSnap.data();
    if (shopData.ownerId !== decoded.uid) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'superadmin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    const updateData = { designPreset: preset, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (overrides && typeof overrides === 'object') {
      updateData.designOverrides = overrides;
    }

    await adminDb.collection('shops').doc(shopId).update(updateData);

    return NextResponse.json({
      success: true,
      theme: { ...THEME_PRESETS[preset], ...(overrides || {}) },
    });
  } catch (err) {
    console.error('[Design POST]', err);
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
  }
}
