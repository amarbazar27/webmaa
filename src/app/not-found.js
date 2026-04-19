/**
 * not-found.js — Global Custom 404 Page
 *
 * Next.js App Router-এর global not-found।
 * Vercel-এর ডিফল্ট 404 এর বদলে এটি দেখাবে।
 * notFound() call করলে বা কোনো route match না হলে এটি render হয়।
 */

import Link from 'next/link';

export const metadata = {
  title: 'পেজ পাওয়া যায়নি | Webmaa',
  description: 'আপনি যে পেজটি খুঁজছেন তা পাওয়া যায়নি।',
};

export default function NotFound() {
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
      <div style={{
        fontSize: 'clamp(5rem, 15vw, 10rem)',
        fontWeight: '900',
        lineHeight: 1,
        background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '1rem',
        animation: 'float 3s ease-in-out infinite',
      }}>
        404
      </div>

      <h1 style={{
        fontSize: 'clamp(1.4rem, 4vw, 2rem)',
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: '1rem',
      }}>
        পেজ পাওয়া যায়নি
      </h1>

      <p style={{
        color: 'rgba(255,255,255,0.55)',
        fontSize: '1rem',
        maxWidth: '380px',
        lineHeight: 1.8,
        marginBottom: '2.5rem',
      }}>
        আপনি যে ঠিকানায় যেতে চেয়েছিলেন সেটি হয়তো মুছে গেছে, নামে পরিবর্তন এসেছে, অথবা কখনো ছিলই না।
      </p>

      <Link
        href="/"
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
          boxShadow: '0 4px 24px rgba(124,58,237,0.4)',
        }}
      >
        ← হোমে ফিরে যান
      </Link>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
