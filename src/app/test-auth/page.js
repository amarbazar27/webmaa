'use client';

import { useState, useEffect } from 'react';
import { app, db } from '@/lib/firebase';
import { auth } from '@/lib/auth';

export default function TestAuthPage() {
  const [config, setConfig] = useState({});
  const [status, setStatus] = useState('Checking...');
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // 🕵️ Get active config from the running app instance
      const activeConfig = app.options;
      setConfig({
        apiKey: activeConfig.apiKey ? `${activeConfig.apiKey.substring(0, 8)}...` : 'MISSING',
        authDomain: activeConfig.authDomain || 'MISSING',
        projectId: activeConfig.projectId || 'MISSING',
        appId: activeConfig.appId ? `...${activeConfig.appId.substring(activeConfig.appId.length - 8)}` : 'MISSING',
        buildHash: 'fa8bb29-nuclear' // Nuclear debug version
      });

      // 🔌 Check connection state
      if (auth) {
        setStatus('Firebase Auth Initialized ✅');
      } else {
        setStatus('Firebase Auth Failed to Init ❌');
      }
    } catch (err) {
      setError(err.message);
      setStatus('Crash 💥');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#030014] text-white p-10 font-mono">
      <h1 className="text-3xl font-black mb-6 text-purple-500">System Diagnostic: Auth Protocol</h1>
      
      <div className="grid gap-6 max-w-2xl">
        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 ring-1 ring-purple-500/20">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Operational Status</p>
          <p className="text-xl font-bold">{status}</p>
          {error && <p className="text-red-400 mt-2">Error: {error}</p>}
        </div>

        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-4">Active Configuration (Masked)</p>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/60">Project ID:</span>
              <span className="font-bold text-cyan-400">{config.projectId}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/60">Build Hash:</span>
              <span className="font-bold text-green-400 tracking-widest uppercase">{config.buildHash}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/60">Auth Domain:</span>
              <span className="font-bold text-cyan-400">{config.authDomain}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/60">API Key Starts:</span>
              <span className="font-bold text-amber-400">{config.apiKey}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">App ID Ends:</span>
              <span className="font-bold">{config.appId}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
          <h3 className="text-yellow-500 font-bold mb-2 uppercase text-xs tracking-widest">Next Action</h3>
          <p className="text-sm leading-relaxed text-yellow-200/80">
            Compare the <span className="font-black">Project ID</span> and <span className="font-black">Auth Domain</span> 
            shown above with your Firebase Console URL. If they don't match exactly, the auth will fail with 
            "Requested action is invalid".
          </p>
        </div>
      </div>

      <div className="mt-12">
        <button 
          onClick={() => window.location.href = '/login'}
          className="px-8 py-3 bg-white text-black font-black rounded-full hover:scale-105 transition-transform"
        >
          Return to Portal
        </button>
      </div>
    </div>
  );
}
