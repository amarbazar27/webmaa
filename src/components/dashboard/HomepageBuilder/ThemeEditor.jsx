'use client';
import { useState } from 'react';
import { Upload, Palette } from 'lucide-react';

const FONTS = [
  'Hind Siliguri',
  'Noto Sans Bengali',
  'Kalpurush',
  'SolaimanLipi',
  'Inter',
  'Poppins',
];

const PRESET_COLORS = [
  { label: 'Purple', value: '#6D28D9' },
  { label: 'Rose', value: '#E11D48' },
  { label: 'Pink', value: '#DB2777' },
  { label: 'Blue', value: '#2563EB' },
  { label: 'Teal', value: '#0D9488' },
  { label: 'Green', value: '#059669' },
  { label: 'Amber', value: '#D97706' },
  { label: 'Slate', value: '#475569' },
];

export default function ThemeEditor({ theme, onChange, shop }) {
  const update = (key, val) => onChange({ ...theme, [key]: val });

  return (
    <div className="p-4 space-y-6">
      {/* Primary Color */}
      <div>
        <label className="text-xs font-black text-slate-700 block mb-3">Primary Color</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => update('primaryColor', c.value)}
              title={c.label}
              className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                theme.primaryColor === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
              }`}
              style={{ background: c.value }}
            />
          ))}
        </div>
        {/* Custom color picker */}
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={theme.primaryColor || '#6D28D9'}
            onChange={e => update('primaryColor', e.target.value)}
            className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={theme.primaryColor || ''}
            onChange={e => update('primaryColor', e.target.value)}
            placeholder="#6D28D9"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        {/* Preview */}
        <div className="mt-3 p-3 rounded-xl flex items-center justify-center" style={{ background: theme.primaryColor + '15' }}>
          <button className="px-4 py-2 rounded-full text-white text-xs font-black" style={{ background: theme.primaryColor }}>
            এখনই কিনুন →
          </button>
        </div>
      </div>

      {/* Font */}
      <div>
        <label className="text-xs font-black text-slate-700 block mb-3">Font Family</label>
        <div className="grid grid-cols-1 gap-2">
          {FONTS.map(font => (
            <button
              key={font}
              onClick={() => update('font', font)}
              className={`px-3 py-2.5 rounded-xl border text-left text-xs transition-all ${
                theme.font === font
                  ? 'border-purple-300 bg-purple-50 text-purple-800 font-black'
                  : 'border-slate-200 bg-white text-slate-600 font-bold hover:border-purple-200 hover:bg-purple-50/50'
              }`}
              style={{ fontFamily: font }}
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="text-xs font-black text-slate-700 block mb-3">ভাষা (Language)</label>
        <div className="flex gap-2">
          {[{ val: 'bn', label: 'বাংলা 🇧🇩' }, { val: 'en', label: 'English 🌐' }].map(l => (
            <button
              key={l.val}
              onClick={() => update('language', l.val)}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition-all ${
                theme.language === l.val
                  ? 'border-purple-300 bg-purple-50 text-purple-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
