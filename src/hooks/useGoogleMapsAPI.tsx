
import { useCallback } from 'react';

/**
 * Initialize Google Maps API safely
 */
export const initializeGoogleMapsAPI = () => {
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
};

/**
 * Hook for initializing Google Maps API
 */
export const useGoogleMapsAPI = () => {
  /**
   * Initialize Google Maps API safely (wrapper around the standalone function)
   */
  const initializeGoogleMaps = useCallback(() => {
    return initializeGoogleMapsAPI();
  }, []);

  return { initializeGoogleMapsAPI: initializeGoogleMaps };
};
