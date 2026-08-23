'use client';
import { Truck, ShieldCheck, RefreshCw, PhoneCall, Award, HeartHandshake } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

const ICON_MAP = {
  truck: Truck,
  shield: ShieldCheck,
  refresh: RefreshCw,
  phone: PhoneCall,
  award: Award,
  heart: HeartHandshake,
};

export default function TrustStrip({ data, themeVars }) {
  const d = resolveSectionData('trust_strip', data);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const items = d.items || [];

  if (!items.length) return null;

  return (
    <div className="px-4 py-6 md:py-8 max-w-[1400px] mx-auto">
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item, idx) => {
            const Icon = ICON_MAP[item.icon] || ShieldCheck;
            return (
              <div key={idx} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: `${primary}15`, color: primary }}
                >
                  <Icon size={22} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
