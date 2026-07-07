/**
 * Steadfast Courier API Integration Wrapper
 * Uses Node.js native https + custom DNS resolver (Google/Cloudflare)
 * to bypass Vercel's DNS which cannot resolve .bd TLD domains.
 */

import https from 'node:https';
import dns from 'node:dns';

const STEADFAST_HOST = 'portal.steadfast.com.bd';
const STEADFAST_BASE = '/api/v1';

// Use Google & Cloudflare public DNS to resolve .bd domains
// (Vercel's default DNS often fails on Bangladesh .bd TLD)
const customResolver = new dns.Resolver();
customResolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

/**
 * Resolve hostname using custom DNS, fallback to system DNS.
 */
function resolveIPv4(hostname) {
  return new Promise((resolve, reject) => {
    customResolver.resolve4(hostname, (err, addresses) => {
      if (err || !addresses?.length) {
        // Fallback to system DNS
        dns.resolve4(hostname, (err2, addrs) => {
          if (err2 || !addrs?.length) {
            reject(new Error(
              `DNS resolution failed for ${hostname}. ` +
              `Both Google DNS and system DNS could not resolve the domain. ` +
              `Error: ${err?.message || err2?.message}`
            ));
          } else {
            console.log(`[Steadfast DNS] Resolved via system DNS: ${hostname} → ${addrs[0]}`);
            resolve(addrs[0]);
          }
        });
      } else {
        console.log(`[Steadfast DNS] Resolved via Google DNS: ${hostname} → ${addresses[0]}`);
        resolve(addresses[0]);
      }
    });
  });
}

/**
 * Low-level HTTPS POST using Node.js native module with custom DNS.
 */
async function httpsPost(path, headers, bodyObj) {
  // Resolve IP first using custom DNS (bypasses Vercel's broken .bd DNS)
  const ip = await resolveIPv4(STEADFAST_HOST);

  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(bodyObj);

    const options = {
      host: ip,          // Connect to IP directly
      port: 443,
      path: `${STEADFAST_BASE}${path}`,
      method: 'POST',
      timeout: 30000,
      headers: {
        ...headers,
        'Host': STEADFAST_HOST,      // SNI: send original hostname for SSL
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
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch {
          reject(new Error(
            `Steadfast API returned non-JSON (HTTP ${res.statusCode}): ${data.substring(0, 300)}`
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
      let msg = `Steadfast connection error: ${err.message}`;
      if (err.code === 'ECONNREFUSED') msg = 'Steadfast server refused the connection. Check API credentials.';
      if (err.code === 'ETIMEDOUT') msg = 'Steadfast server timed out. Please try again.';
      if (err.code?.includes('CERT') || err.code?.includes('SSL')) {
        msg = `Steadfast SSL error (${err.code}). Contact Steadfast support.`;
      }
      reject(new Error(msg));
    });

    req.write(bodyStr);
    req.end();
  });
}

/**
 * Low-level HTTPS GET using Node.js native module with custom DNS.
 */
async function httpsGet(path, headers) {
  const ip = await resolveIPv4(STEADFAST_HOST);

  return new Promise((resolve, reject) => {
    const options = {
      host: ip,
      port: 443,
      path: `${STEADFAST_BASE}${path}`,
      method: 'GET',
      timeout: 15000,
      headers: {
        ...headers,
        'Host': STEADFAST_HOST,
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

  console.log('[Steadfast] Creating parcel → invoice:', payload.invoice, 'phone:', payload.recipientPhone);

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

  console.log('[Steadfast] Response → HTTP:', statusCode, 'body.status:', body?.status, 'body.message:', body?.message);

  if (body.status === 401 || statusCode === 401) {
    throw new Error('Steadfast API Key বা Secret Key ভুল। Settings → Courier-এ সঠিক credentials দিন।');
  }
  if (body.status === 422 || statusCode === 422) {
    const errMsg = body.errors
      ? Object.values(body.errors).flat().join(', ')
      : body.message || 'Validation error';
    throw new Error(`Steadfast validation error: ${errMsg}`);
  }
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
