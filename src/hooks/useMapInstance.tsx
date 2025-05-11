
import { useCallback, useRef } from 'react';

interface UseMapInstanceProps {
  miniMap?: boolean;
}

/**
 * Hook for creating and managing a Google Map instance
 */
export const useMapInstance = ({ miniMap }: UseMapInstanceProps = {}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Initialize map with safety checks
   */
  const initializeMap = useCallback((defaultCenter: google.maps.LatLngLiteral, zoom: number) => {
    if (!mapContainerRef.current || !window.google || !window.google.maps) {
      return false;
    }

    try {
      // Check if map container is still in the DOM
      if (!document.body.contains(mapContainerRef.current)) {
        return false;
      }

      const mapOptions: google.maps.MapOptions = {
        center: defaultCenter,
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi", // Points of interest
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ],
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP
        }
      };
      
      // Create map and store reference
      mapRef.current = new google.maps.Map(mapContainerRef.current, mapOptions);
      
      return true;
    } catch (error) {
      console.error('Error initializing map:', error);
      return false;
    }
  }, []);

  /**
   * Clean up map instance and event listeners
   */
  const cleanupMap = useCallback(() => {
    if (mapRef.current && window.google && window.google.maps && google.maps.event) {
      try {
        google.maps.event.clearInstanceListeners(mapRef.current);
        mapRef.current = null;
      } catch (error) {
        console.error('Error cleaning up map:', error);
      }
    }
  }, []);

  return {
    mapRef,
    mapContainerRef,
    initializeMap,
    cleanupMap
  };
};
