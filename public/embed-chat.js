(function () {
  if (window.__BDR_CHAT_LOADED__) return;
  window.__BDR_CHAT_LOADED__ = true;

  const currentScript = document.currentScript || document.querySelector('script[data-shop]');
  const shopId = (currentScript && currentScript.getAttribute('data-shop')) || 'main';

  // Visitor ID
  const visitorKey = 'bdr_visitor_' + shopId;
  let visitorId = localStorage.getItem(visitorKey);
  if (!visitorId) {
    visitorId = 'vis_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(visitorKey, visitorId);
  }

  // Styles
  const style = document.createElement('style');
  style.textContent = [
    '#bdr-chat-btn { position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: #7c3aed; color: #fff; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4); display: flex; align-items: center; justify-content: center; z-index: 999999; transition: transform 0.2s; }',
    '#bdr-chat-btn:hover { transform: scale(1.05); }',
    '#bdr-chat-box { position: fixed; bottom: 86px; right: 20px; width: 340px; height: 460px; background: #fff; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); display: none; flex-direction: column; overflow: hidden; z-index: 999999; font-family: sans-serif; border: 1px solid #e2e8f0; }',
    '#bdr-chat-box.open { display: flex; }',
    '#bdr-chat-header { background: #7c3aed; color: #fff; padding: 14px 16px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }',
    '#bdr-chat-messages { flex: 1; padding: 12px; overflow-y: auto; background: #f8fafc; font-size: 12px; display: flex; flex-direction: column; gap: 8px; }',
    '#bdr-chat-input-bar { padding: 10px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; gap: 6px; }',
    '#bdr-chat-input { flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 8px 12px; font-size: 12px; outline: none; }',
    '#bdr-chat-send { background: #7c3aed; color: #fff; border: none; border-radius: 12px; padding: 0 14px; font-weight: bold; cursor: pointer; }',
    '.bdr-msg { max-width: 80%; padding: 8px 12px; border-radius: 14px; line-height: 1.4; word-wrap: break-word; }',
    '.bdr-msg-user { background: #7c3aed; color: #fff; align-self: flex-end; border-top-right-radius: 2px; }',
    '.bdr-msg-bot { background: #fff; color: #1e293b; border: 1px solid #e2e8f0; align-self: flex-start; border-top-left-radius: 2px; }'
  ].join('\n');
  document.head.appendChild(style);

  // Widget Button
  const btn = document.createElement('button');
  btn.id = 'bdr-chat-btn';
  btn.setAttribute('aria-label', 'Open Live Chat');
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>';
  document.body.appendChild(btn);

  // Chat Box
  const box = document.createElement('div');
  box.id = 'bdr-chat-box';
  box.innerHTML = [
    '<div id="bdr-chat-header">',
    '  <span>💬 লাইভ চ্যাট সাপোর্ট</span>',
    '  <span id="bdr-chat-close" style="cursor:pointer;font-size:16px;">&times;</span>',
    '</div>',
    '<div id="bdr-chat-messages">',
    '  <div class="bdr-msg bdr-msg-bot">আসসালামু আলাইকুম! কোনো পণ্য বা ডেলিভারি সম্পর্কে জানতে মেসেজ দিন। 😊</div>',
    '</div>',
    '<div id="bdr-chat-input-bar">',
    '  <input id="bdr-chat-input" placeholder="মেসেজ লিখুন..." />',
    '  <button id="bdr-chat-send">পাঠান</button>',
    '</div>'
  ].join('');
  document.body.appendChild(box);

  let isOpen = false;
  btn.onclick = function () {
    isOpen = !isOpen;
    box.className = isOpen ? 'open' : '';
  };
  document.getElementById('bdr-chat-close').onclick = function () {
    isOpen = false;
    box.className = '';
  };

  const input = document.getElementById('bdr-chat-input');
  const sendBtn = document.getElementById('bdr-chat-send');
  const messagesContainer = document.getElementById('bdr-chat-messages');

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Add user bubble
    const userDiv = document.createElement('div');
    userDiv.className = 'bdr-msg bdr-msg-user';
    userDiv.textContent = text;
    messagesContainer.appendChild(userDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Send to API
    fetch('https://bdretailers.com/api/social/website-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId: shopId,
        visitorId: visitorId,
        visitorName: 'ওয়েবসাইট ভিজিটর',
        message: text
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.reply) {
        const botDiv = document.createElement('div');
        botDiv.className = 'bdr-msg bdr-msg-bot';
        botDiv.textContent = data.reply;
        messagesContainer.appendChild(botDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    })
    .catch(function (err) {
      console.warn('Chat error:', err);
    });
  }

  sendBtn.onclick = sendMessage;
  input.onkeydown = function (e) {
    if (e.key === 'Enter') sendMessage();
  };
})();
