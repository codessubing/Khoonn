// backend/services/etaCalculator.js
import TransitTracking from "../models/transitTrackingModel.js";
import BloodCamp from "../models/bloodCampModel.js";

/**
 * Calculate estimated arrival time using Haversine distance + average speed
 * @param {number[]} donorCoords - [longitude, latitude]
 * @param {object} campLocation - { coordinates: [lng, lat] }
 * @returns {object} { distanceKm, etaMinutes, confidence }
 */
export function calculateETA(donorCoords, campLocation) {
  if (!donorCoords || !campLocation?.coordinates) {
    return { distanceKm: null, etaMinutes: null, confidence: "low" };
  }

  const R = 6371; // Earth's radius in km
  const dLat = (campLocation.coordinates[1] - donorCoords[1]) * Math.PI / 180;
  const dLon = (campLocation.coordinates[0] - donorCoords[0]) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(donorCoords[1] * Math.PI / 180) * Math.cos(campLocation.coordinates[1] * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanceKm = R * c;
  
  // Adaptive speed based on distance (urban vs rural assumption)
  const avgSpeedKmh = distanceKm < 5 ? 25 : distanceKm < 20 ? 40 : 60;
  const etaMinutes = Math.round((distanceKm / avgSpeedKmh) * 60);
  
  // Confidence degrades with distance and low battery
  let confidence = "high";
  if (distanceKm > 15 || etaMinutes > 45) confidence = "medium";
  if (distanceKm > 30 || etaMinutes > 90) confidence = "low";

  return { 
    distanceKm: Math.round(distanceKm * 10) / 10, 
    etaMinutes, 
    confidence 
  };
}

/**
 * Get predicted arrival wave for next 60 minutes
 */
export async function getArrivalWave(campId) {
  const camp = await BloodCamp.findById(campId).select("location");
  if (!camp) return [];

  const activeDonors = await TransitTracking.find({
    camp: campId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).select("location batteryLevel updatedAt donor");

  // Populate donor details
  const populated = await TransitTracking.populate(activeDonors, { path: 'donor', select: 'fullName phone bloodGroup' });

  return populated.map(tracking => {
    const coords = tracking.location?.coordinates;
    const eta = calculateETA(coords, camp.location);
    return {
      donor: tracking.donor,
      ...eta,
      batteryLevel: tracking.batteryLevel,
      lastUpdate: tracking.updatedAt,
      isImminent: eta.etaMinutes !== null && eta.etaMinutes <= 15
    };
  }).sort((a, b) => (a.etaMinutes || 999) - (b.etaMinutes || 999));
}