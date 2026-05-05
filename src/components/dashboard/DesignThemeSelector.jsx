'use client';
import { useState, useEffect } from 'react';
import { Palette, Check, Loader2, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/auth';
import toast from 'react-hot-toast';

const PRESET_ORDER = ['classic','midnight','forest','sunset','ocean','rose','minimal','royal','earth','neon'];

export default function DesignThemeSelector({ shopId }) {
  const { user } = useAuth();
  const [presets, setPresets] = useState({});
  const [activePreset, setActivePreset] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [previewPreset, setPreviewPreset] = useState(null);

  useEffect(() => {
    if (!shopId) return;
    fetch(`/api/design?shopId=${shopId}`)
      .then(r => r.json())
      .then(data => {
        setPresets(data.presets || {});
        setActivePreset(data.activePreset || 'classic');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shopId]);

  const applyTheme = async (key) => {
    if (!user || applying) return;
    setApplying(key);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shopId, preset: key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActivePreset(key);
      setPreviewPreset(null);
      toast.success(`${presets[key]?.namebn || key} থিম প্রয়োগ হয়েছে! ✨`);
    } catch (err) {
      toast.error(err.message || 'থিম পরিবর্তন ব্যর্থ');
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 size={20} className="animate-spin mx-auto text-slate-300" />
      </div>
    );
  }

  const displayPreset = previewPreset || activePreset;
  const displayTheme = presets[displayPreset] || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
          <Palette size={22} />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">স্টোর ডিজাইন</h3>
          <p className="text-xs font-bold text-slate-400">10টি প্রিমিয়াম থিম থেকে বেছে নিন</p>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-lg">
        <div style={{ background: displayTheme.headerBg, color: displayTheme.headerText, padding: '20px 24px' }}>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Live Preview</p>
          <h4 className="text-xl font-black mt-1">{displayTheme.namebn || displayTheme.name}</h4>
        </div>
        <div style={{ background: displayTheme.bg, color: displayTheme.text, padding: '20px 24px' }}>
          <div style={{ background: displayTheme.card, border: `1px solid ${displayTheme.border}`, borderRadius: displayTheme.radius, padding: '16px' }}>
            <p style={{ fontFamily: displayTheme.font, fontSize: '14px', fontWeight: 700 }}>পণ্যের নমুনা কার্ড</p>
            <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>এটি আপনার স্টোরে কেমন দেখাবে তার প্রিভিউ</p>
            <div className="mt-3 flex gap-2">
              <span style={{ background: displayTheme.primary, color: '#fff', padding: '6px 16px', borderRadius: displayTheme.radius, fontSize: '11px', fontWeight: 900 }}>কার্টে যোগ করুন</span>
              <span style={{ border: `1px solid ${displayTheme.border}`, padding: '6px 16px', borderRadius: displayTheme.radius, fontSize: '11px', fontWeight: 700 }}>বিস্তারিত</span>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {PRESET_ORDER.map(key => {
          const theme = presets[key];
          if (!theme) return null;
          const isActive = activePreset === key;
          const isPreviewing = previewPreset === key;

          return (
            <div
              key={key}
              className={`relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-lg ${
                isActive ? 'border-purple-500 ring-2 ring-purple-200 shadow-md' : isPreviewing ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
              }`}
              onMouseEnter={() => setPreviewPreset(key)}
              onMouseLeave={() => setPreviewPreset(null)}
              onClick={() => applyTheme(key)}
            >
              {/* Color Swatch */}
              <div className="h-14" style={{ background: theme.headerBg }} />
              <div className="p-3" style={{ background: theme.bg }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-4 h-4 rounded-full border" style={{ background: theme.primary }} />
                  <div className="w-3 h-3 rounded-full border" style={{ background: theme.accent }} />
                </div>
                <p className="text-[10px] font-black" style={{ color: theme.text }}>{theme.namebn}</p>
                <p className="text-[8px] font-bold opacity-40" style={{ color: theme.text }}>{theme.name}</p>
              </div>

              {/* Active Badge */}
              {isActive && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
              )}

              {/* Applying Spinner */}
              {applying === key && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 size={20} className="animate-spin text-purple-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-bold text-slate-400 text-center">
        <Eye size={10} className="inline mr-1" /> মাউস হোভার করলে লাইভ প্রিভিউ দেখা যাবে। ক্লিক করলে থিম সেভ হবে।
      </p>
    </div>
  );
}
