import { checkFraudBD } from './fraudbd';
import { checkFallbackHeuristics } from './fallback';

/**
 * Executes the Layer 1 fraud lookup against configured providers.
 * Falls back gracefully to local heuristics if external API fails or is not configured.
 * @param {string} phone - Customer phone number
 * @param {Object} orderData - Full order details (name, email, address, shopId)
 * @param {string} clientIp - Client's IP address
 * @param {string} countryCode - Vercel country code header
 * @returns {Promise<Object>} Unified check result
 */
export async function checkProviders(phone, orderData, clientIp, countryCode) {
  // If FraudBD key exists, attempt to call it
  if (process.env.FRAUD_BD_API_KEY) {
    const apiResult = await checkFraudBD(phone);
    if (apiResult.success) {
      return apiResult;
    }
  }

  // Fallback to local heuristics
  const fallbackResult = await checkFallbackHeuristics(orderData, clientIp, countryCode);
  return fallbackResult;
}
