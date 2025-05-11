
/**
 * Centers a map on a location with animation
 */
export const centerMapOnLocation = (
  map: google.maps.Map | null, 
  location: { lat: number, lng: number },
  zoom: number = 14
) => {
  if (!map || !location) return;
  
  try {
    map.setCenter({ lat: location.lat, lng: location.lng });
    map.setZoom(zoom);
  } catch (error) {
    console.error('Error centering map:', error);
  }
};

/**
 * Fits the map to bounds with protection against zoom being too close
 */
export const fitMapToBounds = (
  map: google.maps.Map | null,
  bounds: google.maps.LatLngBounds | null,
  maxZoom: number = 15
) => {
  if (!map || !bounds) return;
  
  try {
    map.fitBounds(bounds);
    
    // Don't zoom in too far
    const zoomChangeListener = google.maps.event.addListener(map, 'idle', () => {
      if (map && map.getZoom() as number > maxZoom) {
        map.setZoom(maxZoom);
      }
      google.maps.event.removeListener(zoomChangeListener);
    });
  } catch (error) {
    console.error('Error fitting map to bounds:', error);
  }
};

/**
 * Safely creates a LatLng object
 */
export const createLatLng = (lat: number, lng: number): google.maps.LatLng | null => {
  try {
    if (!window.google || !window.google.maps) return null;
    return new google.maps.LatLng(lat, lng);
  } catch (error) {
    console.error('Error creating LatLng:', error);
    return null;
  }
};
