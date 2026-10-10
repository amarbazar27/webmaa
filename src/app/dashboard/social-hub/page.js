'use client';

import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui';
import { MessageCircle } from 'lucide-react';
import SocialHubPanel from '@/components/dashboard/SocialHubPanel';

export default function SocialHubPage() {
  const { activeShopId } = useAuth();

  if (!activeShopId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-in pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <MessageCircle className="text-purple-600" size={32} />
          সোশ্যাল হাব (Social Hub)
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          ফেসবুক, ইন্সটাগ্রাম ও হোয়াটসঅ্যাপ কানেক্ট করুন এবং এক জায়গা থেকে রিপ্লাই দিন।
        </p>
      </div>

      <SocialHubPanel shopId={activeShopId} />
    </div>
  );
}
