/**
 * Steadfast Courier API Integration Wrapper
 */

const BASE_URL = 'https://portal.steadfast.com.bd/api/v1';

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

  const response = await fetch(`${BASE_URL}/create_order`, {
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
    })
  });

  const result = await response.json();
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

  const response = await fetch(`${BASE_URL}/status_by_cid/${consignmentId}`, {
    method: 'GET',
    headers: {
      'Api-Key': apiKey,
      'Secret-Key': secretKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  const result = await response.json();
  return result;
}
