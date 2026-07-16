import { getShopServer } from '@/lib/server-fetch';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 600; // Cache for 10 minutes

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

  if (!shop) {
    notFound();
  }

  const email = shop.deliveryConfig?.contactEmail?.split(',')[0]?.trim() || shop.ownerEmail || 'support@bdretailers.com';
  const phone = shop.deliveryConfig?.contactPhone || shop.phone || '+8801700000000';

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-900 bg-[#060814]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/shop/${shopSlug}`} className="flex items-center gap-3 group">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} className="w-8 h-8 rounded-lg object-cover border border-purple-500/20" alt="Logo" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm">
                {shop.shopName?.[0]}
              </div>
            )}
            <span className="font-black text-slate-200 group-hover:text-purple-400 transition-colors text-sm">{shop.shopName}</span>
          </Link>
          <Link href={`/shop/${shopSlug}`} className="text-xs font-black uppercase tracking-wider text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 rounded-xl px-4 py-2 transition-all">
            Back to Store (স্টোরে ফিরে যান)
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

          <h1 className="text-3xl font-black text-white mb-2 leading-none">Privacy Policy (গোপনীয়তা নীতি)</h1>
          <p className="text-xs font-bold text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString('en-GB')}</p>

          <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-medium">
            <p>
              Welcome to <strong>{shop.shopName}</strong>. We value your privacy and are committed to protecting your personal data. This Privacy Policy describes how we collect, use, and share your information when you visit our website, use our services, or make purchases from our online store.
            </p>
            <p className="text-slate-400 italic">
              <strong>{shop.shopName}</strong>-এ আপনাকে স্বাগতম। আমরা আপনার গোপনীয়তাকে অত্যন্ত গুরুত্ব সহকারে বিবেচনা করি। আমাদের ওয়েবসাইট বা মোবাইল অ্যাপ ব্যবহার করার সময় আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখি তা এই নীতিমালায় বিস্তারিত ব্যাখ্যা করা হয়েছে।
            </p>

            <hr className="border-slate-900 my-6" />

            {/* Section 1 */}
            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full inline-block" />
                1. Information We Collect (আমরা যে তথ্য সংগ্রহ করি)
              </h2>
              <p>
                When you make a purchase or attempt to place an order through the store, we collect certain personal information from you, including:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1 text-slate-400 font-semibold">
                <li>Name (নাম)</li>
                <li>Delivery Address (ডেলিভারি ঠিকানা)</li>
                <li>Phone Number (মোবাইল নম্বর)</li>
                <li>Email Address (ইমেইল ঠিকানা)</li>
                <li>Order History and Preferences (অর্ডারের বিবরণ)</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full inline-block" />
                2. How We Use Your Information (তথ্য ব্যবহারের উদ্দেশ্য)
              </h2>
              <p>
                We use the information we collect to fulfill your orders and improve our service, specifically:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1 text-slate-400 font-semibold">
                <li>Processing transactions and payments (পেমেন্ট ও অর্ডার প্রসেসিং)</li>
                <li>Arranging for delivery and shipment (হোম ডেলিভারি নিশ্চিতকরণ)</li>
                <li>Providing customer support and order updates (অর্ডার আপডেট ও কাস্টমার সাপোর্ট)</li>
                <li>Preventing fraud and ensuring platform security (প্রতারণা রোধ ও নিরাপত্তা নিশ্চিতকরণ)</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full inline-block" />
                3. Sharing Your Information (তথ্য শেয়ারিং নীতি)
              </h2>
              <p>
                We only share your personal data with third-party partners who help us process deliveries and payments, such as shipping couriers and payment gateways. We do <strong>NOT</strong> sell or lease your personal information to third parties for marketing purposes.
              </p>
              <p className="text-slate-400">
                আমরা আপনার ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষের কাছে বিজ্ঞাপনের উদ্দেশ্যে বিক্রি করি না। শুধুমাত্র আপনার অর্ডারকৃত পণ্য আপনার ঠিকানায় পৌঁছে দেওয়া (কুরিয়ার সার্ভিস) এবং পেমেন্ট ভেরিফাই করার জন্য প্রয়োজনীয় তথ্য শেয়ার করা হয়ে থাকে।
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full inline-block" />
                4. Data Security (তথ্য নিরাপত্তা)
              </h2>
              <p>
                We implement a variety of standard security measures, including SSL encryption and secure databases, to maintain the safety of your personal information when you place an order.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full inline-block" />
                5. Data Deletion Requests (তথ্য মুছে ফেলার অনুরোধ)
              </h2>
              <p>
                Under the Google Play Developer Policy, you have the right to request deletion of your account and personal data. If you wish to delete your account or have your collected data removed, please contact us at <strong>{email}</strong> or call <strong>{phone}</strong>. We will process your request within 7 business days.
              </p>
              <p className="text-slate-400">
                গুগল প্লে স্টোর ডেভলপার পলিসি অনুযায়ী আপনি যেকোনো সময় আপনার অ্যাকাউন্ট এবং সমস্ত ব্যক্তিগত তথ্য মুছে ফেলার অনুরোধ করতে পারেন। তথ্য মুছে ফেলতে আমাদের <strong>{email}</strong> ঠিকানায় ইমেইল করুন অথবা কল করুন <strong>{phone}</strong> নম্বরে।
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full inline-block" />
                6. Contact Us (যোগাযোগ)
              </h2>
              <p>
                For any questions or concerns regarding this Privacy Policy, please contact us:
              </p>
              <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-4 space-y-1 font-semibold text-slate-300">
                <p>🏪 Shop: {shop.shopName}</p>
                <p>📧 Email: <a href={`mailto:${email}`} className="text-purple-400 hover:underline">{email}</a></p>
                <p>📞 Phone: {phone}</p>
                <p>🌐 Platform: <a href="https://bdretailers.com" className="text-purple-400 hover:underline">bdretailers.com</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/20 py-8 text-center text-xs font-bold text-slate-600">
        <p>© {new Date().getFullYear()} {shop.shopName}. All Rights Reserved.</p>
        <p className="mt-1">Powered by <a href="https://bdretailers.com" className="hover:text-slate-400 underline">bdretailers.com</a></p>
      </footer>
    </div>
  );
}
