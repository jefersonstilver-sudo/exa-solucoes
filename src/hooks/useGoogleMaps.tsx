
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseGoogleMapsProps {
  miniMap?: boolean;
  instanceId: string;
}

export const useGoogleMaps = ({ miniMap, instanceId }: UseGoogleMapsProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mountedRef = useRef(true);

  // Initialize Google Maps API safely
  const initializeGoogleMaps = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // If API already loaded, resolve immediately
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      // Set up callback for when API loads
      window.initMap = () => {
        resolve();
      };

      // Check if script already exists
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        return; // Script is loading, wait for callback
      }

      try {
        // Create and add script element
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAVQPvo8asVwVVuWBxReck6ohF9vvDR_qM&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onerror = (e) => {
          reject(new Error('Failed to load Google Maps API'));
        };
        document.head.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Initialize map with safety checks
  const initializeMap = useCallback((defaultCenter: google.maps.LatLngLiteral, zoom: number) => {
    if (!mapContainerRef.current || !window.google || !window.google.maps) {
      return;
    }

    try {
      // Check if map container is still in the DOM
      if (!document.body.contains(mapContainerRef.current)) {
        return;
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
      
      // Set state to indicate map is loaded
      if (mountedRef.current) {
        setMapLoaded(true);
        setMapInitialized(true);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);

  // Setup and cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      // Clear map instance and event listeners
      if (mapRef.current && window.google && window.google.maps && google.maps.event) {
        try {
          google.maps.event.clearInstanceListeners(mapRef.current);
        } catch (error) {
          console.error('Error clearing map event listeners:', error);
        }
      }
      
      // Set map reference to null
      mapRef.current = null;
    };
  }, []);

  return {
    mapRef,
    mapContainerRef,
    mapLoaded,
    mapInitialized,
    initializeGoogleMaps,
    initializeMap,
    setMapLoaded,
    mountedRef
  };
};
