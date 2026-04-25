'use client';
import { Loader2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LoadingScreen({ text }) {
  const [activeText, setActiveText] = useState("SubhanAllah");
  const messages = ["SubhanAllah", "Alhamdulillah", "Allahu Akbar"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#030014]">
      {/* ── Background Ambience ── */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-700" />
      
      {/* ── Central Animation ── */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-20 animate-ping" />
        <div className="relative w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl">
          <Loader2 className="animate-spin text-white" size={32} strokeWidth={2.5} />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg animate-bounce">
          <Sparkles size={14} className="text-white" />
        </div>
      </div>

      {/* ── Text Logic ── */}
      <div className="text-center">
        <p className="text-2xl font-black tracking-tighter text-white animate-fade-in key={index}">
          {messages[index]}
        </p>
        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
          {text || "Optimizing Experience"}
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
