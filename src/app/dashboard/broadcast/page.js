'use client';

import { useAuth } from '@/context/AuthContext';
import BroadcastPanel from '@/components/dashboard/BroadcastPanel';
import NotificationBox from '@/components/dashboard/NotificationBox';
import { Card } from '@/components/ui';
import { Bell } from 'lucide-react';

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
          <Bell className="text-blue-600" size={32} />
          ব্রডকাস্ট ও পুশ নোটিফিকেশন সেন্টার
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          আপনার অ্যাপ ব্যবহারকারী ও গ্রাহকদের ফোন স্ক্রিনে পুশ নোটিফিকেশন অথবা সরাসরি ইমেইল বার্তা পাঠান।
        </p>
      </div>

      <Card className="border-t-4 border-t-blue-600 shadow-xl bg-white">
        <BroadcastPanel shopId={activeShopId} />
      </Card>

      {/* 🔔 ইন-অ্যাপ নোটিফিকেশন বক্স ও ব্রডকাস্ট হিস্টোরি */}
      <div className="mt-8">
        <NotificationBox senderRole="retailer" shopId={activeShopId} />
      </div>
    </div>
  );
}
