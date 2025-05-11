
/// <reference types="@types/google.maps" />
import React, { useEffect, useState, useCallback } from 'react';
import type { Panel } from '@/types/panel';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import MapControls from './MapControls';
import FullscreenCloseButton from './FullscreenCloseButton';
import { useToast } from '@/hooks/use-toast';

interface PanelMapProps {
  panels: Panel[];
  selectedLocation: {lat: number, lng: number} | null;
  onAddToCart?: (panel: Panel, duration?: number) => void;
  miniMap?: boolean;
  instanceId?: string;
}

const PanelMap: React.FC<PanelMapProps> = ({ 
  panels, 
  selectedLocation, 
  onAddToCart, 
  miniMap = false,
  instanceId = `map-${Math.random().toString(36).substr(2, 9)}`
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();
  
  // Use our custom hooks
  const {
    mapRef,
    mapContainerRef,
    mapLoaded,
    mapInitialized,
    initializeGoogleMaps,
    initializeMap,
    setMapLoaded,
    mountedRef
  } = useGoogleMaps({ miniMap, instanceId });

  const {
    clearMarkersAndInfoWindows,
    addPanelMarkers,
    addSelectedLocationMarker
  } = useMapMarkers({ onAddToCart, instanceId });

  // Initialize map setup and API loading
  useEffect(() => {
    const setupMap = async () => {
      try {
        await initializeGoogleMaps();
        if (mountedRef.current && mapContainerRef.current) {
          // Center on Brazil if no location is selected
          const defaultCenter = selectedLocation ? 
            { lat: selectedLocation.lat, lng: selectedLocation.lng } : 
            { lat: -15.793889, lng: -47.882778 }; // Default to Brasília
          
          initializeMap(defaultCenter, selectedLocation ? 13 : 5);
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
      clearMarkersAndInfoWindows();
    };
  }, [initializeGoogleMaps, initializeMap, selectedLocation, clearMarkersAndInfoWindows, toast, mountedRef]);
  
  // Update markers when data changes
  useEffect(() => {
    if (mapInitialized && mapRef.current) {
      // Add markers with delay to ensure map is ready
      const timer = setTimeout(() => {
        if (mountedRef.current && mapRef.current) {
          // Add panel markers and get bounds
          const bounds = addPanelMarkers(mapRef.current, panels, mapInitialized);
          
          // Add selected location marker if available
          if (selectedLocation) {
            addSelectedLocationMarker(mapRef.current, selectedLocation, mapInitialized);
          }
          // If no selected location but have markers, fit bounds
          else if (bounds && !selectedLocation) {
            mapRef.current.fitBounds(bounds);
            
            // Don't zoom in too far
            const zoomChangeListener = google.maps.event.addListener(mapRef.current, 'idle', () => {
              if (mapRef.current && mapRef.current.getZoom() as number > 15) {
                mapRef.current.setZoom(15);
              }
              google.maps.event.removeListener(zoomChangeListener);
            });
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [panels, selectedLocation, addPanelMarkers, addSelectedLocationMarker, mapInitialized, mapRef, mountedRef]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'}`} data-map-id={instanceId}>
      <MapControls 
        isFullscreen={isFullscreen} 
        toggleFullscreen={toggleFullscreen} 
        miniMap={miniMap} 
      />
      
      <div ref={mapContainerRef} className="w-full h-full">
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-purple mb-2"></div>
              <p>Carregando mapa...</p>
            </div>
          </div>
        )}
      </div>
      
      <FullscreenCloseButton 
        isFullscreen={isFullscreen} 
        toggleFullscreen={toggleFullscreen} 
      />
    </div>
  );
};

export default PanelMap;
