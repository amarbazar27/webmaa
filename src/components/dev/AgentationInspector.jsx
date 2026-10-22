'use client';

import { useState, useEffect, useRef } from 'react';
import { Target, X, Copy, Check, Code, Layers, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function AgentationInspector() {
  const { user, userData } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [hoveredEl, setHoveredEl] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef(null);

  // 🔒 Security Restriction: Only Superadmin logged in with their Google/Email auth can see and use Inspector UI
  const isSuperAdmin = Boolean(
    userData?.role === 'superadmin' ||
    userData?.role === 'sub_superadmin' ||
    user?.email === 'amarbazar27@gmail.com' ||
    user?.email === 'bdretailers26@gmail.com'
  );

  // Hide completely for regular customers, unauthenticated visitors, and non-superadmin retailers
  if (!isSuperAdmin) {
    return null;
  }

  // Track hover and click when inspector is active
  useEffect(() => {
    if (!isActive) {
      setHoveredEl(null);
      return;
    }

    const handleMouseOver = (e) => {
      // Ignore if hovering over our own inspector UI
      if (e.target.closest('#agentation-inspector-container')) return;
      setHoveredEl(e.target);
    };

    const handleClick = (e) => {
      // Ignore clicks inside our own inspector UI
      if (e.target.closest('#agentation-inspector-container')) return;
      
      e.preventDefault();
      e.stopPropagation();

      const el = e.target;
      const rect = el.getBoundingClientRect();
      const tagName = el.tagName.toLowerCase();
      const className = el.className && typeof el.className === 'string' ? el.className : '';
      const text = el.innerText?.slice(0, 100) || '';
      const id = el.id || '';
      
      // Attempt to identify section or component
      const parentSection = el.closest('section, header, footer, nav, aside, main, [data-section]');
      const sectionName = parentSection?.getAttribute('data-section') || 
                          parentSection?.id || 
                          parentSection?.tagName.toLowerCase() || 
                          'Content Area';

      // Current pathname
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

      let probableFile = 'src/app/page.js';
      if (currentPath.startsWith('/dashboard')) probableFile = `src/app${currentPath}/page.js or src/components/dashboard/*`;
      else if (currentPath.startsWith('/shop/')) probableFile = 'src/app/shop/[shopSlug]/page.js or ShopClient.jsx';
      else if (currentPath.startsWith('/become-retailer')) probableFile = 'src/app/become-retailer/page.js';
      else if (currentPath.startsWith('/pricing')) probableFile = 'src/components/home/PricingSection.jsx';

      setSelectedInfo({
        tag: tagName,
        id,
        className,
        text,
        sectionName,
        currentPath,
        probableFile,
        rect: {
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left + window.scrollX),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }
      });
    };

    // Keyboard shortcut Alt + I to toggle
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        setIsActive((prev) => !prev);
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  const handleCopyContext = () => {
    if (!selectedInfo) return;

    const formattedContext = `[Agentation UI Context]
- URL Path: ${selectedInfo.currentPath}
- Probable Source: ${selectedInfo.probableFile}
- Section: ${selectedInfo.sectionName}
- Tag: <${selectedInfo.tag}>
- Classes: "${selectedInfo.className}"
- Text Snippet: "${selectedInfo.text.replace(/\n+/g, ' ').trim()}"
${selectedInfo.id ? `- ID: #${selectedInfo.id}\n` : ''}- Element Size: ${selectedInfo.rect.width}x${selectedInfo.rect.height}px`;

    navigator.clipboard.writeText(formattedContext);
    setCopied(true);
    toast.success('AI কনটেক্সট কপি হয়েছে! এবার চ্যাটে পেস্ট করুন 📋');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="agentation-inspector-container" className="fixed z-[999999] pointer-events-auto">
      {/* 🎯 Toggle Floating Button */}
      <div className="fixed bottom-24 left-4 z-[999999]">
        <button
          type="button"
          onClick={() => {
            setIsActive(!isActive);
            if (isActive) setSelectedInfo(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-xl transition-all cursor-pointer backdrop-blur-md border ${
            isActive
              ? 'bg-cyan-500 text-slate-950 border-cyan-300 ring-4 ring-cyan-400/30 scale-105 animate-pulse'
              : 'bg-slate-900/90 text-white hover:bg-slate-800 border-slate-700/80 hover:scale-105'
          }`}
          title="Alt + I চেপে ইনস্পেক্টর অন/অফ করুন"
        >
          <Target size={14} className={isActive ? 'animate-spin' : ''} />
          <span>{isActive ? 'ইনস্পেক্টর চালু (Click any element)' : '🎯 Inspect UI'}</span>
        </button>
      </div>

      {/* Hover Highlighting Box */}
      {isActive && hoveredEl && !selectedInfo && (
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            top: hoveredEl.getBoundingClientRect().top + window.scrollY,
            left: hoveredEl.getBoundingClientRect().left + window.scrollX,
            width: hoveredEl.getBoundingClientRect().width,
            height: hoveredEl.getBoundingClientRect().height,
            border: '2px dashed #06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            pointerEvents: 'none',
            zIndex: 999990,
            transition: 'all 0.05s ease-out',
            borderRadius: '4px',
          }}
        >
          <span className="absolute -top-6 left-0 px-1.5 py-0.5 bg-cyan-600 text-white text-[9px] font-mono font-bold rounded shadow-sm whitespace-nowrap">
            &lt;{hoveredEl.tagName.toLowerCase()}&gt; • {Math.round(hoveredEl.getBoundingClientRect().width)}×{Math.round(hoveredEl.getBoundingClientRect().height)}
          </span>
        </div>
      )}

      {/* Selected Element Details Glass Card */}
      {selectedInfo && (
        <div className="fixed bottom-6 left-4 right-4 sm:right-auto sm:w-96 max-h-[80vh] overflow-y-auto bg-slate-950/95 text-white p-4 rounded-2xl border-2 border-cyan-400 shadow-2xl backdrop-blur-xl z-[999999] animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} className="text-cyan-400" />
              <h4 className="text-xs font-black tracking-tight text-cyan-300">Agentation UI Inspector</h4>
            </div>
            <button
              onClick={() => setSelectedInfo(null)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="space-y-2.5 text-[11px]">
            <div>
              <span className="text-slate-400 font-bold block mb-0.5">ট্যাগ ও সেকশন:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-700/50 rounded font-bold">
                  &lt;{selectedInfo.tag}&gt;
                </span>
                <span className="text-slate-300 truncate">({selectedInfo.sectionName})</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-bold block mb-0.5">সম্ভাব্য সোর্স ফাইল:</span>
              <p className="font-mono text-purple-300 bg-purple-950/50 border border-purple-800/40 p-1.5 rounded break-all">
                {selectedInfo.probableFile}
              </p>
            </div>

            {selectedInfo.text && (
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">এলিমেন্টের টেক্সট:</span>
                <p className="text-slate-200 bg-slate-900 border border-slate-800 p-1.5 rounded line-clamp-2 italic">
                  &ldquo;{selectedInfo.text}&rdquo;
                </p>
              </div>
            )}

            <div>
              <span className="text-slate-400 font-bold block mb-0.5">Tailwind ক্লাসেস:</span>
              <div className="max-h-20 overflow-y-auto font-mono text-[10px] text-emerald-300 bg-slate-900 border border-slate-800 p-1.5 rounded break-all leading-relaxed">
                {selectedInfo.className || '(No classes)'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => setSelectedInfo(null)}
              className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>

            <button
              onClick={handleCopyContext}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
            >
              {copied ? <Check size={14} className="text-slate-950" /> : <Copy size={14} />}
              <span>{copied ? 'কপি হয়েছে!' : 'Copy Context for AI'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
