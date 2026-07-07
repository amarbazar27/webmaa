/**
 * Steadfast Courier API Integration Wrapper
 * Uses Node.js native https module to bypass Vercel fetch restrictions
 * and force IPv4 connectivity to Steadfast's Bangladesh servers.
 */

import https from 'node:https';

const STEADFAST_HOST = 'portal.steadfast.com.bd';
const STEADFAST_BASE = '/api/v1';

/**
 * Low-level HTTPS request using Node.js native module.
 * Forces IPv4, bypasses Next.js fetch cache/polyfill layer.
 */
function httpsPost(path, headers, bodyObj) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(bodyObj);

    const options = {
      hostname: STEADFAST_HOST,
      port: 443,
      path: `${STEADFAST_BASE}${path}`,
      method: 'POST',
      family: 4, // Force IPv4 — avoids IPv6 connectivity issues from Vercel
      timeout: 30000,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (!data) {
          return reject(new Error(`Steadfast returned empty response (HTTP ${res.statusCode})`));
        }
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          reject(new Error(
            `Steadfast API returned non-JSON response (HTTP ${res.statusCode}): ${data.substring(0, 300)}`
          ));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Steadfast API request timed out after 30 seconds.'));
    });

    req.on('error', (err) => {
      console.error('[Steadfast HTTPS Error]', err.code, err.message);
      let msg = `Steadfast connection failed (${err.code || err.message}).`;
      if (err.code === 'ECONNREFUSED') msg = 'Steadfast server refused connection. Check API credentials.';
      if (err.code === 'ENOTFOUND') msg = 'Steadfast server not found (DNS failure). Check internet connection.';
      if (err.code === 'ETIMEDOUT') msg = 'Steadfast server timed out. Try again in a moment.';
      if (err.code === 'CERT_HAS_EXPIRED' || err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        msg = 'Steadfast SSL certificate issue. Contact Steadfast support.';
      }
      reject(new Error(msg));
    });

    req.write(bodyStr);
    req.end();
  });
}

function httpsGet(path, headers) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: STEADFAST_HOST,
      port: 443,
      path: `${STEADFAST_BASE}${path}`,
      method: 'GET',
      family: 4,
      timeout: 15000,
      headers: {
        ...headers,
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          reject(new Error(`Steadfast returned invalid response (HTTP ${res.statusCode})`));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Steadfast status check timed out.')); });
    req.on('error', (err) => reject(new Error(`Steadfast connection error: ${err.message}`)));
    req.end();
  });
}

/**
 * Creates a parcel on Steadfast Courier
 * @param {Object} keys - { apiKey, secretKey }
 * @param {Object} payload - Parcel details
 * @returns {Promise<Object>} Steadfast API response body
 */
export async function createSteadfastParcel(keys, payload) {
  const { apiKey, secretKey } = keys;
  if (!apiKey || !secretKey) {
    throw new Error('Steadfast credentials are not configured. Please add API Key and Secret Key in Settings → Courier.');
  }

  console.log('[Steadfast] Creating parcel for invoice:', payload.invoice, 'phone:', payload.recipientPhone);

  const { statusCode, body } = await httpsPost('/create_order', {
    'Api-Key': apiKey,
    'Secret-Key': secretKey,
  }, {
    invoice: payload.invoice,
    recipient_name: payload.recipientName,
    recipient_phone: payload.recipientPhone,
    recipient_address: payload.recipientAddress,
    cod_amount: Number(payload.codAmount) || 0,
    note: payload.note || '',
  });

  console.log('[Steadfast] Response status:', statusCode, 'body status:', body?.status);

  // Steadfast auth failure
  if (body.status === 401 || statusCode === 401) {
    throw new Error('Steadfast API Key বা Secret Key ভুল। Settings → Courier-এ সঠিক credentials দিন।');
  }

  // Steadfast validation failure
  if (body.status === 422 || statusCode === 422) {
    const errMsg = body.errors
      ? Object.values(body.errors).flat().join(', ')
      : body.message || 'Validation error';
    throw new Error(`Steadfast validation error: ${errMsg}`);
  }

  // Any other non-200 from Steadfast's JSON body
  if (body.status && body.status !== 200) {
    throw new Error(body.message || `Steadfast returned error status: ${body.status}`);
  }

  return body;
}

/**
 * Fetches status of a consignment by consignment ID
 */
export async function getSteadfastStatus(keys, consignmentId) {
  const { apiKey, secretKey } = keys;
  if (!apiKey || !secretKey) {
    throw new Error('Steadfast credentials are not configured.');
  }

  const { body } = await httpsGet(`/status_by_cid/${consignmentId}`, {
    'Api-Key': apiKey,
    'Secret-Key': secretKey,
  });

  return body;
}
