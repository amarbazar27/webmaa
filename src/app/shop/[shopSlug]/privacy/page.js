import { getShopServer } from '@/lib/server-fetch';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { shopSlug } = await params;
  const shop = await getShopServer(shopSlug);
  if (!shop) return { title: 'Privacy Policy' };
  return {
    title: `Privacy Policy | ${shop.shopName}`,
    description: `Official Privacy Policy for ${shop.shopName}. Learn how we protect and manage your data.`,
    robots: { index: true, follow: true }
  };
}

export default async function ShopPrivacyPage({ params }) {
  const { shopSlug } = await params;
  const shop = await getShopServer(shopSlug);
  if (!shop) { notFound(); }

  // Email — same logic as footer
  const rawEmail = shop.deliveryConfig?.contactEmail || shop.ownerEmail || '';
  const hasEmailPlaceholder = rawEmail.toLowerCase().includes('no contact') || rawEmail.toLowerCase().includes('registered') || rawEmail.toLowerCase().includes('endpoint');
  const email = hasEmailPlaceholder ? 'bdretailers26@gmail.com' : rawEmail || 'bdretailers26@gmail.com';

  // Phone — use WhatsApp number (same as footer), properly formatted
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
            <span style={{ fontSize: '16px' }}>🔒</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: primaryColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>গোপনীয়তা নীতি</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.2 }}>Privacy Policy</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, margin: 0 }}>Last Updated: {new Date().toLocaleDateString('en-GB')} · {shop.shopName}</p>
        </div>

        {/* Content Card */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '36px 40px', boxShadow: '0 4px 40px rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.08)' }}>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.8, margin: '0 0 8px', fontWeight: 500 }}>
            Welcome to <strong style={{ color: '#1e1b4b' }}>{shop.shopName}</strong>. We value your privacy and are committed to protecting your personal data. This Privacy Policy describes how we collect, use, and share your information when you visit our website or make purchases from our online store.
          </p>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.8, margin: '0 0 28px', fontStyle: 'italic', background: '#f8faff', padding: '16px', borderRadius: '12px', border: '1px solid #e0e7ff' }}>
            <strong>{shop.shopName}</strong>-এ আপনাকে স্বাগতম। আমরা আপনার গোপনীয়তাকে অত্যন্ত গুরুত্ব সহকারে বিবেচনা করি। আমাদের ওয়েবসাইট বা অ্যাপ ব্যবহার করার সময় আমরা কীভাবে আপনার তথ্য সংগ্রহ ও সুরক্ষিত রাখি তা এই নীতিমালায় ব্যাখ্যা করা হয়েছে।
          </p>

          {/* Section */}
          {[
            {
              num: '1',
              en: 'Information We Collect (আমরা যে তথ্য সংগ্রহ করি)',
              content: (
                <div>
                  <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px' }}>When you make a purchase or place an order through the store, we collect certain personal information including:</p>
                  <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#475569', fontSize: '14px', lineHeight: 2 }}>
                    <li>Name (নাম)</li>
                    <li>Delivery Address (ডেলিভারি ঠিকানা)</li>
                    <li>Phone Number (মোবাইল নম্বর)</li>
                    <li>Email Address (ইমেইল ঠিকানা)</li>
                    <li>Order History and Preferences (অর্ডারের বিবরণ)</li>
                  </ul>
                </div>
              )
            },
            {
              num: '2',
              en: 'How We Use Your Information (তথ্য ব্যবহারের উদ্দেশ্য)',
              content: (
                <div>
                  <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px' }}>We use your information to fulfill your orders and improve our service:</p>
                  <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#475569', fontSize: '14px', lineHeight: 2 }}>
                    <li>Processing transactions and payments (পেমেন্ট ও অর্ডার প্রসেসিং)</li>
                    <li>Arranging delivery and shipment (হোম ডেলিভারি নিশ্চিতকরণ)</li>
                    <li>Providing customer support and order updates</li>
                    <li>Preventing fraud and ensuring platform security</li>
                  </ul>
                </div>
              )
            },
            {
              num: '3',
              en: 'Sharing Your Information (তথ্য শেয়ারিং নীতি)',
              content: (
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.8 }}>
                  <p style={{ margin: '0 0 8px' }}>We only share your personal data with third-party partners who help process deliveries and payments (e.g., courier services, payment gateways). We do <strong style={{ color: '#1e1b4b' }}>NOT</strong> sell or lease your personal information to third parties for marketing purposes.</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>আমরা আপনার ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষের কাছে বিজ্ঞাপনের উদ্দেশ্যে বিক্রি করি না।</p>
                </div>
              )
            },
            {
              num: '4',
              en: 'Data Security (তথ্য নিরাপত্তা)',
              content: <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.8, margin: 0 }}>We implement industry-standard security measures, including SSL encryption and secure databases, to maintain the safety of your personal information when you place an order.</p>
            },
            {
              num: '5',
              en: 'Data Deletion Requests (তথ্য মুছে ফেলার অনুরোধ)',
              content: (
                <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.8 }}>
                  <p style={{ margin: '0 0 8px' }}>Under the Google Play Developer Policy, you have the right to request deletion of your account and personal data. Contact us at <a href={`mailto:${email}`} style={{ color: primaryColor, fontWeight: 700 }}>{email}</a> or call <strong style={{ color: '#1e1b4b' }}>{phone}</strong>. We will process your request within 7 business days.</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>গুগল প্লে স্টোর পলিসি অনুযায়ী আপনি যেকোনো সময় আপনার অ্যাকাউন্ট ও সমস্ত ব্যক্তিগত তথ্য মুছে ফেলার অনুরোধ করতে পারেন।</p>
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
              <span style={{ fontSize: '18px' }}>📞</span> 6. Contact Us (যোগাযোগ)
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
