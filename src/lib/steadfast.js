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

/**
 * Checks customer delivery history and fraud probability via Steadfast Courier Fraud API
 * @param {Object} keys - Steadfast API and Secret keys
 * @param {string} phone - 11 digit BD phone number
 * @returns {Promise<Object>} Delivery success statistics and risk assessment
 */
export async function checkSteadfastFraud(keys, phone) {
  const { apiKey, secretKey } = keys;
  if (!apiKey || !secretKey) {
    throw new Error('Steadfast API Key বা Secret Key কনফিগার করা নেই। Settings থেকে কুরিয়ার কী সেট করুন।');
  }

  // Normalize phone number to 11 digits (e.g. 01712345678)
  const cleanedPhone = phone.replace(/[^0-9]/g, '').replace(/^88/, '');
  if (!/^01[3-9]\d{8}$/.test(cleanedPhone)) {
    throw new Error('অবৈধ বাংলাদেশি ফোন নম্বর। ১১ ডিজিটের সঠিক নম্বর দিন (যেমন: 017XXXXXXXX)।');
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}/fraud_check/${cleanedPhone}`, {
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
    throw new Error(`Steadfast ফ্রড চেক নেটওয়ার্ক ত্রুটি: ${networkErr.message}`);
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('Steadfast API credentials সঠিক নয়। Settings → Courier যাচাই করুন।');
  }

  const result = await response.json();
  const totalParcels = Number(result.total_parcels ?? 0);
  const totalDelivered = Number(result.total_delivered ?? 0);
  const totalCancelled = Number(result.total_cancelled ?? 0);

  const deliveryRate = totalParcels > 0 ? Math.round((totalDelivered / totalParcels) * 100) : null;
  const cancellationRate = totalParcels > 0 ? Math.round((totalCancelled / totalParcels) * 100) : null;

  let riskLevel = 'new'; // 'new' | 'safe' | 'medium' | 'danger'
  let riskLabel = 'নতুন কাস্টমার (কুরিয়ারে পূর্ববর্তী রেকর্ড নেই)';
  let riskColor = 'slate';

  if (totalParcels > 0) {
    if (deliveryRate >= 80) {
      riskLevel = 'safe';
      riskLabel = `নির্ভরযোগ্য কাস্টমার (${deliveryRate}% সাকসেস)`;
      riskColor = 'emerald';
    } else if (deliveryRate >= 60) {
      riskLevel = 'medium';
      riskLabel = `মাঝারি ঝুঁকি (${deliveryRate}% সাকসেস)`;
      riskColor = 'amber';
    } else {
      riskLevel = 'danger';
      riskLabel = `উচ্চ ঝুঁকিপূর্ণ অর্ডার (${deliveryRate}% সাকসেস - ক্যান্সেল রেট ${cancellationRate}%)`;
      riskColor = 'red';
    }
  }

  return {
    phone: cleanedPhone,
    totalParcels,
    totalDelivered,
    totalCancelled,
    deliveryRate,
    cancellationRate,
    riskLevel,
    riskLabel,
    riskColor,
    raw: result
  };
}

