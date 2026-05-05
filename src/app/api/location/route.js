export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// 📍 LOCATION API — Auto-detect (GPS → IP → Fallback)
//
// GET ?lat=xxx&lon=xxx       → Reverse geocode from GPS
// GET ?auto=true             → IP-based detection
// GET ?type=divisions/...    → Proxy to geo API (backward compat)
// ═══════════════════════════════════════════════════════════════

// Bangladesh district center coordinates for nearest-match
const BD_DISTRICTS = [
  { name: 'ঢাকা', lat: 23.8103, lon: 90.4125 },
  { name: 'চট্টগ্রাম', lat: 22.3569, lon: 91.7832 },
  { name: 'রাজশাহী', lat: 24.3636, lon: 88.6241 },
  { name: 'খুলনা', lat: 22.8456, lon: 89.5403 },
  { name: 'বরিশাল', lat: 22.7010, lon: 90.3535 },
  { name: 'সিলেট', lat: 24.8949, lon: 91.8687 },
  { name: 'রংপুর', lat: 25.7439, lon: 89.2752 },
  { name: 'ময়মনসিংহ', lat: 24.7471, lon: 90.4203 },
  { name: 'কুমিল্লা', lat: 23.4607, lon: 91.1809 },
  { name: 'গাজীপুর', lat: 24.0023, lon: 90.4264 },
  { name: 'নারায়ণগঞ্জ', lat: 23.6238, lon: 90.5000 },
  { name: 'টাঙ্গাইল', lat: 24.2513, lon: 89.9167 },
  { name: 'যশোর', lat: 23.1667, lon: 89.2167 },
  { name: 'বগুড়া', lat: 24.8465, lon: 89.3773 },
  { name: 'দিনাজপুর', lat: 25.6279, lon: 88.6332 },
];

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestDistrict(lat, lon) {
  let nearest = BD_DISTRICTS[0];
  let minDist = Infinity;
  for (const d of BD_DISTRICTS) {
    const dist = haversineDistance(lat, lon, d.lat, d.lon);
    if (dist < minDist) { minDist = dist; nearest = d; }
  }
  return { ...nearest, distance: Math.round(minDist * 10) / 10 };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat'));
    const lon = parseFloat(searchParams.get('lon'));
    const auto = searchParams.get('auto');

    // ── GPS-based reverse geocode ─────────────────────────
    if (!isNaN(lat) && !isNaN(lon)) {
      const nearest = findNearestDistrict(lat, lon);
      const isSadar = nearest.distance < 15;

      return NextResponse.json({
        method: 'gps',
        district: nearest.name,
        distanceKm: nearest.distance,
        isSadar,
        suggestion: isSadar
          ? `আপনি ${nearest.name} সদরে আছেন`
          : `আপনি ${nearest.name} এর কাছাকাছি (${nearest.distance} কিমি)`,
        coordinates: { lat, lon },
      });
    }

    // ── IP-based auto-detect ──────────────────────────────
    if (auto === 'true') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';

      // Try free IP geolocation
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,lat,lon,country`, {
          signal: AbortSignal.timeout(3000),
        });
        const geoData = await geoRes.json();

        if (geoData.status === 'success' && geoData.lat && geoData.lon) {
          const nearest = findNearestDistrict(geoData.lat, geoData.lon);
          return NextResponse.json({
            method: 'ip',
            ip: ip.slice(0, 8) + '***',
            city: geoData.city,
            region: geoData.regionName,
            country: geoData.country,
            district: nearest.name,
            distanceKm: nearest.distance,
            isSadar: nearest.distance < 15,
            coordinates: { lat: geoData.lat, lon: geoData.lon },
          });
        }
      } catch {
        // IP detection failed, use fallback
      }

      // Fallback: default to Dhaka
      return NextResponse.json({
        method: 'fallback',
        district: 'ঢাকা',
        distanceKm: 0,
        isSadar: true,
        suggestion: 'লোকেশন সনাক্ত করা যায়নি। ঢাকা সেট করা হয়েছে।',
        coordinates: { lat: 23.8103, lon: 90.4125 },
      });
    }

    // ── No params → return district list ──────────────────
    return NextResponse.json({
      districts: BD_DISTRICTS.map(d => ({ name: d.name, lat: d.lat, lon: d.lon })),
    });
  } catch (err) {
    console.error('[Location API]', err);
    return NextResponse.json({ error: 'Location detection failed' }, { status: 500 });
  }
}
