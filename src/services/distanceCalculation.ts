/**
 * Service for calculating distances between geographic points
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 First coordinate point
 * @param point2 Second coordinate point
 * @returns Distance in meters
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 * @param distanceInMeters Distance in meters
 * @returns Formatted string (e.g., "536m" or "1.2km")
 */
export function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  }
}

/**
 * Calculate distance from business location to a building
 * @param businessLocation Business coordinates
 * @param building Building object with latitude/longitude
 * @returns Formatted distance string or null if coordinates missing
 */
export function calculateDistanceToBuilding(
  businessLocation: Coordinates,
  building: { latitude?: number; longitude?: number; manual_latitude?: number; manual_longitude?: number }
): string | null {
  // Priority: manual coordinates > automatic coordinates
  const buildingLat = building.manual_latitude || building.latitude;
  const buildingLng = building.manual_longitude || building.longitude;
  
  if (!buildingLat || !buildingLng) {
    return null;
  }

  const distance = calculateDistance(
    businessLocation,
    { lat: buildingLat, lng: buildingLng }
  );

  return formatDistance(distance);
}

/**
 * Sort buildings by distance from business location
 * @param buildings Array of buildings
 * @param businessLocation Business coordinates
 * @returns Buildings sorted by distance (closest first)
 */
export function sortBuildingsByDistance<T extends { latitude?: number; longitude?: number; manual_latitude?: number; manual_longitude?: number }>(
  buildings: T[],
  businessLocation: Coordinates
): T[] {
  return [...buildings].sort((a, b) => {
    const distanceA = getDistanceValue(a, businessLocation);
    const distanceB = getDistanceValue(b, businessLocation);
    
    // Buildings without coordinates go to the end
    if (distanceA === null && distanceB === null) return 0;
    if (distanceA === null) return 1;
    if (distanceB === null) return -1;
    
    return distanceA - distanceB;
  });
}

/**
 * Get numeric distance value for sorting
 */
function getDistanceValue(
  building: { latitude?: number; longitude?: number; manual_latitude?: number; manual_longitude?: number },
  businessLocation: Coordinates
): number | null {
  const buildingLat = building.manual_latitude || building.latitude;
  const buildingLng = building.manual_longitude || building.longitude;
  
  if (!buildingLat || !buildingLng) {
    return null;
  }

  return calculateDistance(
    businessLocation,
    { lat: buildingLat, lng: buildingLng }
  );
}