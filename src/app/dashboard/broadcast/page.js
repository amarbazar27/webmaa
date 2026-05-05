'use client';

import { useAuth } from '@/context/AuthContext';
import BroadcastPanel from '@/components/dashboard/BroadcastPanel';
import { Card } from '@/components/ui';
import { MailOpen } from 'lucide-react';

export default function BroadcastPage() {
  const { activeShopId } = useAuth();

  if (!activeShopId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-in pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <MailOpen className="text-blue-600" size={32} />
          ইমেইল ব্রডকাস্ট
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          আপনার গ্রাহকদের নতুন অফার, প্রমোশন বা নোটিশ পাঠান।
        </p>
      </div>

      <Card className="border-t-4 border-t-blue-600 shadow-xl bg-white">
        <BroadcastPanel shopId={activeShopId} />
      </Card>
    </div>
  );
}
