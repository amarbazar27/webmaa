import { adminDb } from '../../firebase-admin';

const DISPOSABLE_EMAIL_REGEX = /@(yopmail\.com|mailinator\.com|tempmail\.com|dispostable\.com|guerrillamail.*|sharklasers\.com|10minutemail.*|trashmail.*|getairmail\.com|burnermail\.io|temp-mail\.org|generator\.email|tempmailaddress\.com)/i;
const GIBBERISH_NAME_REGEX = /^(asdf|qwer|zxcv|1234|abcd|test|none|null|spam|fake|qwerty)/i;
const ADDRESS_KEYWORDS = [
  'road', 'house', 'sector', 'block', 'holding', 'thana', 'dhaka', 'chittagong', 'sylhet', 
  'rajshahi', 'khulna', 'barisal', 'rangpur', 'mymensingh', 'district', 'village', 'post', 'upazila',
  'থানা', 'ঢাকা', 'গ্রাম', 'হোল্ডিং', 'রোড', 'বাসা', 'সেক্টর', 'ব্লক', 'রাস্তা', 'পোস্ট', 'উপজেলা', 'জেলা'
];

/**
 * Fallback local heuristics fraud checker.
 * @param {Object} orderData - Incoming order data
 * @param {string} clientIp - Client's IP address
 * @param {string} countryCode - Vercel country code header
 * @returns {Promise<Object>} Formatted fraud report
 */
export async function checkFallbackHeuristics(orderData, clientIp, countryCode) {
  let score = 0;
  const reasons = [];

  const {
    shopId,
    customerName = '',
    customerPhone = '',
    customerEmail = '',
    customerAddress = '',
  } = orderData;

  // 1. Check Name
  const trimmedName = customerName.trim();
  if (trimmedName.length < 3) {
    score += 15;
    reasons.push('Name is suspiciously short');
  }
  if (GIBBERISH_NAME_REGEX.test(trimmedName) || /^[0-9]+$/.test(trimmedName)) {
    score += 25;
    reasons.push('Name matches spam or numeric patterns');
  }

  // 2. Check Email
  if (customerEmail) {
    if (DISPOSABLE_EMAIL_REGEX.test(customerEmail)) {
      score += 30;
      reasons.push('Disposable or temporary email used');
    }
  }

  // 3. Check Address
  const trimmedAddress = customerAddress.trim();
  if (trimmedAddress.length < 15) {
    score += 20;
    reasons.push('Address is too short or lacks detail');
  } else {
    const addressLower = trimmedAddress.toLowerCase();
    const hasKeyword = ADDRESS_KEYWORDS.some(kw => addressLower.includes(kw));
    if (!hasKeyword) {
      score += 15;
      reasons.push('Address lacks standard location keywords');
    }
  }

  // 4. Check VPN / Proxy
  if (countryCode && countryCode !== 'BD' && countryCode !== 'unknown') {
    const isBdPhone = /^(\+88)?01[3-9]\d{8}$/.test(customerPhone.trim());
    if (isBdPhone) {
      score += 30;
      reasons.push(`Country mismatch (IP: ${countryCode}, Order: BD). Potential VPN/Proxy.`);
    }
  }

  // 5. Query local shop orders for duplicate phone and velocity checks
  if (adminDb && shopId && customerPhone) {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const ordersRef = adminDb.collection('shops').doc(shopId).collection('orders');

      // Duplicate phone check
      const phoneOrders = await ordersRef
        .where('customerPhone', '==', customerPhone)
        .where('createdAt', '>=', sevenDaysAgo)
        .limit(10)
        .get();

      if (phoneOrders.size > 0) {
        const count = phoneOrders.size;
        if (count >= 3) {
          score += 35;
          reasons.push(`High phone velocity: ${count} orders from this number in last 7 days`);
        } else {
          score += 15;
          reasons.push(`Duplicate phone order: ${count} orders from this number in last 7 days`);
        }
      }

      // History of cancellations/rejections
      const cancelledOrders = await ordersRef
        .where('customerPhone', '==', customerPhone)
        .where('status', 'in', ['cancelled', 'rejected'])
        .limit(5)
        .get();

      if (cancelledOrders.size > 0) {
        const count = cancelledOrders.size;
        score += count * 15;
        reasons.push(`History of cancelled/rejected orders: ${count} detected`);
      }

      // Duplicate IP check
      if (clientIp && clientIp !== 'unknown') {
        const ipOrders = await ordersRef
          .where('clientIp', '==', clientIp)
          .where('createdAt', '>=', oneDayAgo)
          .limit(10)
          .get();

        if (ipOrders.size > 0) {
          const count = ipOrders.size;
          if (count >= 3) {
            score += 30;
            reasons.push(`High IP velocity: ${count} orders from this IP in last 24 hours`);
          } else {
            score += 10;
            reasons.push(`Duplicate IP order: ${count} orders from this IP in last 24 hours`);
          }
        }
      }

    } catch (dbErr) {
      console.warn('[Fallback Heuristics] Firestore velocity query failed:', dbErr.message);
    }
  }

  const finalScore = Math.min(100, score);
  let riskLevel = 'low';
  if (finalScore >= 75) {
    riskLevel = 'very_high';
  } else if (finalScore >= 50) {
    riskLevel = 'high';
  } else if (finalScore >= 20) {
    riskLevel = 'medium';
  }

  return {
    success: true,
    provider: 'LocalHeuristics',
    riskScore: finalScore,
    riskLevel,
    reasons
  };
}
