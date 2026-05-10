'use client';
import { useState, useEffect, useCallback } from 'react';

/**
 * useLocation — Auto-detect user location (GPS → IP → Fallback)
 * Returns: { location, loading, error, refresh, setManualLocation }
 * 
 * location shape: { district, method, isSadar, coordinates, distanceKm }
 */
export default function useLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const CACHE_KEY = 'webmaa_user_location';
  const CACHE_TTL = 1000 * 60 * 60; // 1 hour

  const detect = useCallback(async () => {
    setLoading(true);
    setError(null);

    // ── Check cache first ──
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setLocation(parsed.data);
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }

    // ── Try GPS ──
    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });

        const { latitude, longitude } = pos.coords;
        const res = await fetch(`/api/location?lat=${latitude}&lon=${longitude}`);
        if (res.ok) {
          const data = await res.json();
          const loc = { ...data, method: 'gps' };
          setLocation(loc);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: loc, timestamp: Date.now() }));
          setLoading(false);
          return;
        }
      } catch {
        // GPS denied or failed, try IP
      }
    }

    // ── Try IP ──
    try {
      const res = await fetch('/api/location?auto=true');
      if (res.ok) {
        const data = await res.json();
        setLocation(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        setLoading(false);
        return;
      }
    } catch { /* ignore */ }

    // ── Fallback ──
    const fallback = {
      method: 'fallback',
      district: 'ঢাকা',
      distanceKm: 0,
      isSadar: true,
      suggestion: 'লোকেশন সনাক্ত করা যায়নি',
      coordinates: { lat: 23.8103, lon: 90.4125 },
    };
    setLocation(fallback);
    setLoading(false);
  }, []);

  const setManualLocation = useCallback((loc) => {
    const manual = { ...loc, method: 'manual' };
    setLocation(manual);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: manual, timestamp: Date.now() }));
  }, []);

  const refresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    detect();
  }, [detect]);

  useEffect(() => { detect(); }, [detect]);

  return { location, loading, error, refresh, setManualLocation };
}
