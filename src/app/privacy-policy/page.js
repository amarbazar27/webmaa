'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, Mail, ArrowLeft, Bot, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';

export default function PrivacyPolicyPage() {
  const { language, setLanguage, toggleLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white relative">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="text-white/80 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-colors"
            >
              <ArrowLeft size={14} /> {t('হোম পেজে ফিরুন', 'Back to Home')}
            </Link>

            {/* Language Switcher Pill */}
            <LanguageToggle accent="slate" />
          </div>

          <div className="pt-6 flex flex-col items-center text-center">
            <Shield size={48} className="mb-3 text-purple-200" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Privacy Policy</h1>
            <p className="text-xs sm:text-sm text-purple-100 font-medium mt-1">
              {t('প্রাইভেসি পলিসি ও তথ্য সুরক্ষা নির্দেশিকা', 'Privacy Policy & Data Protection Guidelines')}
            </p>
            <div className="mt-4 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-wider uppercase text-purple-200">
              {t('সর্বশেষ আপডেট: জুলাই ২০২৬', 'Last Updated: July 2026')}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-slate-600 font-medium">
          
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-xs font-bold text-purple-900 leading-relaxed">
            {t(
              'বিডি রিটেইলার্স (bdretailers.com) এবং আমাদের মার্চেন্টদের জন্য তৈরি মোবাইল অ্যাপ্লিকেশনসমূহ ব্যবহারে আপনার ব্যক্তিগত তথ্যের গোপনীয়তা এবং নিরাপত্তা নিশ্চিত করতে আমরা প্রতিশ্রুতিবদ্ধ। এই পলিসির মাধ্যমে আমরা কীভাবে তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত করি তা বিস্তারিত জানানো হলো।',
              'BD Retailers (bdretailers.com) and our merchant mobile applications are committed to protecting the privacy and security of your personal data. This policy outlines how we collect, use, and safeguard your information.'
            )}
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 border-b pb-2 border-slate-100">
              <Lock size={16} className="text-purple-600" /> {t('১. সংগৃহীত তথ্যাবলী (Information We Collect)', '1. Information We Collect')}
            </h2>
            <p>{t('আমাদের প্ল্যাটফর্ম এবং অ্যাপ ব্যবহারের সময় নিম্নোক্ত তথ্যাবলী সংগ্রহ করা হতে পারে:', 'During your use of our platform and applications, the following information may be collected:')}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>{t('অ্যাকাউন্ট রেজিস্ট্রি:', 'Account Registry:')}</strong> {t('অ্যাপ এবং ওয়েবসাইটে লগইন করার জন্য Firebase Authentication ব্যবহার করা হয়। এর মাধ্যমে আপনার নাম, ইমেইল অ্যাড্রেস এবং ফোন নম্বর সংগ্রহ করা হয়।', 'Firebase Authentication is used to secure app and web logins, capturing your name, email address, and mobile number.')}
              </li>
              <li>
                <strong>{t('গুগল সাইন-ইন:', 'Google Sign-In:')}</strong> {t('সহজ লগইনের জন্য Google Sign-In ব্যবহার করা হলে আপনার গুগল অ্যাকাউন্টের নাম, ইমেইল এবং প্রোফাইল ছবি Firebase Auth-এ সুরক্ষিতভাবে যুক্ত হয়।', 'When using Google Sign-In, your account name, email, and avatar are securely linked via Firebase Auth.')}
              </li>
              <li>
                <strong>{t('অর্ডার ও ডেলিভারি তথ্য:', 'Order & Delivery Data:')}</strong> {t('আপনি যখন কোনো মার্চেন্ট স্টোর থেকে পণ্য অর্ডার করেন, তখন অর্ডার প্রসেস এবং সফল ডেলিভারির উদ্দেশ্যে আপনার নাম, মোবাইল নম্বর, এবং ঠিকানা সংগ্রহ করা হয়।', 'When placing an order with any merchant store, your name, recipient address, and phone number are gathered to fulfill delivery.')}
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 border-b pb-2 border-slate-100">
              <Eye size={16} className="text-purple-600" /> {t('২. ডিভাইস পারমিশনসমূহ (Device Permissions)', '2. Device Permissions')}
            </h2>
            <p>{t('মোবাইল অ্যাপে একটি সম্পূর্ণ নেটিভ ই-কমার্স অভিজ্ঞতা দেওয়ার জন্য আমরা নিম্নলিখিত ডিভাইস অনুমতিগুলো ব্যবহার করি:', 'To deliver an optimal native mobile e-commerce experience, we utilize the following device permissions:')}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>{t('ক্যামেরা (Camera Permission):', 'Camera Permission:')}</strong> {t('মার্চেন্ট চ্যাটে পেমেন্ট স্ক্রিনশট বা কোনো প্রোডাক্টের ছবি সরাসরি তুলে শেয়ার করার জন্য ক্যামেরা অনুমতি চাওয়া হয়। অনুমতি ছাড়া ক্যামেরা চালু হয় না।', 'Requested only when you capture photos of payment receipts or product queries in chat. The camera is never accessed without user action.')}
              </li>
              <li>
                <strong>{t('ফাইল ও মিডিয়া (File Picker):', 'Files & Media:')}</strong> {t('ফোন গ্যালারি থেকে যেকোনো ছবি বা পেমেন্ট রিসিট আপলোড করার জন্য ফাইল পিকচার ব্যবহার করা হয়। সংগৃহীত ফাইলগুলো নিরাপদ ক্লাউড হোস্টিং Cloudinary-তে স্টোর করা হয়।', 'Enables selecting and uploading photos from device storage. Files are stored on secure Cloudinary servers.')}
              </li>
              <li>
                <strong>{t('পুশ নোটিফিকেশন (Push Notifications):', 'Push Notifications:')}</strong> {t('আপনার অর্ডারের লাইভ স্ট্যাটাস আপডেট, নোটিশ এবং নতুন অফার সংক্রান্ত বার্তা পাঠাতে Firebase Cloud Messaging (FCM) ব্যবহার করা হয়।', 'Firebase Cloud Messaging (FCM) transmits real-time order updates, merchant notices, and promotional offers.')}
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 border-b pb-2 border-slate-100">
              <Shield size={16} className="text-purple-600" /> {t('৩. তথ্যের ব্যবহার ও শেয়ারিং (How We Use & Share Information)', '3. How We Use & Share Information')}
            </h2>
            <p>{t('আমরা গ্রাহকের তথ্য অত্যন্ত গুরুত্ব সহকারে সুরক্ষিত রাখি। তথ্যের ব্যবহার নিম্নরূপ:', 'We hold customer privacy to the highest standard. Information usage is governed by:')}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t('গ্রাহকের ব্যক্তিগত তথ্য কখনোই কোনো তৃতীয় পক্ষের কাছে বিক্রি বা বিপণনের উদ্দেশ্যে শেয়ার করা হয় না।', 'Customer personal information is never sold, leased, or disclosed to third parties for commercial gain.')}</li>
              <li>{t('পেমেন্ট গেটওয়ে (যেমন bKash, SSLCommerz ইত্যাদি) ব্যবহারের সময় গ্রাহক নিজেই তার পেমেন্ট তথ্য প্রদান করেন যা সম্পূর্ণ ইনক্রিপ্টেড এবং সুরক্ষিত থাকে।', 'When completing transactions through bKash, Nagad, or card gateways, data is entered directly into encrypted payment provider interfaces.')}</li>
              <li>{t('মার্চেন্ট স্টোরের ইমেজ ফাইল, লোগো এবং প্রোডাক্টের ছবি নিরাপদ রাখার জন্য ক্লাউড হোস্টিং Cloudinary ব্যবহার করা হয়।', 'Store media assets and product photography are hosted securely via Cloudinary CDN infrastructure.')}</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 border-b pb-2 border-slate-100">
              <Lock size={16} className="text-purple-600" /> {t('৪. কুকিজ ও ট্র্যাকিং (Cookies & Tracking)', '4. Cookies & Tracking')}
            </h2>
            <p>{t('পছন্দের পণ্য কার্ট-এ সেভ রাখা এবং লগইন সেশন সক্রিয় রাখার জন্য ব্রাউজারের LocalStorage এবং Cookies ব্যবহার করা হয়। এছাড়াও প্ল্যাটফর্মের কার্যকারিতা উন্নত করতে সাধারণ ভিজিটর অ্যানালিটিক্স ব্যবহার করা হতে পারে।', 'Browser LocalStorage and secure cookies maintain your shopping cart state and active authentication session. Anonymous analytics assist in optimizing load speed.')}</p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 border-b pb-2 border-slate-100">
              <Shield size={16} className="text-purple-600" /> {t('৫. তথ্য মুছে ফেলা (Data Deletion Policy)', '5. Data Deletion Policy')}
            </h2>
            <p>
              {t(
                'আপনার অ্যাকাউন্ট এবং সংগৃহীত সকল ব্যক্তিগত তথ্য মুছে ফেলতে চাইলে যেকোনো সময় আমাদের সাপোর্ট ইমেইলে যোগাযোগ করতে পারেন অথবা সরাসরি ',
                'If you wish to remove your account and all associated personal data, contact support or visit '
              )}
              <Link href="/account-delete" className="text-purple-600 font-bold underline">/account-delete</Link>
              {t(
                '। অনুরোধ পাওয়ার ৭২ ঘণ্টার মধ্যে আপনার সংশ্লিষ্ট সকল ডাটা আমাদের ফায়ারবেস ডেটাবেস থেকে স্থায়ীভাবে মুছে ফেলা হবে।',
                '. All records will be permanently purged within 72 hours of your verified request.'
              )}
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 bg-slate-50 border border-slate-100 rounded-2xl p-6">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 pb-1">
              <Mail size={16} className="text-purple-600" /> {t('যোগাযোগ (Contact Information)', 'Contact Information')}
            </h2>
            <p className="text-xs text-slate-500 font-bold mb-3">
              {t('আমাদের প্রাইভেসি পলিসি সংক্রান্ত যেকোনো জিজ্ঞাসা বা অনুরোধের জন্য যোগাযোগ করুন:', 'For any questions or data requests regarding this policy, reach us at:')}
            </p>
            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-2 font-bold text-slate-700">
                <Bot size={14} className="text-purple-600" /> 
                {t('ইমেইল:', 'Email:')} <a href="mailto:bdretailers26@gmail.com" className="text-purple-600 hover:underline">bdretailers26@gmail.com</a>
              </p>
              <p className="font-bold text-slate-700">{t('ওয়েবসাইট:', 'Website:')} <a href="https://bdretailers.com" className="text-purple-600 hover:underline">https://bdretailers.com</a></p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
