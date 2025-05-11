
/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Info, Maximize, Minimize } from 'lucide-react';
import type { Panel } from '@/types/panel';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface PanelMapProps {
  panels: Panel[];
  selectedLocation: {lat: number, lng: number} | null;
  onAddToCart?: (panel: Panel, duration?: number) => void;
  miniMap?: boolean;
  instanceId?: string; // Unique ID for this map instance
}

const PanelMap: React.FC<PanelMapProps> = ({ 
  panels, 
  selectedLocation, 
  onAddToCart, 
  miniMap = false,
  instanceId = `map-${Math.random().toString(36).substr(2, 9)}`
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const { toast } = useToast();
  const mountedRef = useRef(true); // Track if component is mounted
  
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
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || !window.google || !window.google.maps) {
      return;
    }

    try {
      // Check if map container is still in the DOM
      if (!document.body.contains(mapContainerRef.current)) {
        return;
      }

      // Center on Brazil if no location is selected
      const defaultCenter = selectedLocation ? 
        { lat: selectedLocation.lat, lng: selectedLocation.lng } : 
        { lat: -15.793889, lng: -47.882778 }; // Default to Brasília
      
      const mapOptions: google.maps.MapOptions = {
        center: defaultCenter,
        zoom: selectedLocation ? 13 : 5,
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
  }, [selectedLocation]);
  
  // Add markers for panels
  const addMarkers = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps || !mapInitialized) {
      return;
    }
    
    try {
      // Clear existing markers first
      clearMarkersAndInfoWindows();
      
      // Add new markers for each panel
      panels.forEach((panel, index) => {
        if (panel.buildings?.latitude && panel.buildings?.longitude) {
          const marker = new google.maps.Marker({
            position: { lat: panel.buildings.latitude, lng: panel.buildings.longitude },
            map: mapRef.current,
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
            infoWindow.open(mapRef.current, marker);
            
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
        }
      });
      
      // Adjust bounds if there are markers
      if (markersRef.current.length > 0 && !selectedLocation && mapRef.current) {
        const bounds = new google.maps.LatLngBounds();
        markersRef.current.forEach(marker => {
          if (marker && marker.getPosition()) {
            bounds.extend(marker.getPosition() as google.maps.LatLng);
          }
        });
        
        mapRef.current.fitBounds(bounds);
        
        // Don't zoom in too far
        const listener = google.maps.event.addListener(mapRef.current, 'idle', () => {
          if (mapRef.current && mapRef.current.getZoom() as number > 15) {
            mapRef.current.setZoom(15);
          }
          google.maps.event.removeListener(listener);
        });
      }
    } catch (error) {
      console.error('Error adding markers:', error);
    }
  }, [panels, selectedLocation, clearMarkersAndInfoWindows, onAddToCart, instanceId, mapInitialized]);
  
  // Add marker for selected location
  const addSelectedLocationMarker = useCallback(() => {
    if (!mapRef.current || !selectedLocation || !window.google || !window.google.maps || !mapInitialized) {
      return;
    }
    
    try {
      // Create marker for selected location
      const marker = new google.maps.Marker({
        position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        map: mapRef.current,
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
      mapRef.current.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      mapRef.current.setZoom(14);
    } catch (error) {
      console.error('Error adding selected location marker:', error);
    }
  }, [selectedLocation, mapInitialized]);
  
  // Setup and cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    // Load Google Maps and initialize map
    const setupMap = async () => {
      try {
        await initializeGoogleMaps();
        if (mountedRef.current && mapContainerRef.current) {
          initializeMap();
        }
      } catch (error) {
        console.error('Error setting up map:', error);
      }
    };
    
    setupMap();
    
    // Cleanup function to prevent memory leaks and DOM issues
    return () => {
      mountedRef.current = false;
      
      // Clear markers and info windows
      clearMarkersAndInfoWindows();
      
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
  }, [initializeMap, initializeGoogleMaps, clearMarkersAndInfoWindows]);
  
  // Update markers when data changes
  useEffect(() => {
    if (mountedRef.current && mapInitialized && mapRef.current) {
      // Add markers with delay to ensure map is ready
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          addMarkers();
          
          if (selectedLocation) {
            addSelectedLocationMarker();
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [panels, selectedLocation, addMarkers, addSelectedLocationMarker, mapInitialized]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'}`} data-map-id={instanceId}>
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? 'Sair do modo tela cheia' : 'Ver em tela cheia'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {!miniMap && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Clique nos marcadores para adicionar o painel ao carrinho.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
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
      
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
        >
          <Button 
            className="bg-[#7C3AED] hover:bg-[#00F894] transition-all hover:scale-105 duration-200"
            onClick={toggleFullscreen}
          >
            Fechar Mapa
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default PanelMap;
