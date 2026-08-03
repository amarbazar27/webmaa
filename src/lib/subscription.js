/**
 * Central utility to check if a shop's subscription is active
 * 
 * Rules:
 * 1. If loading or no shop data, fallback to active (prevent UI flash)
 * 2. Superadmin always bypasses restrictions
 * 3. If globalConfig has subscriptionsEnabled === false, all features remain unlocked
 * 4. Active subscription requires shop.subscriptionStatus === 'active'
 * 5. If shop.subscriptionExpiresAt exists, it must not be expired in the past
 * 
 * @param {Object} shop - Shop document data
 * @param {Object} userData - User document data
 * @param {Object} globalConfig - Global platform configuration
 * @returns {boolean}
 */
export function checkIsSubscriptionActive(shop, userData, globalConfig = null) {
  if (!shop) return true;
  if (userData?.role === 'superadmin') return true;

  // If global subscriptions system is explicitly turned off by superadmin
  if (globalConfig && globalConfig.subscriptionsEnabled === false) {
    return true;
  }

  // If subscription status is not active (e.g. 'none', 'expired', 'pending', undefined)
  if (!shop.subscriptionStatus || shop.subscriptionStatus !== 'active') {
    return false;
  }

  // If expiration date is set, verify it is still valid
  if (shop.subscriptionExpiresAt) {
    const expiryDate = shop.subscriptionExpiresAt.toDate 
      ? shop.subscriptionExpiresAt.toDate() 
      : new Date(shop.subscriptionExpiresAt);
    
    if (isNaN(expiryDate.getTime()) || expiryDate.getTime() < Date.now()) {
      return false;
    }
  }

  return true;
}
