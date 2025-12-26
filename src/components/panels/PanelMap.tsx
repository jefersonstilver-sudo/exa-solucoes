import React, { useEffect, useRef, useState } from 'react';
import { Panel } from '@/types/panel';
import { MapPin } from 'lucide-react';
import loadGoogleMaps from '@/utils/googleMapsLoader';
import { FOZ_DO_IGUACU_CENTER, DEFAULT_MAP_CONFIG, MAP_STYLES } from '@/utils/mapConstants';

interface PanelMapProps {
  panels: Panel[];
  selectedLocation: { lat: number; lng: number } | null;
  onSelectPanel?: (panel: Panel) => void;
}

const PanelMap: React.FC<PanelMapProps> = ({
  panels,
  selectedLocation,
  onSelectPanel,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map when the component mounts
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      try {
        const maps = await loadGoogleMaps();
        if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

        // Default to Foz do Iguaçu region where the panels are located
        const mapCenter = selectedLocation || FOZ_DO_IGUACU_CENTER;

        const mapOptions: google.maps.MapOptions = {
          center: mapCenter,
          zoom: DEFAULT_MAP_CONFIG.zoom,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          styles: MAP_STYLES,
        };

        const map = new maps.Map(mapRef.current, mapOptions);
        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (e) {
        console.error('[PanelMap] Failed to load Google Maps:', e);
        setMapLoaded(false);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [selectedLocation]);

  // Update markers when panels or map changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const newMarkers: google.maps.Marker[] = [];

    // Add markers for each panel
    panels.forEach((panel) => {
      const b = panel.buildings as any;
      const lat = b?.manual_latitude ?? b?.latitude;
      const lng = b?.manual_longitude ?? b?.longitude;
      if (!lat || !lng) return;

      // Check if condominiumProfile is string or object and extract profile type
      const isCommercial =
        typeof b?.condominiumProfile === 'string'
          ? b.condominiumProfile === 'commercial'
          : b?.condominiumProfile?.type === 'commercial';

      // Create custom marker with different color based on profile
      const markerIcon: google.maps.Symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: isCommercial ? '#00FFAB' : '#3C1361',
        fillOpacity: 0.8,
        strokeWeight: 1,
        strokeColor: '#ffffff',
        scale: 10,
      };

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: b?.nome,
        icon: markerIcon,
        animation: google.maps.Animation.DROP,
      });

      marker.addListener('click', () => {
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding:8px;font-family:system-ui,-apple-system,sans-serif;">
            <div style="font-weight:700;">${b?.nome ?? ''}</div>
            <div style="margin-top:4px;font-size:12px;color:#6b7280;">${b?.endereco ?? ''}${b?.bairro ? `, ${b.bairro}` : ''}</div>
          </div>`,
        });

        infoWindow.open({ anchor: marker, map });

        if (onSelectPanel) onSelectPanel(panel);
      });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

    // Center map on selected location if provided
    if (selectedLocation) {
      map.setCenter(selectedLocation);
      map.setZoom(14);
    }
  }, [panels, mapLoaded, selectedLocation, onSelectPanel]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-md bg-gray-100">
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

