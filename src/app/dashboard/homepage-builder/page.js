'use client';
import { Suspense } from 'react';
import HomepageBuilder from '@/components/dashboard/HomepageBuilder/HomepageBuilder';
import { Loader2 } from 'lucide-react';

export default function HomepageBuilderPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-100">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">হোমপেজ বিল্ডার লোড হচ্ছে...</p>
        </div>
      }
    >
      <HomepageBuilder />
    </Suspense>
  );
}
