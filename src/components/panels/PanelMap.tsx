
/// <reference types="@types/google.maps" />
import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { Panel } from '@/types/panel';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import MapControls from './MapControls';
import FullscreenCloseButton from './FullscreenCloseButton';
import { useToast } from '@/hooks/use-toast';
import { fitMapToBounds } from '@/utils/mapUtils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExternalLink } from 'lucide-react';

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
  const componentMountedRef = useRef(true);
  
  // Use our custom hooks
  const {
    mapRef,
    mapContainerRef,
    mapLoaded,
    mapInitialized,
    mapError,
    mountedRef
  } = useGoogleMaps({ miniMap, instanceId });

  const {
    clearMarkersAndInfoWindows,
    addPanelMarkers,
    addSelectedLocationMarker
  } = useMapMarkers({ onAddToCart, instanceId });

  // Track component mounting status
  useEffect(() => {
    componentMountedRef.current = true;
    return () => {
      componentMountedRef.current = false;
    };
  }, []);
  
  // Update markers when data changes, with more careful cleanup
  useEffect(() => {
    if (!mapInitialized || !mapRef.current || !componentMountedRef.current) return;
    
    let markerTimer: NodeJS.Timeout | null = null;
    
    // Add markers with delay to ensure map is ready
    markerTimer = setTimeout(() => {
      if (!componentMountedRef.current || !mapRef.current) return;
      
      // Clear previous markers first
      clearMarkersAndInfoWindows();
      
      // Add panel markers and get bounds
      const bounds = addPanelMarkers(mapRef.current, panels, mapInitialized);
      
      // Add selected location marker if available
      if (selectedLocation && componentMountedRef.current && mapRef.current) {
        addSelectedLocationMarker(mapRef.current, selectedLocation, mapInitialized);
      }
      // If no selected location but have markers, fit bounds
      else if (bounds && !selectedLocation && componentMountedRef.current && mapRef.current) {
        fitMapToBounds(mapRef.current, bounds);
      }
      
      markerTimer = null;
    }, 500);
    
    return () => {
      if (markerTimer) {
        clearTimeout(markerTimer);
      }
      clearMarkersAndInfoWindows();
    };
  }, [panels, selectedLocation, addPanelMarkers, addSelectedLocationMarker, mapInitialized, mapRef, clearMarkersAndInfoWindows]);

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
        {!mapLoaded && !mapError && (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-purple mb-2"></div>
              <p>Carregando mapa...</p>
            </div>
          </div>
        )}
        
        {mapError && (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertTitle>Erro ao carregar o mapa</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  Não foi possível inicializar o Google Maps. Isso pode ocorrer devido a:
                </p>
                <ul className="list-disc list-inside ml-2 space-y-1 text-sm">
                  <li>Chave de API inválida</li>
                  <li>Domínio atual não está autorizado no Google Cloud Console</li>
                  <li>Problemas de conexão com a internet</li>
                </ul>
                <p className="mt-3 text-sm">
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    Verificar configurações no Google Cloud Console
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </p>
              </AlertDescription>
            </Alert>
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
