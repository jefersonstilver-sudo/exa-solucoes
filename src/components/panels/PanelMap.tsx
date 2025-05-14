
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Panel } from '@/types/panel';
import { MapPin } from 'lucide-react';

// Declare global Google Maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface PanelMapProps {
  panels: Panel[];
  selectedLocation: { lat: number; lng: number } | null;
  onSelectPanel?: (panel: Panel) => void;
}

const PanelMap: React.FC<PanelMapProps> = ({ 
  panels, 
  selectedLocation,
  onSelectPanel 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Initialize map when the component mounts
  useEffect(() => {
    // Skip if map is already initialized or the reference doesn't exist
    if (mapInstance || !mapRef.current) return;
    
    const initMap = () => {
      // Default to São Paulo if no location selected
      const defaultCenter = { lat: -23.5505, lng: -46.6333 };
      const mapCenter = selectedLocation || defaultCenter;
      
      const mapOptions: google.maps.MapOptions = {
        center: mapCenter,
        zoom: 13,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      };
      
      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      setMapInstance(map);
      setMapLoaded(true);
    };
    
    // Load Google Maps script if not already loaded
    if (!window.google) {
      // In a real application, you would use an API key
      // For demonstration, we'll use a placeholder
      const apiKey = '';
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      window.initMap = initMap;
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
        delete window.initMap;
      };
    } else {
      initMap();
    }
  }, [mapRef, mapInstance, selectedLocation]);
  
  // Update markers when panels or map changes
  useEffect(() => {
    if (!mapInstance || !mapLoaded) return;
    
    // Clear previous markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];
    
    // Add markers for each panel
    panels.forEach(panel => {
      if (panel.buildings && panel.buildings.latitude && panel.buildings.longitude) {
        // Check if condominiumProfile is string or object and extract profile type
        const isCommercial = typeof panel.buildings?.condominiumProfile === 'string' 
          ? panel.buildings.condominiumProfile === 'commercial'
          : panel.buildings?.condominiumProfile?.type === 'commercial';
        
        // Create custom marker with different color based on profile
        const markerIcon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: isCommercial ? '#00FFAB' : '#3C1361',
          fillOpacity: 0.8,
          strokeWeight: 1,
          strokeColor: '#ffffff',
          scale: 10
        };
        
        const marker = new window.google.maps.Marker({
          position: { 
            lat: panel.buildings.latitude, 
            lng: panel.buildings.longitude 
          },
          map: mapInstance,
          title: panel.buildings.nome,
          icon: markerIcon,
          animation: window.google.maps.Animation.DROP
        });
        
        // Add click event to marker
        marker.addListener('click', () => {
          // Show info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div class="p-2">
              <h3 class="font-bold">${panel.buildings.nome}</h3>
              <p>${panel.buildings.endereco}, ${panel.buildings.bairro}</p>
              <p class="text-sm text-[#3C1361] font-semibold mt-1">
                ${isCommercial ? 'Comercial' : 'Residencial'}
              </p>
            </div>`
          });
          
          infoWindow.open(mapInstance, marker);
          
          // Call onSelectPanel if provided
          if (onSelectPanel) {
            onSelectPanel(panel);
          }
        });
        
        newMarkers.push(marker);
      }
    });
    
    setMarkers(newMarkers);
    
    // Center map on selected location if provided
    if (selectedLocation) {
      mapInstance.setCenter(selectedLocation);
      mapInstance.setZoom(14);
    }
    
  }, [panels, mapInstance, mapLoaded, selectedLocation, onSelectPanel]);
  
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-md bg-gray-100">
      {!mapLoaded && (
        <div className="h-64 w-full flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3C1361]"></div>
            <span className="mt-2 text-sm text-gray-500">Carregando mapa...</span>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className={`h-64 w-full transition-opacity duration-300 ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {panels.length === 0 && mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
          <div className="text-center p-4">
            <MapPin className="h-8 w-8 text-[#3C1361] mx-auto mb-2" />
            <p className="text-sm text-gray-600">Nenhum painel encontrado nesta região</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelMap;
