import crypto from 'crypto';

/**
 * Generates SHA-256 hash of a string
 * @param {string} text - Plain text to hash
 * @returns {string} SHA-256 hash in hex format
 */
function sha256(text) {
  if (!text) return null;
  // Clean phone number (remove +, non-digits except leading zero)
  let cleanText = text.trim().toLowerCase();
  if (cleanText.startsWith('+')) {
    cleanText = cleanText.substring(1);
  }
  return crypto.createHash('sha256').update(cleanText).digest('hex');
}

/**
 * Sends a server-side tracking event to Meta Conversion API (CAPI)
 * @param {Object} config - Shop tracking config
 * @param {string} config.metaPixelId - Meta Pixel ID
 * @param {string} config.metaCapiToken - Meta CAPI System User Access Token
 * @param {string} config.metaCapiTestCode - Meta Test Event Code (optional, for debugging)
 * @param {Object} eventData - Details about the event
 * @param {string} eventData.eventName - Event Name (e.g. Purchase, InitiateCheckout)
 * @param {string} eventData.eventId - Unique ID for deduplication
 * @param {string} eventData.sourceUrl - Page URL where the event occurred
 * @param {Object} eventData.userData - Customer details (phone, email, ip, userAgent)
 * @param {Object} eventData.customData - Custom parameters (value, currency, items)
 */
export async function trackMetaServerEvent(config, eventData) {
  const { metaPixelId, metaCapiToken, metaCapiTestCode } = config;
  
  if (!metaPixelId || !metaCapiToken) {
    return; // Silently exit if not configured
  }

  const { eventName, eventId, sourceUrl, userData = {}, customData = {} } = eventData;
  const { phone, email, ip, userAgent } = userData;

  const url = `https://graph.facebook.com/v19.0/${metaPixelId}/events?access_token=${metaCapiToken}`;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: sourceUrl || 'https://bdretailers.com',
        action_source: 'website',
        user_data: {
          client_ip_address: ip && ip !== 'unknown' ? ip : undefined,
          client_user_agent: userAgent || undefined,
          em: email ? [sha256(email)] : undefined,
          ph: phone ? [sha256(phone)] : undefined
        },
        custom_data: {
          currency: customData.currency || 'BDT',
          value: Number(customData.value) || 0,
          content_type: 'product',
          contents: customData.contents || []
        },
        opt_out: false
      }
    ]
  };

  // Add Test Event Code if provided in dev/test mode
  if (metaCapiTestCode) {
    payload.test_event_code = metaCapiTestCode;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errRes = await res.json();
      console.warn('[Meta CAPI Failure]', errRes);
    }
  } catch (err) {
    console.warn('[Meta CAPI Connection Error]', err.message);
  }
}
