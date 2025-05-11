
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

// Global variables to track Google Maps API loading state
let googleMapsLoaded = false;
let googleMapsLoading = false;

interface PanelMapProps {
  panels: Panel[];
  selectedLocation: {lat: number, lng: number} | null;
  onAddToCart?: (panel: Panel, duration?: number) => void;
  miniMap?: boolean;
}

const PanelMap: React.FC<PanelMapProps> = ({ panels, selectedLocation, onAddToCart, miniMap = false }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapInstanceIdRef = useRef<string>(`map-${Math.random().toString(36).substr(2, 9)}`);
  const { toast } = useToast();
  const mountedRef = useRef(true); // Track if component is mounted

  // Safely load Google Maps script
  const loadGoogleMapsScript = useCallback(() => {
    // If already loaded, return resolved Promise
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      window.mapsApiLoaded = true;
      setApiLoaded(true);
      console.log(`Google Maps already loaded - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      return Promise.resolve();
    }
    
    // If already loading, wait for it
    if (googleMapsLoading || document.querySelector('script[src*="maps.googleapis.com/maps/api"]')) {
      console.log(`Google Maps script already loading - waiting - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      
      return new Promise<void>((resolve) => {
        const originalCallback = window.googleMapsCallback;
        window.googleMapsCallback = () => {
          if (originalCallback) originalCallback();
          
          if (mountedRef.current) {
            setApiLoaded(true);
          }
          console.log(`Google Maps loaded (via callback) - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
          resolve();
        };
        
        // Check periodically if already loaded
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            googleMapsLoaded = true;
            window.mapsApiLoaded = true;
            if (mountedRef.current) {
              setApiLoaded(true);
            }
            console.log(`Google Maps loaded (periodic check) - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
            resolve();
          }
        }, 100);
        
        // Timeout to avoid infinite loops
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(); // Resolve even if not loaded to avoid hanging
        }, 10000);
      });
    }
    
    // Start loading the script
    console.log(`Starting Google Maps loading - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    googleMapsLoading = true;
    
    return new Promise<void>((resolve) => {
      // Callback for when Google Maps is loaded
      window.initMap = () => {
        console.log(`Google Maps loaded successfully - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
        googleMapsLoaded = true;
        window.mapsApiLoaded = true;
        if (mountedRef.current) {
          setApiLoaded(true);
        }
        
        // Call global callback if it exists
        if (window.googleMapsCallback) {
          window.googleMapsCallback();
        }
        
        resolve();
      };
      
      // Check if script already exists
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        console.log('Google Maps script tag already exists, not adding another one');
        return;
      }
      
      // Create and add the script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAVQPvo8asVwVVuWBxReck6ohF9vvDR_qM&libraries=places&loading=async&callback=initMap`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';
      
      script.onerror = (error) => {
        console.error('Failed to load Google Maps script:', error);
        if (mountedRef.current) {
          toast({
            variant: "destructive",
            title: "Error loading map",
            description: "Could not load Google Maps. Try reloading the page.",
          });
        }
        googleMapsLoading = false;
        resolve(); // Resolve even with error to not block
      };
      
      document.head.appendChild(script);
    });
  }, [miniMap, toast]);

  // Safely clear markers and info windows with DOM safety checks
  const clearMarkersAndInfoWindows = useCallback(() => {
    console.log(`Clearing markers and info windows - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    
    // Clear markers safely
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
  }, [miniMap]);
  
  // Add markers for all panels with DOM safety checks
  const addMarkers = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps || !google.maps.Marker || !mapInitialized) {
      console.log(`Cannot add markers - map not ready - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      return;
    }
    
    console.log(`Adding markers - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    
    try {
      // Clear existing markers first
      clearMarkersAndInfoWindows();
      
      // Add new markers for each panel
      panels.forEach((panel, index) => {
        if (panel.buildings?.latitude && panel.buildings?.longitude) {
          try {
            const panelId = panel.id || `panel-${index}`;
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
                  <button id="add-to-cart-${panelId}" class="mt-2 text-xs bg-[#7C3AED] hover:bg-[#00F894] text-white px-2 py-1 rounded w-full transition-all hover:scale-105 duration-200">
                    Adicionar ao Carrinho
                  </button>
                </div>
              `
            });
            
            // Store the info window for cleanup
            infoWindowsRef.current.push(infoWindow);
            
            const marker = new google.maps.Marker({
              position: { lat: panel.buildings.latitude, lng: panel.buildings.longitude },
              map: mapRef.current,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: panel.status === 'online' ? '#10B981' : '#F59E0B', // green or amber
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
              },
              title: panel.buildings.nome
            });
            
            marker.addListener('click', () => {
              // Close any open info windows
              infoWindowsRef.current.forEach(window => {
                if (window) window.close();
              });
              
              infoWindow.open(mapRef.current, marker);
              
              // Add event listener to button ONLY when the info window is opened
              google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
                const button = document.getElementById(`add-to-cart-${panelId}`);
                if (button) {
                  button.addEventListener('click', () => {
                    if (onAddToCart) onAddToCart(panel);
                    infoWindow.close();
                  });
                }
              });
            });
            
            // Store the marker for cleanup
            markersRef.current.push(marker);
          } catch (error) {
            console.error('Error adding marker:', error);
          }
        }
      });
      
      // Adjust bounds if there are markers and no selected location
      if (markersRef.current.length > 0 && !selectedLocation && mapRef.current) {
        try {
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
        } catch (error) {
          console.error('Error adjusting bounds:', error);
        }
      }
    } catch (error) {
      console.error('Error adding markers:', error);
    }
  }, [panels, selectedLocation, clearMarkersAndInfoWindows, onAddToCart, miniMap, mapInitialized]);
  
  // Add marker for selected location with safety checks
  const addSelectedLocationMarker = useCallback(() => {
    if (!mapRef.current || !selectedLocation || !window.google || !window.google.maps || !google.maps.Marker || !mapInitialized) {
      console.log(`Cannot add selected location marker - map not ready - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      return;
    }
    
    console.log(`Adding selected location marker - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    
    try {
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
        zIndex: 1000 // Keep on top
      });
      
      // Add ripple animation
      if (google.maps.Circle && mapRef.current) {
        const cityCircle = new google.maps.Circle({
          strokeColor: '#00F894',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#00F894',
          fillOpacity: 0.2,
          map: mapRef.current,
          center: { lat: selectedLocation.lat, lng: selectedLocation.lng },
          radius: 300, // Meters
        });
        
        // Store the circle for cleanup
        markersRef.current.push(marker);
      }
      
      // Center map on selected location
      if (mapRef.current) {
        mapRef.current.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        mapRef.current.setZoom(14);
      }
      
      // Store for cleanup
      markersRef.current.push(marker);
    } catch (error) {
      console.error('Error adding selected location marker:', error);
    }
  }, [selectedLocation, miniMap, mapInitialized]);
  
  // Initialize map with safety checks
  const initializeMap = useCallback(() => {
    // Safety check - exit early if prerequisites not met
    if (!mapContainerRef.current || !window.google || !window.google.maps || !google.maps.Map || mapInitialized) {
      console.log(`Cannot initialize map - prerequisites not met - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      return;
    }
    
    // Verify DOM element still exists in document
    if (!document.body.contains(mapContainerRef.current)) {
      console.log(`Map container no longer in DOM - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      return;
    }
    
    console.log(`Initializing map - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    
    try {
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
      };
      
      // Add zoomControlOptions only if ControlPosition is available
      if (google.maps.ControlPosition && google.maps.ControlPosition.RIGHT_TOP) {
        mapOptions.zoomControlOptions = {
          position: google.maps.ControlPosition.RIGHT_TOP
        };
      }
      
      // Apply map styles safely
      try {
        // Apply styles directly without type checking
        mapOptions.styles = [
          {
            featureType: "poi", // Points of interest
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ];
      } catch (error) {
        console.log('Failed to apply map styles:', error);
      }
      
      // Create new map instance only if container exists and is in DOM
      if (mapContainerRef.current && document.body.contains(mapContainerRef.current)) {
        mapRef.current = new google.maps.Map(mapContainerRef.current, mapOptions);
        setMapInitialized(true);
        setMapLoaded(true);
        
        // Add markers after map initialization with slight delay to ensure DOM is ready
        if (panels.length > 0) {
          setTimeout(() => {
            if (mountedRef.current && mapRef.current) {
              addMarkers();
            }
          }, 100);
        }
        
        // Add selected location marker if available
        if (selectedLocation) {
          setTimeout(() => {
            if (mountedRef.current && mapRef.current) {
              addSelectedLocationMarker();
            }
          }, 200);
        }
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      if (mountedRef.current) {
        toast({
          variant: "destructive",
          title: "Error initializing map",
          description: "Could not initialize Google Maps. Try reloading the page.",
        });
      }
    }
  }, [panels, selectedLocation, addMarkers, addSelectedLocationMarker, mapInitialized, miniMap, toast]);
  
  // Load and initialize Google Maps safely
  useEffect(() => {
    console.log(`Setting up Google Maps - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    mountedRef.current = true;
    
    const setupMap = async () => {
      try {
        // Load Google Maps script
        await loadGoogleMapsScript();
        
        // Check again if component is still mounted
        if (mountedRef.current && window.google && window.google.maps && google.maps.Map) {
          console.log(`Script loaded, initializing map - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
          
          // Wait for next tick to ensure DOM is ready
          setTimeout(() => {
            if (mountedRef.current && mapContainerRef.current && document.body.contains(mapContainerRef.current)) {
              initializeMap();
            }
          }, 0);
        } else {
          console.log(`Component unmounted or API not ready - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
        }
      } catch (error) {
        console.error('Error setting up map:', error);
        if (mountedRef.current) {
          toast({
            variant: "destructive",
            title: "Error setting up map",
            description: "Could not set up the map. Please try again.",
          });
        }
      }
    };
    
    setupMap();
    
    // Crucial cleanup function to prevent removeChild errors
    return () => {
      console.log(`PanelMap unmounting - cleaning up - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      mountedRef.current = false;
      
      // Clear all markers and info windows when component unmounts
      clearMarkersAndInfoWindows();
      
      // Clear map instance and event listeners safely
      if (mapRef.current && window.google && window.google.maps && google.maps.event) {
        try {
          console.log(`Clearing map instance - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
          google.maps.event.clearInstanceListeners(mapRef.current);
          mapRef.current = null;
        } catch (error) {
          console.error('Error clearing map event listeners:', error);
        }
      }
    };
  }, [clearMarkersAndInfoWindows, initializeMap, loadGoogleMapsScript, miniMap, toast]);
  
  // Update markers when panels or selected location changes
  useEffect(() => {
    console.log(`Panels or location changed - updating markers - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    
    if (mountedRef.current && mapInitialized && mapRef.current && window.google && window.google.maps) {
      // Use setTimeout to ensure updates don't collide
      setTimeout(() => {
        if (!mountedRef.current) return;
        
        addMarkers();
        
        if (selectedLocation) {
          setTimeout(() => {
            if (mountedRef.current) {
              addSelectedLocationMarker();
            }
          }, 100);
        }
      }, 200);
    }
  }, [panels, selectedLocation, addMarkers, addSelectedLocationMarker, mapInitialized, miniMap]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'}`} data-map-id={mapInstanceIdRef.current}>
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
          <div className="flex items-center justify-center h-full">
            <p>Carregando mapa...</p>
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
