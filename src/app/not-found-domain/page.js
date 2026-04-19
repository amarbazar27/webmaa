'use client';

/**
 * not-found-domain/page.js
 *
 * কাস্টম ডোমেইন Firestore-এ না পেলে এই পেজ দেখাবে।
 * Vercel-এর ডিফল্ট 404 দেখাবে না।
 * 'use client' — hover animation এর জন্য দরকার।
 */

import { useState } from 'react';

export default function DomainNotFound() {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#fff',
      textAlign: 'center',
      padding: '2rem',
    }}>
      {/* Animated glowing orb */}
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(59,130,246,0.3) 60%, transparent 100%)',
        boxShadow: '0 0 60px rgba(139,92,246,0.5)',
        marginBottom: '2.5rem',
        animation: 'pulse 2s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
      }}>
        🏪
      </div>

      <h1 style={{
        fontSize: 'clamp(1.8rem, 5vw, 3rem)',
        fontWeight: '700',
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        স্টোর পাওয়া যায়নি
      </h1>

      <p style={{
        fontSize: '1.1rem',
        color: 'rgba(255,255,255,0.65)',
        maxWidth: '420px',
        lineHeight: 1.75,
        marginBottom: '2.5rem',
      }}>
        এই ডোমেইনে কোনো Webmaa স্টোর সংযুক্ত নেই।<br />
        আপনার স্টোরের ঠিকানা সঠিক কিনা যাচাই করুন।
      </p>

      <a
        href="https://webmaa.vercel.app"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.85rem 2rem',
          borderRadius: '50px',
          background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
          color: '#fff',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '1rem',
          boxShadow: hovered
            ? '0 8px 32px rgba(124,58,237,0.55)'
            : '0 4px 24px rgba(124,58,237,0.4)',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
      >
        🏠 Webmaa-তে যান
      </a>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
