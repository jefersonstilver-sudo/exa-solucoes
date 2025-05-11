
import { useRef, useCallback } from 'react';
import type { Panel } from '@/types/panel';

interface UseMapMarkersProps {
  onAddToCart?: (panel: Panel, duration?: number) => void;
  instanceId: string;
}

export const useMapMarkers = ({ onAddToCart, instanceId }: UseMapMarkersProps) => {
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);

  // Safely clear markers and info windows with DOM safety checks
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

  // Add markers for panels
  const addPanelMarkers = useCallback((
    map: google.maps.Map | null,
    panels: Panel[],
    mapInitialized: boolean
  ) => {
    if (!map || !window.google || !window.google.maps || !mapInitialized) {
      return;
    }
    
    try {
      // Clear existing markers first
      clearMarkersAndInfoWindows();
      
      const bounds = new google.maps.LatLngBounds();
      let hasValidMarkers = false;
      
      // Add new markers for each panel
      panels.forEach((panel, index) => {
        if (panel.buildings?.latitude && panel.buildings?.longitude) {
          const marker = new google.maps.Marker({
            position: { lat: panel.buildings.latitude, lng: panel.buildings.longitude },
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: panel.status === 'online' ? '#10B981' : '#F59E0B',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
            },
            title: panel.buildings.nome
          });
          
          // Create info window for marker
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2 min-w-[220px]">
                <h4 class="font-semibold text-sm">${panel.buildings.nome}</h4>
                <p class="text-xs text-gray-500 mb-2">${panel.buildings.endereco}, ${panel.buildings.bairro}</p>
                <p class="text-xs mb-1">Status: <span class="font-semibold ${
                  panel.status === 'online' ? 'text-green-600' : 'text-amber-600'
                }">${panel.status === 'online' ? 'Ativo' : 'Instalando'}</span></p>
                <div class="flex justify-between text-xs text-gray-500">
                  <span>${panel.resolucao || '1080p'}</span>
                  <span>Visualizações: 1.2k/mês</span>
                </div>
                <button id="add-to-cart-${panel.id}-${instanceId}" class="mt-2 text-xs bg-[#7C3AED] hover:bg-[#00F894] text-white px-2 py-1 rounded w-full transition-all hover:scale-105 duration-200">
                  Adicionar ao Carrinho
                </button>
              </div>
            `
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
  }, [clearMarkersAndInfoWindows, instanceId, onAddToCart]);

  // Add marker for selected location
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
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#7C3AED', // purple
          fillOpacity: 0.7,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
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
  }, []);

  return {
    markersRef,
    infoWindowsRef,
    clearMarkersAndInfoWindows,
    addPanelMarkers,
    addSelectedLocationMarker
  };
};
