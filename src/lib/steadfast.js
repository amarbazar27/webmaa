/**
 * Steadfast Courier API Integration Wrapper
 * Using the official/new API gateway: portal.packzy.com
 */

const BASE_URL = 'https://portal.packzy.com/api/v1';

/**
 * Creates a parcel on Steadfast Courier
 * @param {Object} keys - API and Secret keys
 * @param {string} keys.apiKey - Steadfast Api-Key
 * @param {string} keys.secretKey - Steadfast Secret-Key
 * @param {Object} payload - Parcel payload details
 * @returns {Promise<Object>} Response from Steadfast API
 */
export async function createSteadfastParcel(keys, payload) {
  const { apiKey, secretKey } = keys;
  if (!apiKey || !secretKey) {
    throw new Error('Steadfast credentials are not configured.');
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}/create_order`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        invoice: payload.invoice,
        recipient_name: payload.recipientName,
        recipient_phone: payload.recipientPhone,
        recipient_address: payload.recipientAddress,
        cod_amount: Number(payload.codAmount) || 0,
        note: payload.note || ''
      }),
      signal: AbortSignal.timeout(30000)
    });
  } catch (networkErr) {
    console.error('[Steadfast] Network error calling Steadfast API:', networkErr.message);
    throw new Error(`Steadfast API connection failed: ${networkErr.message}. Check your API credentials and internet connection.`);
  }

  let result;
  try {
    result = await response.json();
  } catch (parseErr) {
    console.error('[Steadfast] Failed to parse Steadfast response, HTTP status:', response.status);
    throw new Error(`Steadfast API returned invalid response (HTTP ${response.status}). Check your API Key and Secret Key.`);
  }

  console.log('[Steadfast] API response:', JSON.stringify(result));

  if (result.status === 401) {
    throw new Error('Steadfast API Key বা Secret Key ভুল। Settings → Courier-এ সঠিক credentials দিন।');
  }
  if (result.status === 400 || result.status === 422) {
    let errMsg = result.errors
      ? Object.entries(result.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
      : result.message || 'Validation error';
    throw new Error(errMsg);
  }
  if (result.status && result.status !== 200) {
    throw new Error(result.message || `Steadfast returned error status: ${result.status}`);
  }

  return result;
}

/**
 * Fetches status of a consignment by consignment ID
 * @param {Object} keys - API and Secret keys
 * @param {string} keys.apiKey - Steadfast Api-Key
 * @param {string} keys.secretKey - Steadfast Secret-Key
 * @param {string} consignmentId - Steadfast consignment ID
 * @returns {Promise<Object>} Response from Steadfast API
 */
export async function getSteadfastStatus(keys, consignmentId) {
  const { apiKey, secretKey } = keys;
  if (!apiKey || !secretKey) {
    throw new Error('Steadfast credentials are not configured.');
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}/status_by_cid/${consignmentId}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(15000)
    });
  } catch (networkErr) {
    throw new Error(`Steadfast status check failed: ${networkErr.message}`);
  }

  const result = await response.json();
  return result;
}
