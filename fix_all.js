const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════
// FIX 1: AI Chat Modal → Tabbed AI Panel (Chat+Voice+OCR+Text)
// ═══════════════════════════════════════════════════════
const shopClientPath = path.join(__dirname, 'src/app/shop/[shopSlug]/ShopClient.jsx');
let sc = fs.readFileSync(shopClientPath, 'utf8');

// Replace old AI modal with tabbed version
const oldModalStart = '      {/* \u2500\u2500 AI Chat Modal \u2500\u2500 */}';
const oldModalEnd = '      {/* \u2500\u2500 Cart Drawer \u2500\u2500 */}';

const startIdx = sc.indexOf(oldModalStart);
const endIdx = sc.indexOf(oldModalEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const before = sc.substring(0, startIdx);
  const after = sc.substring(endIdx);

  const newModal = `      {/* \u2500\u2500 AI Modal (Chat + Voice + OCR + Text) \u2500\u2500 */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAiOpen(false)} />
          <div className="relative w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] max-h-[700px] border border-slate-200 animate-slide-in">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b-[4px] border-purple-600 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-purple-100 overflow-hidden" style={{transform:'scale(0.75)'}}>
                  <CuteAIIcon />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-tight leading-tight">{shop.aiConfig?.botName || 'Bazar Bot'}</h3>
                  <p className="text-[10px] uppercase font-black text-purple-300 tracking-widest">AI Shopping Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsAiOpen(false)} className="hover:bg-white/20 p-2 rounded-xl text-slate-300 hover:text-white transition-colors"><X size={20} strokeWidth={2.5}/></button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
              {[{id:'chat',label:'\u099A\u09CD\u09AF\u09BE\u099F',icon:'\uD83D\uDCAC'},{id:'voice',label:'\u09AD\u09AF\u09BC\u09C7\u09B8',icon:'\uD83C\uDFA4'},{id:'image',label:'\u099B\u09AC\u09BF',icon:'\uD83D\uDCF7'},{id:'text',label:'\u09B2\u09BF\u09B8\u09CD\u099F',icon:'\uD83D\uDCDD'}].map(tab => (
                <button key={tab.id} onClick={() => setAiTab(tab.id)}
                  className={\`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all \${aiTab === tab.id ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}\`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Chat Tab */}
            {aiTab === 'chat' && <>
              <div className="flex-1 p-4 bg-slate-50 flex flex-col gap-3 overflow-y-auto">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={\`max-w-[90%] flex flex-col gap-2 \${msg.role === 'bot' ? 'self-start' : 'self-end'}\`}>
                    <div className={\`p-3.5 rounded-2xl text-sm font-bold shadow-sm leading-relaxed \${msg.role === 'bot' ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-purple-600 text-white rounded-tr-none'}\`}>
                      {msg.text}
                    </div>
                    {msg.hasSuggestions && (
                      <button onClick={() => addAllSuggestedToCart(msg.text)}
                        className="self-start flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-colors">
                        <ShoppingCart size={14} /> \u09B8\u09AC \u0995\u09BE\u09B0\u09CD\u099F\u09C7 \u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8
                      </button>
                    )}
                  </div>
                ))}
                {isAiTyping && <div className="max-w-[85%] p-3.5 rounded-2xl bg-white border border-slate-200 self-start flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:\`\${i*0.15}s\`}} />)}</div>}
              </div>
              <div className="p-3.5 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                <button onClick={() => setChatMessages([{ id: 1, role: 'bot', text: '\u09A8\u09A4\u09C1\u09A8 \u099A\u09CD\u09AF\u09BE\u099F \u09B6\u09C1\u09B0\u09C1 \u09B9\u09B2\u09CB!' }])} className="px-2 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 text-[10px] font-black transition-colors" title="Clear">\uD83D\uDDD1</button>
                <input type="text" placeholder="\u09AE\u09CD\u09AF\u09BE\u09B8\u09C7\u099C \u09B2\u09BF\u0996\u09C1\u09A8..." className="flex-1 bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-colors placeholder:text-slate-400" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage(chatInput)} />
                <button onClick={() => sendChatMessage(chatInput)} className="bg-slate-900 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors shadow-md"><MessageCircle size={20} strokeWidth={2.5}/></button>
              </div>
            </>}

            {/* Voice / Image / Text tabs via AiVoicePanel */}
            {aiTab !== 'chat' && (
              <AiVoicePanel
                shop={shop}
                products={products}
                onAddToCart={(item) => { setCart(prev => { const ex = prev.findIndex(i => i.id === item.id); if (ex >= 0) { const n = [...prev]; n[ex] = {...n[ex], quantity: n[ex].quantity + (item.quantity||1)}; return n; } return [...prev, item]; }); }}
                onDirectOrder={handleDirectOrderFromAi}
                isOpen={true}
                onClose={() => setIsAiOpen(false)}
              />
            )}
          </div>
        </div>
      )}

      `;

  sc = before + newModal + after;
  console.log('[OK] AI Modal replaced with tabbed version');
} else {
  console.log('[SKIP] AI Modal markers not found. start:', startIdx, 'end:', endIdx);
}

