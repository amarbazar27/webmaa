import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
      
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Animated Rings */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-t-purple-500 border-r-transparent border-b-emerald-500 border-l-transparent rounded-full animate-spin [animation-duration:3s]" />
          <div className="absolute inset-2 border-4 border-t-transparent border-r-purple-400 border-b-transparent border-l-emerald-400 rounded-full animate-spin [animation-duration:2s] [animation-direction:reverse]" />
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
        </div>

        {/* Text Animation Sequence */}
        <div className="h-12 relative flex items-center justify-center w-64 overflow-hidden">
          <div className="absolute flex flex-col gap-12 animate-[slideUp_6s_ease-in-out_infinite]">
            <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-lg text-center tracking-wide">SubhanAllah</h2>
            <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 drop-shadow-lg text-center tracking-wide">Alhamdulillah</h2>
            <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 drop-shadow-lg text-center tracking-wide">Allahu Akbar</h2>
            <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-lg text-center tracking-wide">SubhanAllah</h2>
          </div>
        </div>
        
        <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase mt-4 animate-pulse">Loading Store...</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          0%, 25% { transform: translateY(0); opacity: 1; }
          30% { opacity: 0; }
          33.33% { transform: translateY(-3rem); opacity: 0; }
          38%, 58% { transform: translateY(-3rem); opacity: 1; }
          63% { opacity: 0; }
          66.66% { transform: translateY(-6rem); opacity: 0; }
          71%, 91% { transform: translateY(-6rem); opacity: 1; }
          96% { opacity: 0; }
          100% { transform: translateY(-9rem); opacity: 0; }
        }
      `}} />
    </div>
  );
}
