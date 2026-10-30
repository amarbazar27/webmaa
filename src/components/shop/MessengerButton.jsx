'use client';
import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

/**
 * MessengerButton — Multi-channel Floating Contact Button in storefront
 * Connects directly to merchant's WhatsApp (+880...) or Facebook Page / Messenger.
 */
export default function MessengerButton({ shop }) {
  const [isOpen, setIsOpen] = useState(false);

  // 1. Resolve WhatsApp Number
  let rawWa = shop?.socialLinks?.wa || 
              shop?.socialLinks?.whatsapp || 
              shop?.deliveryConfig?.contactWhatsapp || 
              '';
  if (rawWa.toLowerCase().includes('no contact') || rawWa.toLowerCase().includes('registered')) {
    rawWa = '';
  }

  let waLink = '';
  if (rawWa) {
    const cleanNum = rawWa.replace(/[^0-9]/g, '');
    if (cleanNum.length >= 10) {
      const withCountry = cleanNum.startsWith('88') ? cleanNum : `88${cleanNum}`;
      waLink = `https://wa.me/${withCountry}`;
    } else if (rawWa.includes('wa.me')) {
      waLink = rawWa;
    }
  }

  // 2. Resolve Facebook Page / Messenger
  let rawFb = shop?.socialLinks?.fb || 
              shop?.socialLinks?.facebook || 
              shop?.socialLinks?.messenger || 
              '';
  if (rawFb.toLowerCase().includes('yourpage') || rawFb.toLowerCase().includes('no contact')) {
    rawFb = '';
  }

  let fbLink = '';
  if (rawFb) {
    if (rawFb.includes('m.me/')) {
      fbLink = rawFb.startsWith('http') ? rawFb : `https://${rawFb}`;
    } else if (rawFb.includes('facebook.com/')) {
      // Extract page slug for direct Messenger chat
      const match = rawFb.match(/facebook\.com\/([a-zA-Z0-9._-]+)/);
      if (match && match[1] && !['profile.php', 'groups', 'pages'].includes(match[1])) {
        fbLink = `https://m.me/${match[1]}`;
      } else {
        fbLink = rawFb.startsWith('http') ? rawFb : `https://${rawFb}`;
      }
    } else {
      fbLink = `https://m.me/${rawFb.replace('@', '')}`;
    }
  }

  // 3. Fallback if merchant hasn't configured either
  const hasBoth = !!(waLink && fbLink);
  const primaryLink = waLink || fbLink || 'https://wa.me/8801734763306';

  // If only 1 channel or fallback, open directly on single click
  if (!hasBoth) {
    return (
      <a
        href={primaryLink}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:scale-110 hover:shadow-[0_6px_30px_rgba(59,130,246,0.5)] active:scale-95 transition-all duration-300 group cursor-pointer"
        title="যোগাযোগ করুন (WhatsApp / Messenger)"
      >
        <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
        
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping pointer-events-none" />
        
        {/* Label tooltip */}
        <span className="absolute right-16 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          {waLink ? 'হোয়াটসঅ্যাপে চ্যাট' : 'মেসেঞ্জারে চ্যাট'}
        </span>
      </a>
    );
  }

  // When both channels are active, toggle quick-select menu
  return (
    <div className="relative z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2.5 flex flex-col gap-2 animate-slide-in">
          <div className="text-[11px] font-black text-slate-800 px-2 pt-1 flex items-center justify-between">
            <span>সরাসরি যোগাযোগ করুন</span>
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X size={13} />
            </button>
          </div>
          
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all font-bold text-xs"
          >
            <span className="text-base">💬</span>
            <div className="text-left">
              <span className="block font-black text-xs leading-none">WhatsApp</span>
              <span className="text-[9px] text-emerald-600">হোয়াটসঅ্যাপে দ্রুত উত্তর</span>
            </div>
          </a>

          <a
            href={fbLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 transition-all font-bold text-xs"
          >
            <span className="text-base">⚡</span>
            <div className="text-left">
              <span className="block font-black text-xs leading-none">Messenger</span>
              <span className="text-[9px] text-blue-600">ফেসবুক মেসেঞ্জারে চ্যাট</span>
            </div>
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:scale-110 hover:shadow-[0_6px_30px_rgba(59,130,246,0.5)] active:scale-95 transition-all duration-300 group cursor-pointer"
        title="মেসেজ পাঠান"
      >
        <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping pointer-events-none" />
      </button>
    </div>
  );
}