fs.writeFileSync(shopClientPath, sc, 'utf8');
console.log('[OK] ShopClient.jsx saved');


// ═══════════════════════════════════════════════════════
// FIX 2: ServiceBanner — strict location matching fix
// Always show unavailable for non-matching locations
// ═══════════════════════════════════════════════════════
const sbPath = path.join(__dirname, 'src/components/shop/ServiceBanner.jsx');
let sb = fs.readFileSync(sbPath, 'utf8');

// Remove the fallback that makes everything "available"
const badFallback = "      if (!isMatch && shop.showLocationSelector === false && !shop.isStrictLocation) {\n         isMatch = true; \n      }";
const badFallbackCR = "      if (!isMatch && shop.showLocationSelector === false && !shop.isStrictLocation) {\r\n         isMatch = true; \r\n      }";

if (sb.includes(badFallbackCR)) {
  sb = sb.replace(badFallbackCR, '      // Removed: no longer auto-approve non-matching locations');
  console.log('[OK] ServiceBanner fallback removed (CRLF)');
} else if (sb.includes(badFallback)) {
  sb = sb.replace(badFallback, '      // Removed: no longer auto-approve non-matching locations');
  console.log('[OK] ServiceBanner fallback removed (LF)');
} else {
  console.log('[SKIP] ServiceBanner fallback already removed or not found');
}

fs.writeFileSync(sbPath, sb, 'utf8');


// ═══════════════════════════════════════════════════════
// FIX 3: Gemini model error — remove gemini-1.5-pro from retry list
// ═══════════════════════════════════════════════════════
const aiRoutePath = path.join(__dirname, 'src/app/api/ai/route.js');
let ai = fs.readFileSync(aiRoutePath, 'utf8');

ai = ai.replace(
  "const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];",
  "const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];"
);
fs.writeFileSync(aiRoutePath, ai, 'utf8');
console.log('[OK] Gemini model list fixed (removed 1.5-pro)');


// ═══════════════════════════════════════════════════════
// FIX 4: AI Vision route — also fix model
// ═══════════════════════════════════════════════════════
const aiVisionPath = path.join(__dirname, 'src/app/api/ai-vision/route.js');
let aiv = fs.readFileSync(aiVisionPath, 'utf8');

aiv = aiv.replace(
  "models/gemini-1.5-flash:generateContent",
  "models/gemini-2.0-flash:generateContent"
);
fs.writeFileSync(aiVisionPath, aiv, 'utf8');
console.log('[OK] AI Vision model updated to gemini-2.0-flash');


// ═══════════════════════════════════════════════════════
// FIX 5: Checkout API — customImage accepts null
// ═══════════════════════════════════════════════════════
const checkoutPath = path.join(__dirname, 'src/app/api/checkout/route.js');
let ch = fs.readFileSync(checkoutPath, 'utf8');

ch = ch.replace(
  "customImage: z.string().max(2000000).optional(),",
  "customImage: z.string().max(2000000).optional().nullable(),"
);
fs.writeFileSync(checkoutPath, ch, 'utf8');
console.log('[OK] Checkout schema: customImage now accepts null');


console.log('\n=== All fixes applied! ===');
