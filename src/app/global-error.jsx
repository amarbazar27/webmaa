'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[GlobalError]', error);
    // Fire-and-forget Telegram alert for critical frontend errors
    fetch('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'frontend_crash',
        message: error?.message || 'Unknown error',
        stack: error?.stack?.slice(0, 500) || '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
      })
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: '#fff',
        textAlign: 'center',
        padding: '2rem',
        margin: 0,
      }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem', color: '#a5b4fc' }}>
            কিছু একটা সমস্যা হয়েছে
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: '2rem', fontSize: '0.95rem' }}>
            দুঃখিত, একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।<br />
            অনুগ্রহ করে আবার চেষ্টা করুন।
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => reset()}
              style={{
                padding: '0.875rem 2rem',
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: '1rem',
                fontWeight: 900,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              🔄 আবার চেষ্টা করুন
            </button>
            <button
              onClick={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
              style={{
                padding: '0.875rem 2rem',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '1rem',
                fontWeight: 900,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              🏠 হোম পেজে যান
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
