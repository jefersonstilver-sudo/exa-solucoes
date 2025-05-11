
import { useCallback } from 'react';
import { createSelectedLocationIcon } from '@/utils/mapMarkerUtils';

interface UseLocationMarkerProps {
  markersRef: React.MutableRefObject<google.maps.Marker[]>;
}

/**
 * Hook for managing location markers on a Google Map
 */
export const useLocationMarker = ({ markersRef }: UseLocationMarkerProps) => {
  
  /**
   * Adds a marker for the selected location
   */
  const addSelectedLocationMarker = useCallback((
    map: google.maps.Map | null,
    location: {lat: number, lng: number},
    mapInitialized: boolean
  ) => {
    if (!map || !location || !window.google || !window.google.maps || !mapInitialized) {
      return;
    }
    
    try {
      // Create marker for selected location
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        icon: createSelectedLocationIcon(),
        title: 'Selected location',
        zIndex: 1000
      });
      
      // Store for cleanup
      markersRef.current.push(marker);
      
      // Center map on selected location
      map.setCenter({ lat: location.lat, lng: location.lng });
      map.setZoom(14);
    } catch (error) {
      console.error('Error adding selected location marker:', error);
    }
  }, [markersRef]);

  return { addSelectedLocationMarker };
};
