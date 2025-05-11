
import { useRef, useCallback } from 'react';

/**
 * Hook for managing cleanup of Google Maps markers and info windows
 */
export const useMapCleanup = () => {
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);

  /**
   * Safely clears all markers and info windows
   */
  const clearMarkersAndInfoWindows = useCallback(() => {
    // Safely clear markers
    if (markersRef.current && markersRef.current.length > 0) {
      markersRef.current.forEach(marker => {
        if (marker) {
          try {
            // Safe event listener cleanup
            if (window.google && window.google.maps && google.maps.event) {
              google.maps.event.clearInstanceListeners(marker);
            }
            // Remove marker from map safely
            marker.setMap(null);
          } catch (error) {
            console.error('Error clearing marker:', error);
          }
        }
      });
      markersRef.current = [];
    }
    
    // Close and clear info windows safely
    if (infoWindowsRef.current && infoWindowsRef.current.length > 0) {
      infoWindowsRef.current.forEach(infoWindow => {
        if (infoWindow) {
          try {
            infoWindow.close();
            if (window.google && window.google.maps && google.maps.event) {
              google.maps.event.clearInstanceListeners(infoWindow);
            }
          } catch (error) {
            console.error('Error clearing infoWindow:', error);
          }
        }
      });
      infoWindowsRef.current = [];
    }
  }, []);

  return {
    markersRef,
    infoWindowsRef,
    clearMarkersAndInfoWindows
  };
};
