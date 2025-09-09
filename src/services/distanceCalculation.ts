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
 * Safely pick and validate effective building coordinates
 */
export function getEffectiveBuildingCoords(
  building: { latitude?: number; longitude?: number; manual_latitude?: number; manual_longitude?: number }
): Coordinates | null {
  console.log('🔍 [COORDS] Validando coordenadas para:', { 
    manual_lat: building.manual_latitude, 
    manual_lng: building.manual_longitude,
    lat: building.latitude, 
    lng: building.longitude 
  });

  const pick = (v: unknown) => (typeof v === 'number' ? v : undefined);
  const lat = pick(building.manual_latitude) ?? pick(building.latitude);
  const lng = pick(building.manual_longitude) ?? pick(building.longitude);

  console.log('🔍 [COORDS] Coordenadas escolhidas:', { lat, lng });

  if (!Number.isFinite(lat as number) || !Number.isFinite(lng as number)) {
    console.log('❌ [COORDS] REJEITADO - Coordenadas não são números finitos');
    return null;
  }
  
  const latNum = lat as number;
  const lngNum = lng as number;

  // Valid geographic ranges and avoid (0,0) placeholder
  if (latNum < -90 || latNum > 90) {
    console.log('❌ [COORDS] REJEITADO - Latitude fora do range:', latNum);
    return null;
  }
  if (lngNum < -180 || lngNum > 180) {
    console.log('❌ [COORDS] REJEITADO - Longitude fora do range:', lngNum);
    return null;
  }
  if (latNum === 0 && lngNum === 0) {
    console.log('❌ [COORDS] REJEITADO - Coordenadas (0,0)');
    return null;
  }

  console.log('✅ [COORDS] APROVADO - Coordenadas válidas:', { lat: latNum, lng: lngNum });
  return { lat: latNum, lng: lngNum };
}

/**
 * Calculate distance from business location to a building and format it
 */
export function calculateDistanceToBuilding(
  businessLocation: Coordinates,
  building: { latitude?: number; longitude?: number; manual_latitude?: number; manual_longitude?: number }
): string | null {
  const coords = getEffectiveBuildingCoords(building);
  if (!coords) return null;

  const distance = calculateDistance(businessLocation, coords);
  return formatDistance(distance);
}

/**
 * Get numeric distance in meters from business location to a building
 */
export function getNumericDistanceToBuilding(
  businessLocation: Coordinates,
  building: { latitude?: number; longitude?: number; manual_latitude?: number; manual_longitude?: number }
): number | null {
  const coords = getEffectiveBuildingCoords(building);
  if (!coords) return null;
  return calculateDistance(businessLocation, coords);
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
  const coords = getEffectiveBuildingCoords(building);
  if (!coords) return null;
  return calculateDistance(businessLocation, coords);
}