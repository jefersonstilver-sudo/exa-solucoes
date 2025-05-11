
import { useCallback } from 'react';
import { Panel } from '@/types/panel';
import { createPanelMarkerIcon, createPanelInfoWindowContent, clearMapEventListeners } from '@/utils/mapMarkerUtils';

interface UsePanelMarkersProps {
  markersRef: React.MutableRefObject<google.maps.Marker[]>;
  infoWindowsRef: React.MutableRefObject<google.maps.InfoWindow[]>;
  onAddToCart?: (panel: Panel, duration?: number) => void;
  instanceId: string;
}

/**
 * Hook for adding panel markers to a Google Map
 */
export const usePanelMarkers = ({ 
  markersRef, 
  infoWindowsRef, 
  onAddToCart, 
  instanceId 
}: UsePanelMarkersProps) => {
  
  /**
   * Adds markers for panels to the map and returns bounds
   */
  const addPanelMarkers = useCallback((
    map: google.maps.Map | null,
    panels: Panel[],
    mapInitialized: boolean
  ) => {
    if (!map || !window.google || !window.google.maps || !mapInitialized) {
      return null;
    }
    
    try {
      const bounds = new google.maps.LatLngBounds();
      let hasValidMarkers = false;
      
      // Add new markers for each panel
      panels.forEach((panel) => {
        if (panel.buildings?.latitude && panel.buildings?.longitude) {
          const marker = new google.maps.Marker({
            position: { lat: panel.buildings.latitude, lng: panel.buildings.longitude },
            map: map,
            icon: createPanelMarkerIcon(panel.status),
            title: panel.buildings.nome
          });
          
          // Create info window for marker
          const infoWindow = new google.maps.InfoWindow({
            content: createPanelInfoWindowContent(panel, instanceId)
          });
          
          // Add click listener to marker
          marker.addListener('click', () => {
            // Close any open info windows
            infoWindowsRef.current.forEach(window => {
              if (window) {
                try {
                  window.close();
                } catch (e) {
                  console.error('Error closing info window:', e);
                }
              }
            });
            
            // Open this info window
            infoWindow.open(map, marker);
            
            // Add event listener to button when info window is opened
            google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
              const buttonElement = document.getElementById(`add-to-cart-${panel.id}-${instanceId}`);
              if (buttonElement) {
                buttonElement.addEventListener('click', (e) => {
                  e.stopPropagation();
                  if (onAddToCart) {
                    onAddToCart(panel);
                    infoWindow.close();
                  }
                });
              }
            });
          });
          
          // Store references for cleanup
          markersRef.current.push(marker);
          infoWindowsRef.current.push(infoWindow);
          
          // Add to bounds for auto-centering
          bounds.extend({ lat: panel.buildings.latitude, lng: panel.buildings.longitude });
          hasValidMarkers = true;
        }
      });
      
      // Return the bounds for map adjustment
      return hasValidMarkers ? bounds : null;
    } catch (error) {
      console.error('Error adding markers:', error);
      return null;
    }
  }, [instanceId, onAddToCart, markersRef, infoWindowsRef]);

  return { addPanelMarkers };
};
