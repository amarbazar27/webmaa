/**
 * Utility to calculate dynamic delivery fee based on:
 * 1. Location (Inside Dhaka, Outside Dhaka, Dhaka Sub-area, Custom District Zones)
 * 2. Weight (Base weight limit, extra per KG, or Weight Tiers)
 */

export const calculateDeliveryFee = (deliveryConfig = {}, { district = '', totalWeightKg = 1 } = {}) => {
  const cfg = deliveryConfig || {};
  
  // 1. Determine base location fee
  let baseFee = Number(cfg.advanceFee) || 60;
  const cleanDistrict = (district || '').trim().toLowerCase();

  // Check custom zones first
  if (Array.isArray(cfg.customZones) && cfg.customZones.length > 0 && cleanDistrict) {
    const matchedZone = cfg.customZones.find(zone => 
      Array.isArray(zone.districts) && zone.districts.some(d => cleanDistrict.includes(d.toLowerCase()))
    );
    if (matchedZone && matchedZone.fee !== undefined) {
      baseFee = Number(matchedZone.fee);
    } else if (cleanDistrict.includes('dhaka') || cleanDistrict.includes('ঢাকা')) {
      baseFee = Number(cfg.insideDhakaFee ?? cfg.advanceFee ?? 60);
    } else if (cleanDistrict.includes('gazipur') || cleanDistrict.includes('গাজীপুর') || cleanDistrict.includes('narayanganj') || cleanDistrict.includes('নারায়ণগঞ্জ')) {
      baseFee = Number(cfg.subDhakaFee ?? 100);
    } else {
      baseFee = Number(cfg.outsideDhakaFee ?? 120);
    }
  } else if (cleanDistrict) {
    // Standard Inside/Outside Dhaka
    if (cleanDistrict.includes('dhaka') || cleanDistrict.includes('ঢাকা')) {
      baseFee = Number(cfg.insideDhakaFee ?? cfg.advanceFee ?? 60);
    } else if (cleanDistrict.includes('gazipur') || cleanDistrict.includes('গাজীপুর') || cleanDistrict.includes('narayanganj') || cleanDistrict.includes('নারায়ণগঞ্জ')) {
      baseFee = Number(cfg.subDhakaFee ?? 100);
    } else {
      baseFee = Number(cfg.outsideDhakaFee ?? 120);
    }
  }

  // 2. Add Weight Surcharges if enabled
  let weightSurcharge = 0;
  if (cfg.enableWeightPricing) {
    const weight = Number(totalWeightKg) || 1;
    
    // Check if custom weight tiers exist
    if (Array.isArray(cfg.weightTiers) && cfg.weightTiers.length > 0) {
      const matchedTier = cfg.weightTiers.find(t => weight <= Number(t.maxKg));
      if (matchedTier) {
        return Number(matchedTier.fee);
      } else {
        const highestTier = cfg.weightTiers[cfg.weightTiers.length - 1];
        const extraWeight = Math.ceil(weight - Number(highestTier.maxKg));
        const extraRate = Number(cfg.extraFeePerKg) || 20;
        return Number(highestTier.fee) + (extraWeight * extraRate);
      }
    } else {
      const baseWeight = Number(cfg.baseWeightKg) || 1;
      if (weight > baseWeight) {
        const extraWeight = Math.ceil(weight - baseWeight);
        const extraRate = Number(cfg.extraFeePerKg) || 20;
        weightSurcharge = extraWeight * extraRate;
      }
    }
  }

  return baseFee + weightSurcharge;
};
