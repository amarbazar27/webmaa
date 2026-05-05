'use client';
import { MessageCircle } from 'lucide-react';

/**
 * MessengerButton — Floating chat button in storefront footer
 * Props: link (string) — full Messenger/WhatsApp URL
 */
export default function MessengerButton({ shop }) {
  const link = shop?.socialLinks?.messenger || shop?.socialLinks?.whatsapp || '';
  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:scale-110 hover:shadow-[0_6px_30px_rgba(59,130,246,0.5)] active:scale-95 transition-all duration-300 group"
      title="মেসেজ পাঠান"
    >
      <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
      
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping pointer-events-none" />
      
      {/* Label tooltip */}
      <span className="absolute right-16 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg uppercase tracking-widest">
        চ্যাট করুন
      </span>
    </a>
  );
}
