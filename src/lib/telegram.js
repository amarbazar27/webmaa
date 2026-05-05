export async function sendTelegramAlert({ message, level = 'info', context = {} }) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return { success: false, reason: 'no_config' };
  }

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '🚨',
    success: '✅',
    critical: '🔥'
  };

  const icon = icons[level] || icons.info;
  const contextStr = Object.keys(context).length > 0 
    ? `\n\n<b>Context:</b>\n<pre>${JSON.stringify(context, null, 2)}</pre>`
    : '';

  const text = `<b>${icon} Webmaa System Alert [${level.toUpperCase()}]</b>\n\n${message}${contextStr}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML'
      })
    });
    
    return { success: res.ok };
  } catch (err) {
    console.error('Telegram alert failed:', err);
    return { success: false, error: err.message };
  }
}
