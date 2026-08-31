import { getShopServer } from '@/lib/server-fetch';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { shopSlug } = await params;
  const shop = await getShopServer(shopSlug);
  if (!shop) return { title: 'Terms of Service' };
  return {
    title: `Terms of Service | ${shop.shopName}`,
    description: `Official Terms and Conditions of service for ${shop.shopName}.`,
    robots: { index: true, follow: true }
  };
}

export default async function ShopTermsPage({ params }) {
  const { shopSlug } = await params;
  const shop = await getShopServer(shopSlug);
  if (!shop) { notFound(); }

  // Email
  const rawEmail = shop.deliveryConfig?.contactEmail || shop.ownerEmail || '';
  const hasEmailPlaceholder = rawEmail.toLowerCase().includes('no contact') || rawEmail.toLowerCase().includes('registered') || rawEmail.toLowerCase().includes('endpoint');
  const email = hasEmailPlaceholder ? 'bdretailers26@gmail.com' : rawEmail || 'bdretailers26@gmail.com';

  // Phone
  const rawWa = shop.deliveryConfig?.contactWhatsapp || shop.socialLinks?.wa || shop.socialLinks?.whatsapp || '';
  const hasWaPlaceholder = rawWa.toLowerCase().includes('no contact') || rawWa.toLowerCase().includes('registered') || rawWa.toLowerCase().includes('endpoint');
  const finalWa = hasWaPlaceholder ? '' : rawWa || '';
  const cleanWa = finalWa.replace(/[^0-9]/g, '');
  const phone = cleanWa ? (cleanWa.startsWith('880') ? `+${cleanWa}` : `+880${cleanWa.replace(/^0/, '')}`) : (shop.phone || 'N/A');

  const primaryColor = shop.primaryColor || '#7c3aed';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #faf5ff 100%)', color: '#1e1b4b', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 24px rgba(99,102,241,0.08)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href={`/shop/${shopSlug}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            {shop.logoUrl ? (
              <img src={shop.logoUrl} style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid rgba(99,102,241,0.2)', boxShadow: '0 2px 8px rgba(99,102,241,0.12)' }} alt="Logo" />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${primaryColor}, #4f46e5)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px' }}>{shop.shopName?.[0]}</div>
            )}
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#1e1b4b' }}>{shop.shopName}</span>
          </Link>
          <Link href={`/shop/${shopSlug}`} style={{ fontSize: '12px', fontWeight: 800, color: primaryColor, textDecoration: 'none', border: `1.5px solid ${primaryColor}30`, borderRadius: '20px', padding: '8px 18px', background: `${primaryColor}08`, letterSpacing: '0.04em' }}>
            ← স্টোরে ফিরুন
          </Link>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: '860px', margin: '0 auto', padding: '48px 24px', width: '100%' }}>
        {/* Title Card */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '36px 40px', marginBottom: '24px', boxShadow: '0 4px 40px rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.1)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${primaryColor}10`, border: `1px solid ${primaryColor}25`, borderRadius: '20px', padding: '6px 14px', marginBottom: '16px' }}>
            <span style={{ fontSize: '16px' }}>⚖️</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: primaryColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>শর্তাবলী</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.2 }}>Terms of Service</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, margin: 0 }}>Last Updated: {new Date().toLocaleDateString('en-GB')} · {shop.shopName}</p>
        </div>

        {/* Content Card */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '36px 40px', boxShadow: '0 4px 40px rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.08)' }}>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.8, margin: '0 0 8px', fontWeight: 500 }}>
            Welcome to <strong style={{ color: '#1e1b4b' }}>{shop.shopName}</strong>. By accessing our website, app, or placing orders, you agree to comply with and be bound by the following terms and conditions.
          </p>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.8, margin: '0 0 28px', fontStyle: 'italic', background: '#f8faff', padding: '16px', borderRadius: '12px', border: '1px solid #e0e7ff' }}>
            <strong>{shop.shopName}</strong>-এ আপনাকে স্বাগতম। আমাদের সার্ভিস বা অ্যাপ ব্যবহার করে পণ্য ক্রয়ের মাধ্যমে আপনি নিচের শর্তাবলীর সাথে সম্মতি প্রকাশ করছেন।
          </p>

          {/* Sections */}
          {[
            {
              num: '1',
              en: 'Ordering & Pricing (অর্ডার ও মূল্য নির্ধারণ)',
              content: (
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.7 }}>
                  <p style={{ margin: '0 0 8px' }}>All product orders are subject to availability. We make every effort to display accurate product details, descriptions, and pricing. In case of unexpected price changes or inventory shortages, we will notify you before order confirmation.</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>পণ্যের বিবরণ ও মূল্য যথাসম্ভব নির্ভুলভাবে প্রদর্শিত হয়। স্টক বা মূল্যে পরিবর্তন হলে অর্ডার কনফার্মেশনের পূর্বে গ্রাহককে জানানো হবে।</p>
                </div>
              )
            },
            {
              num: '2',
              en: 'Delivery & Shipping (ডেলিভারি নীতিমালা)',
              content: (
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.7 }}>
                  <p style={{ margin: '0 0 8px' }}>We deliver orders across Bangladesh using reliable courier services. Delivery timeframes depend on your location and standard transit times. Cash on Delivery (COD) and advance digital payments are accepted.</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>সমগ্র বাংলাদেশে কুরিয়ার সার্ভিসের মাধ্যমে নিরাপদ হোম ডেলিভারি প্রদান করা হয়।</p>
                </div>
              )
            },
            {
              num: '3',
              en: 'Return & Exchange Policy (রিটার্ন ও পরিবর্তন)',
              content: (
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.7 }}>
                  <p style={{ margin: '0 0 8px' }}>If you receive a defective or incorrect item, please notify us within 24 to 48 hours of delivery. We will arrange a replacement or refund according to standard store policy.</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>ভুল বা ত্রুটিপূর্ণ পণ্য পেলে ডেলিভারির ২৪-৪৮ ঘণ্টার মধ্যে আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন।</p>
                </div>
              )
            },
            {
              num: '4',
              en: 'User Responsibilities (গ্রাহকের দায়িত্ব)',
              content: (
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.7 }}>
                  <p style={{ margin: 0 }}>You agree to provide accurate delivery details and refrain from unauthorized misuse of the platform.</p>
                </div>
              )
            }
          ].map((sec) => (
            <div key={sec.num} style={{ marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 900, color: '#0f172a', margin: '0 0 12px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${primaryColor}15`, color: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px', flexShrink: 0 }}>{sec.num}</span>
                {sec.en}
              </h2>
              {sec.content}
            </div>
          ))}

          {/* Contact Box */}
          <div style={{ background: 'linear-gradient(135deg, #f8faff, #f0f4ff)', borderRadius: '16px', padding: '24px', border: '1px solid #e0e7ff' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📞</span> 5. Contact Information (যোগাযোগ)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {[
                { icon: '🏪', label: 'Shop', value: shop.shopName },
                { icon: '📧', label: 'Email', value: email, href: `mailto:${email}` },
                { icon: '📞', label: 'Phone', value: phone },
                { icon: '🌐', label: 'Platform', value: 'bdretailers.com', href: 'https://bdretailers.com' },
              ].map(item => (
                <div key={item.label} style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(99,102,241,0.1)', boxShadow: '0 1px 4px rgba(99,102,241,0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.icon} {item.label}</div>
                  {item.href ? (
                    <a href={item.href} style={{ fontSize: '13px', fontWeight: 700, color: primaryColor, textDecoration: 'none', wordBreak: 'break-all' }}>{item.value}</a>
                  ) : (
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e1b4b' }}>{item.value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(99,102,241,0.1)', background: '#fff', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, margin: 0 }}>
          © {new Date().getFullYear()} <strong style={{ color: '#475569' }}>{shop.shopName}</strong>. All Rights Reserved. · Powered by <a href="https://bdretailers.com" style={{ color: primaryColor, fontWeight: 700, textDecoration: 'none' }}>bdretailers.com</a>
        </p>
      </footer>
    </div>
  );
}
