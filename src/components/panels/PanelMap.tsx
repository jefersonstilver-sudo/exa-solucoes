
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Info, Maximize, Minimize } from 'lucide-react';
import { Panel } from '@/types/panel';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from 'framer-motion';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Load Google Maps script
  useEffect(() => {
    // Check if the script is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const googleMapScript = document.createElement('script');
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAVQPvo8asVwVVuWBxReck6ohF9vvDR_qM&libraries=places`;
    googleMapScript.async = true;
    googleMapScript.defer = true;
    googleMapScript.onload = initializeMap;
    document.head.appendChild(googleMapScript);

    return () => {
      // Cleanup markers when component unmounts
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);
  
  // Initialize map
  const initializeMap = () => {
    if (!mapContainerRef.current) return;
    
    // Center on Brazil if no location is selected
    const defaultCenter = selectedLocation ? 
      { lat: selectedLocation.lat, lng: selectedLocation.lng } : 
      { lat: -15.793889, lng: -47.882778 }; // Default to Brasilia
    
    const mapOptions = {
      center: defaultCenter,
      zoom: selectedLocation ? 13 : 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };
    
    mapRef.current = new google.maps.Map(mapContainerRef.current, mapOptions);
    setMapLoaded(true);
    
    // Add markers after map is initialized
    if (panels.length > 0) {
      addMarkers();
    }
    
    // Add selected location marker if available
    if (selectedLocation) {
      addSelectedLocationMarker();
    }
  };
  
  // Add markers for all panels
  const addMarkers = () => {
    if (!mapRef.current) return;
    
    // Clear existing markers first
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    // Add new markers for each panel
    panels.forEach(panel => {
      if (panel.buildings?.latitude && panel.buildings?.longitude) {
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
              <button id="add-to-cart-${panel.id}" class="mt-2 text-xs bg-[#7C3AED] hover:bg-[#00F894] text-white px-2 py-1 rounded w-full transition-all hover:scale-105 duration-200">
                Adicionar ao Carrinho
              </button>
            </div>
          `
        });
        
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
          markersRef.current.forEach(m => {
            google.maps.event.clearListeners(m, 'closeclick');
          });
          
          infoWindow.open(mapRef.current, marker);
          
          // Add event listener to the "Add to Cart" button inside the info window
          google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
            const button = document.getElementById(`add-to-cart-${panel.id}`);
            if (button) {
              button.addEventListener('click', () => {
                if (onAddToCart) onAddToCart(panel);
                infoWindow.close();
              });
            }
          });
        });
        
        markersRef.current.push(marker);
      }
    });
    
    // Fit bounds if there are markers and no selected location
    if (markersRef.current.length > 0 && !selectedLocation) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition() as google.maps.LatLng);
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
  };
  
  // Add marker for selected location
  const addSelectedLocationMarker = () => {
    if (!mapRef.current || !selectedLocation) return;
    
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
      title: 'Localização selecionada',
      zIndex: 1000 // Keep on top
    });
    
    // Add ripple animation
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
    
    // Center map on selected location
    mapRef.current.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
    mapRef.current.setZoom(14);
    
    markersRef.current.push(marker);
  };
  
  // Update markers when panels or selected location changes
  useEffect(() => {
    if (mapRef.current) {
      addMarkers();
      
      if (selectedLocation) {
        addSelectedLocationMarker();
      }
    }
  }, [panels, selectedLocation]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'}`}>
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
