
import { useMapLifecycle } from './useMapLifecycle';

interface UseGoogleMapsProps {
  miniMap?: boolean;
  instanceId: string;
}

/**
 * Main hook for Google Maps integration that combines all map-related hooks
 */
export const useGoogleMaps = ({ miniMap, instanceId }: UseGoogleMapsProps) => {
  // Use our main lifecycle hook which internally uses the other hooks
  const {
    mapRef,
    mapContainerRef,
    mapLoaded,
    mapInitialized,
    setMapLoaded,
    mountedRef
  } = useMapLifecycle({ miniMap, selectedLocation: null, instanceId });

  // Re-export the same interface as before to maintain backward compatibility
  return {
    mapRef,
    mapContainerRef,
    mapLoaded,
    mapInitialized,
    // Include these methods for backwards compatibility with existing code
    initializeGoogleMaps: async () => {
      // This is now handled by useMapLifecycle
      const { initializeGoogleMapsAPI } = await import('./useGoogleMapsAPI');
      return initializeGoogleMapsAPI();
    },
    initializeMap: (center, zoom) => {
      // This is now handled by useMapLifecycle
      const { useMapInstance } = require('./useMapInstance');
      const { initializeMap } = useMapInstance();
      return initializeMap(center, zoom);
    },
    setMapLoaded,
    mountedRef
  };
};
