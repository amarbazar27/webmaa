import { standardizePhone } from '../detector';

/**
 * Checks customer phone history via the FraudBD API.
 * @param {string} phone - Standardized customer phone number
 * @returns {Promise<Object>} Unified fraud check result
 */
export async function checkFraudBD(phone) {
  const apiKey = process.env.FRAUD_BD_API_KEY;
  if (!apiKey) {
    return { success: false, provider: 'FraudBD', message: 'API Key missing' };
  }

  const cleanPhone = standardizePhone(phone);
  if (!cleanPhone) {
    return { success: false, provider: 'FraudBD', message: 'Invalid phone' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

  try {
    const res = await fetch('https://fraudbd.com/api/check-courier-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': apiKey
      },
      body: JSON.stringify({ phone_number: cleanPhone }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, provider: 'FraudBD', message: `HTTP ${res.status}` };
    }

    const data = await res.json();
    
    // Parse response data safely. Different couriers return various structures.
    // Try standard response fields or fallback to 0/empty values.
    const courierData = data?.data || data || {};
    
    const totalOrders = Number(courierData.total_delivery || courierData.total_deliveries || courierData.total_orders || courierData.total || 0);
    const successful = Number(courierData.success_delivery || courierData.successful_deliveries || courierData.success_orders || courierData.successful || 0);
    
    // Compute failures/cancelled/returned orders
    const returned = Number(courierData.return_delivery || courierData.returned || courierData.returns || courierData.return_orders || 0);
    const cancelled = Number(courierData.cancelled || courierData.cancel_orders || courierData.failed || 0);
    
    // Risk Score default estimation from API response
    let riskScore = 0;
    if (totalOrders > 0) {
      const returnRatio = returned / totalOrders;
      riskScore = Math.round(returnRatio * 100);
    }

    return {
      success: true,
      provider: 'FraudBD',
      riskScore,
      totalOrders,
      successful,
      cancelled,
      returned,
      raw: data
    };

  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[FraudBD API Error]', error.name === 'AbortError' ? 'Request timed out' : error.message);
    return { 
      success: false, 
      provider: 'FraudBD', 
      message: error.name === 'AbortError' ? 'Timeout' : error.message 
    };
  }
}
