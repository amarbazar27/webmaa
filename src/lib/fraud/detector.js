import { adminDb } from '../firebase-admin';
import { checkProviders } from './providers';
import admin from 'firebase-admin';

/**
 * Standardizes a phone number to exactly 11 digits starting with 01.
 * @param {string} phone - Input phone number
 * @returns {string} 11-digit standardized phone
 */
export function standardizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/\D/g, '');
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('80')) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.startsWith('1')) {
    cleaned = '0' + cleaned;
  }
  if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  return cleaned.slice(0, 11);
}

/**
 * AI Risk Score Engine.
 * Calculates score from 0-100 and risk level based on internal and external delivery ratios,
 * reports, address diversity, and velocity.
 * @param {Object} profile - Internal database profile
 * @param {Object} externalStats - External provider stats
 * @param {number} recentVelocity - Velocity check
 * @returns {Object} { score, riskLevel, reasons }
 */
export function calculateRiskScore(profile, externalStats = {}, recentVelocity = 0) {
  let score = 0;
  const reasons = [];

  const successOrders = Number(profile.successOrders || 0);
  const cancelOrders = Number(profile.cancelOrders || 0);
  const returnOrders = Number(profile.returnOrders || 0);
  const totalOrders = Number(profile.totalOrders || 0);

  const extSuccessful = Number(externalStats.successful || 0);
  const extCancelled = Number(externalStats.cancelled || 0);
  const extReturned = Number(externalStats.returned || 0);
  const extTotal = Number(externalStats.totalOrders || 0);

  // Combine internal and external stats
  const combinedTotal = totalOrders + extTotal;
  const combinedSuccess = successOrders + extSuccessful;
  const combinedReturned = returnOrders + extReturned;
  const combinedCancelled = cancelOrders + extCancelled;

  if (combinedTotal > 0) {
    const successRatio = combinedSuccess / combinedTotal;
    const returnRatio = combinedReturned / combinedTotal;
    const cancelRatio = combinedCancelled / combinedTotal;

    // 1. Success rate penalties (only calculate if we have at least 2 total orders)
    if (combinedTotal >= 2) {
      if (successRatio < 0.5) {
        score += 30;
        reasons.push(`Low overall success rate: ${(successRatio * 100).toFixed(0)}%`);
      } else if (successRatio < 0.75) {
        score += 15;
        reasons.push(`Moderate success rate: ${(successRatio * 100).toFixed(0)}%`);
      }

      // 2. Return rate penalties (very high risk for COD)
      if (returnRatio > 0.3) {
        score += 40;
        reasons.push(`Extremely high return rate: ${(returnRatio * 100).toFixed(0)}%`);
      } else if (returnRatio > 0.15) {
        score += 20;
        reasons.push(`Moderate return rate: ${(returnRatio * 100).toFixed(0)}%`);
      }

      // 3. Cancel rate penalties
      if (cancelRatio > 0.4) {
        score += 15;
        reasons.push(`High cancellation rate: ${(cancelRatio * 100).toFixed(0)}%`);
      }
    }
  }

  // 4. Address diversity penalty
  const uniqueAddresses = profile.addresses || [];
  if (uniqueAddresses.length > 2) {
    const penalty = Math.min(30, (uniqueAddresses.length - 2) * 10);
    score += penalty;
    reasons.push(`Multiple shipping addresses detected (${uniqueAddresses.length})`);
  }

  // 5. Ordering velocity check
  if (recentVelocity >= 3) {
    score += 20;
    reasons.push(`High ordering velocity: ${recentVelocity} orders placed recently`);
  }

  // 6. Community reports (weighted count)
  const reports = profile.reports || [];
  if (reports.length > 0) {
    // Unique reporter shops to avoid brigading
    const uniqueReporters = new Set(reports.map(r => r.shopId));
    const reportCount = uniqueReporters.size;
    if (reportCount > 0) {
      // 15 points per unique reporting shop, capped at 40 points
      const reportPoints = Math.min(40, reportCount * 15);
      score += reportPoints;
      reasons.push(`Reported by ${reportCount} different shop(s) in community`);
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));
  let riskLevel = 'low';
  if (finalScore >= 60) {
    riskLevel = 'high';
  } else if (finalScore >= 25) {
    riskLevel = 'medium';
  }

  return {
    score: finalScore,
    riskLevel,
    reasons
  };
}

/**
 * Runs the Layer 2 Enterprise Fraud Scan on an incoming order.
 * Queries/caches external provider results, merges with internal stats,
 * and outputs the calculated AI Risk Score.
 * @param {Object} orderData - Order payload (shopId, customerPhone, customerName, customerAddress, customerEmail)
 * @param {string} clientIp - Client's IP address
 * @param {string} countryCode - Vercel country code header
 * @returns {Promise<Object>} Combined fraud scan result
 */
