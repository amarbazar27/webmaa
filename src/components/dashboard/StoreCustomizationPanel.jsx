'use client';

import { useState, useCallback, memo } from 'react';
import {
  Sliders, Palette, Type, Layout, LayoutTemplate,
  Eye, Save, Loader2, RotateCcw, ChevronDown, ChevronRight,
  Sun, Moon, Sparkles
} from 'lucide-react';
import { TEMPLATES, getTemplateById } from '@/templates/index';
import toast from 'react-hot-toast';

// ── Color Picker Row ──────────────────────────────────────────
const ColorRow = memo(function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-xs font-bold text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border-2 border-white shadow-md cursor-pointer overflow-hidden">
          <input
            type="color"
            value={value || '#000000'}
            onChange={e => onChange(e.target.value)}
            className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer"
          />
        </div>
        <span className="text-[10px] font-mono text-slate-500 w-16">{value}</span>
      </div>
    </div>
  );
});

// ── Section Item ──────────────────────────────────────────────
const SectionItem = memo(function SectionItem({ section, onToggle }) {
  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-xl border transition-all ${
      section.visible ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${section.visible ? 'bg-purple-500' : 'bg-slate-300'}`} />
        <span className="text-xs font-bold text-slate-800">{section.label}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={section.visible}
          onChange={() => onToggle(section.id)}
        />
        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
      </label>
    </div>
  );
});

// ── Collapsible Section ───────────────────────────────────────
function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-purple-600" />
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{title}</span>
        </div>
        {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
      </button>
      {open && <div className="p-4 space-y-1 bg-white">{children}</div>}
    </div>
  );
}

// ── Font Selector ─────────────────────────────────────────────
const FONT_OPTIONS = [
  { value: 'Inter, sans-serif', label: 'Inter (আধুনিক)' },
  { value: '"Hind Siliguri", sans-serif', label: 'Hind Siliguri (বাংলা)' },
  { value: '"Noto Sans Bengali", sans-serif', label: 'Noto Sans (বাংলা)' },
  { value: '"Playfair Display", serif', label: 'Playfair (লাক্সারি)' },
  { value: '"Cormorant Garamond", serif', label: 'Cormorant (এলিগ্যান্ট)' },
  { value: '"DM Sans", sans-serif', label: 'DM Sans (মিনিমাল)' },
  { value: '"Nunito", sans-serif', label: 'Nunito (ফ্রেন্ডলি)' },
  { value: '"Roboto Mono", monospace', label: 'Roboto Mono (টেক)' },
];

const RADIUS_OPTIONS = [
  { value: '0px', label: 'শার্প' },
  { value: '4px', label: 'সামান্য' },
  { value: '8px', label: 'মাঝারি' },
  { value: '16px', label: 'রাউন্ড' },
  { value: '50px', label: 'পিল' },
];

const SHADOW_OPTIONS = [
  { value: 'none', label: 'নেই' },
  { value: 'sm', label: 'হালকা' },
  { value: 'md', label: 'মাঝারি' },
  { value: 'lg', label: 'গাঢ়' },
  { value: 'xl', label: 'ডিপ' },
];

// ── Main Customization Panel ──────────────────────────────────
export default function StoreCustomizationPanel({ shopId, shopSlug, shopDomain, templateId, currentOverrides = {}, onSave }) {
  const template = getTemplateById(templateId);
  const defaultTheme = template?.defaultTheme || {};

  const [theme, setTheme] = useState({ ...defaultTheme, ...currentOverrides });
  const [sections, setSections] = useState(template?.sections || []);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateTheme = useCallback((key, value) => {
    setTheme(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const toggleSection = useCallback((sectionId) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, visible: !s.visible } : s));
    setHasChanges(true);
  }, []);

  const handleReset = useCallback(() => {
    setTheme({ ...defaultTheme });
    setSections(template?.sections || []);
    setHasChanges(false);
    toast('ডিফল্ট সেটিংসে ফিরে গেছে', { icon: '↩️' });
  }, [defaultTheme, template]);

  const handleSave = useCallback(async () => {
    if (!shopId || saving) return;
    setSaving(true);
    try {
      const { updateShop } = await import('@/lib/firestore');
      await updateShop(shopId, {
        themeOverrides: theme,
        sectionConfig: sections,
        customizationUpdatedAt: new Date().toISOString(),
      });
      if (shopSlug) {
        fetch(`/api/revalidate?slug=${shopSlug}&domain=${shopDomain || ''}`).catch(e => console.error(e));
      }
      setHasChanges(false);
      onSave?.({ theme, sections });
      toast.success('কাস্টমাইজেশন সেভ হয়েছে! ✨');
    } catch (err) {
      console.error('[CustomizationPanel] Save error:', err);
      toast.error('সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  }, [shopId, theme, sections, saving, onSave]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sliders size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">স্টোর কাস্টমাইজার</h3>
            <p className="text-[10px] text-slate-500 font-bold">{template?.namebn} — রঙ, ফন্ট ও লেআউট</p>
          </div>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-black hover:bg-slate-200 flex items-center gap-1.5"
            >
              <RotateCcw size={11} /> রিসেট
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-[11px] font-black hover:bg-purple-700 flex items-center gap-1.5 shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              সেভ করুন
            </button>
          </div>
        )}
      </div>

      {/* Live Mini Preview */}
      <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-lg">
        <div style={{ background: theme.headerBg, color: theme.headerText, padding: '14px 20px' }} className="flex items-center justify-between">
          <span className="font-black text-sm">🛍️ আপনার স্টোর</span>
          <span className="text-[10px] opacity-60 uppercase tracking-wider">লাইভ প্রিভিউ</span>
        </div>
        <div style={{ background: theme.bgColor, color: theme.textColor, padding: '20px', fontFamily: theme.fontFamily }}>
          <div className="grid grid-cols-3 gap-3">
            {['পণ্য ১', 'পণ্য ২', 'পণ্য ৩'].map(p => (
              <div
                key={p}
                style={{
                  background: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: theme.cardRadius,
                  padding: '12px',
                }}
              >
                <div style={{ background: theme.primaryColor + '20', height: '48px', borderRadius: '6px', marginBottom: '8px' }} />
                <p style={{ fontWeight: 900, fontSize: '11px' }}>{p}</p>
                <p style={{ color: theme.primaryColor, fontWeight: 900, fontSize: '10px', marginTop: '3px' }}>৳৫০০</p>
                <button
                  style={{
                    background: theme.primaryColor,
                    color: '#fff',
                    borderRadius: theme.buttonRadius,
                    padding: '4px 10px',
                    fontWeight: 900,
                    fontSize: '9px',
                    marginTop: '6px',
                    width: '100%',
                  }}
                >
                  কার্টে যোগ
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Color Customization */}
      <CollapsibleSection title="রঙ কাস্টমাইজেশন" icon={Palette} defaultOpen={true}>
        <ColorRow label="প্রাইমারি রঙ" value={theme.primaryColor} onChange={v => updateTheme('primaryColor', v)} />
        <ColorRow label="সেকেন্ডারি রঙ" value={theme.secondaryColor} onChange={v => updateTheme('secondaryColor', v)} />
        <ColorRow label="অ্যাকসেন্ট রঙ" value={theme.accentColor} onChange={v => updateTheme('accentColor', v)} />
        <ColorRow label="ব্যাকগ্রাউন্ড" value={theme.bgColor} onChange={v => updateTheme('bgColor', v)} />
        <ColorRow label="টেক্সট রঙ" value={theme.textColor} onChange={v => updateTheme('textColor', v)} />
        <ColorRow label="হেডার ব্যাকগ্রাউন্ড" value={theme.headerBg} onChange={v => updateTheme('headerBg', v)} />
        <ColorRow label="হেডার টেক্সট" value={theme.headerText} onChange={v => updateTheme('headerText', v)} />
        <ColorRow label="কার্ড ব্যাকগ্রাউন্ড" value={theme.cardBg} onChange={v => updateTheme('cardBg', v)} />
        <ColorRow label="কার্ড বর্ডার" value={theme.cardBorder} onChange={v => updateTheme('cardBorder', v)} />
      </CollapsibleSection>

      {/* Typography */}
      <CollapsibleSection title="টাইপোগ্রাফি" icon={Type}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">ফন্ট পরিবার</label>
            <select
              value={theme.fontFamily}
              onChange={e => updateTheme('fontFamily', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
              style={{ fontFamily: theme.fontFamily }}
            >
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">ফন্ট সাইজ</label>
            <div className="flex gap-2">
              {['sm', 'base', 'lg', 'xl'].map(size => (
                <button
                  key={size}
                  onClick={() => updateTheme('fontSize', size)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${
                    theme.fontSize === size ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {size === 'sm' ? 'ছোট' : size === 'base' ? 'মাঝারি' : size === 'lg' ? 'বড়' : 'অনেক বড়'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Layout & Shapes */}
      <CollapsibleSection title="লেআউট ও শেপ" icon={Layout}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">বাটন শেপ</label>
            <div className="flex gap-2 flex-wrap">
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => updateTheme('buttonRadius', r.value)}
                  className={`px-3 py-1.5 text-[10px] font-black border-2 transition-all ${
                    theme.buttonRadius === r.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                  style={{ borderRadius: r.value === '50px' ? '50px' : '8px' }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">কার্ড শেপ</label>
            <div className="flex gap-2 flex-wrap">
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => updateTheme('cardRadius', r.value)}
                  className={`px-3 py-1.5 text-[10px] font-black border-2 transition-all ${
                    theme.cardRadius === r.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                  style={{ borderRadius: r.value === '50px' ? '50px' : '8px' }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">শ্যাডো স্তর</label>
            <div className="flex gap-2">
              {SHADOW_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => updateTheme('shadow', s.value)}
                  className={`flex-1 py-1.5 text-[10px] font-black rounded-xl border-2 transition-all ${
                    theme.shadow === s.value ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section Manager */}
      <CollapsibleSection title="সেকশন ম্যানেজার" icon={LayoutTemplate}>
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 font-bold mb-3">কোন সেকশন দেখানো হবে তা নির্ধারণ করুন</p>
          {sections.map(section => (
            <SectionItem key={section.id} section={section} onToggle={toggleSection} />
          ))}
        </div>
      </CollapsibleSection>

      {/* Save Button (bottom) */}
      <button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl text-sm font-black hover:opacity-90 flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 disabled:opacity-50 transition-all"
      >
        {saving ? (
          <><Loader2 size={16} className="animate-spin" /> সেভ হচ্ছে...</>
        ) : (
          <><Save size={16} /> সব পরিবর্তন সেভ করুন</>
        )}
      </button>
    </div>
  );
}
