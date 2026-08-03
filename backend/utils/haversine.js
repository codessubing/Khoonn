/**
 * Calculates the great-circle distance between two points 
 * on Earth specified by latitude and longitude using the Haversine formula.
 * 
 * @param {number} lat1 - Latitude of point 1 in decimal degrees
 * @param {number} lon1 - Longitude of point 1 in decimal degrees
 * @param {number} lat2 - Latitude of point 2 in decimal degrees
 * @param {number} lon2 - Longitude of point 2 in decimal degrees
 * @returns {number} Distance in kilometers
 */
export function calculateHaversine(lat1, lon1, lat2, lon2) {
  // Earth's mean radius in kilometers
  const R = 6371; 
  
  // Convert degrees to radians
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  // Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Converts degrees to radians
 * @param {number} degrees 
 * @returns {number} radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Formats distance for human-readable display
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted string (e.g., "1.2 km" or "850 m")
 */
export function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}