export async function runEnterpriseFraudScan(orderData, clientIp, countryCode) {
  const { shopId, customerPhone = '', customerName = '', customerAddress = '', customerEmail = '' } = orderData;
  const cleanPhone = standardizePhone(customerPhone);

  if (!cleanPhone) {
    return { score: 0, riskLevel: 'low', reasons: ['No phone number provided'] };
  }

  let profile = {
    phone: cleanPhone,
    successOrders: 0,
    cancelOrders: 0,
    returnOrders: 0,
    totalOrders: 0,
    addresses: [],
    stores: [],
    reports: [],
    externalStats: {},
    lastLookup: null
  };

  let profileExists = false;
  let profileRef = null;

  if (adminDb) {
    profileRef = adminDb.collection('fraud_profiles').doc(cleanPhone);
    try {
      const snap = await profileRef.get();
      if (snap.exists) {
        profile = { ...profile, ...snap.data() };
        profileExists = true;
      }
    } catch (err) {
      console.warn('[Fraud DB] Failed to query profile:', err.message);
    }
  }

  // 1. Check Caching & Fetch External APIs if necessary
  const now = Date.now();
  const cacheAge = profile.lastLookup ? now - new Date(profile.lastLookup.seconds * 1000 || profile.lastLookup).getTime() : Infinity;
  const cacheExpired = cacheAge > 24 * 60 * 60 * 1000; // 24 hours

  let externalStats = profile.externalStats || {};
  let providerUsed = profile.lastProvider || null;

  if (cacheExpired) {
    // Lookup external providers (Layer 1)
    const extResult = await checkProviders(cleanPhone, orderData, clientIp, countryCode);
    if (extResult.success) {
      externalStats = {
        successful: extResult.successful,
        cancelled: extResult.cancelled,
        returned: extResult.returned,
        totalOrders: extResult.totalOrders
      };
      providerUsed = extResult.provider;
    }
  }

  // 2. Perform duplicate address/store enrichment
  const uniqueAddresses = new Set(profile.addresses || []);
  if (customerAddress.trim()) {
    uniqueAddresses.add(customerAddress.trim());
  }

  const uniqueStores = new Set(profile.stores || []);
  if (shopId) {
    uniqueStores.add(shopId);
  }

  // 3. Compute Ordering Velocity (recent orders from this phone number in the last 24h across all shops)
  let recentVelocity = 0;
  if (adminDb && shopId) {
    try {
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
      // Query globally across all shops or just in the local shop?
      // Since orders are nested in shops/{shopId}/orders, query the current shop's velocity
      const recentOrders = await adminDb
        .collection('shops')
        .doc(shopId)
        .collection('orders')
        .where('customerPhone', '==', customerPhone)
        .where('createdAt', '>=', oneDayAgo)
        .limit(10)
        .get();
      recentVelocity = recentOrders.size;
    } catch (vErr) {
      console.warn('[Velocity Check Failed]', vErr.message);
    }
  }

  // 4. Calculate final AI Risk Score
  const riskResult = calculateRiskScore(profile, externalStats, recentVelocity);

  // 5. Update/Save internal profile database
  if (adminDb && profileRef) {
    try {
      const updatedProfile = {
        phone: cleanPhone,
        customerName: customerName || profile.customerName || '',
        addresses: Array.from(uniqueAddresses),
        stores: Array.from(uniqueStores),
        externalStats,
        lastProvider: providerUsed,
        lastLookup: admin.firestore.FieldValue.serverTimestamp(),
        riskScore: riskResult.score,
        riskLevel: riskResult.riskLevel,
        // Keep existing statistics
        successOrders: profile.successOrders || 0,
        cancelOrders: profile.cancelOrders || 0,
        returnOrders: profile.returnOrders || 0,
        totalOrders: profile.totalOrders || 0,
        reports: profile.reports || []
      };

      await profileRef.set(updatedProfile, { merge: true });
    } catch (saveErr) {
      console.warn('[Fraud DB] Failed to save profile updates:', saveErr.message);
    }
  }

  return {
    score: riskResult.score,
    riskLevel: riskResult.riskLevel,
    reasons: riskResult.reasons,
    provider: providerUsed || 'InternalHeuristics',
    profileData: {
      successOrders: profile.successOrders || 0,
      cancelOrders: profile.cancelOrders || 0,
      returnOrders: profile.returnOrders || 0,
      totalOrders: profile.totalOrders || 0,
      externalStats,
      reports: profile.reports || []
    }
  };
}
