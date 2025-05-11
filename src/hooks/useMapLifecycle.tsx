
import { useState, useEffect, useRef } from 'react';
import { initializeGoogleMapsAPI } from './useGoogleMapsAPI';
import { useMapInstance } from './useMapInstance';
import { useToast } from './use-toast';

interface UseMapLifecycleProps {
  miniMap?: boolean;
  selectedLocation?: { lat: number, lng: number } | null;
  instanceId: string;
}

/**
 * Hook for managing the complete lifecycle of a Google Map
 */
export const useMapLifecycle = ({ miniMap, selectedLocation, instanceId }: UseMapLifecycleProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mountedRef = useRef(true);
  const { toast } = useToast();
  
  // Use our more focused hooks
  const { mapRef, mapContainerRef, initializeMap, cleanupMap } = useMapInstance({ miniMap });

  // Setup and cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    const setupMap = async () => {
      try {
        await initializeGoogleMapsAPI();
        if (mountedRef.current && mapContainerRef.current) {
          // Center on Brazil if no location is selected
          const defaultCenter = selectedLocation ? 
            { lat: selectedLocation.lat, lng: selectedLocation.lng } : 
            { lat: -15.793889, lng: -47.882778 }; // Default to Brasília
          
          const success = initializeMap(defaultCenter, selectedLocation ? 13 : 5);
          
          if (success && mountedRef.current) {
            setMapLoaded(true);
            setMapInitialized(true);
          }
        }
      } catch (error) {
        console.error('Error setting up map:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar o mapa",
          description: "Não foi possível inicializar o Google Maps. Por favor, tente novamente."
        });
      }
    };
    
    setupMap();
    
    return () => {
      mountedRef.current = false;
      cleanupMap();
    };
  }, [initializeMap, selectedLocation, cleanupMap, toast]);

  return {
    mapRef,
    mapContainerRef,
    mapLoaded,
    mapInitialized,
    setMapLoaded,
    mountedRef
  };
};
