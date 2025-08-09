import React, { useEffect, useRef } from 'react';
import type { BuildingStore } from '@/services/buildingStoreService';
import loadGoogleMaps from '@/utils/googleMapsLoader';

interface BuildingMapProps {
  buildings: BuildingStore[];
  selectedLocation: { lat: number; lng: number } | null;
}

const BuildingMap: React.FC<BuildingMapProps> = ({ buildings, selectedLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Initialize map
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const maps = await loadGoogleMaps();
      if (!isMounted || !mapRef.current) return;

      // Determine center
      const defaultCenter = { lat: -25.5163, lng: -54.5854 }; // Foz do Iguaçu default
      const firstWithCoords = buildings?.find(b => !!b.latitude && !!b.longitude);
      const center = selectedLocation || (firstWithCoords ? { lat: firstWithCoords.latitude, lng: firstWithCoords.longitude } : defaultCenter);

      const map = new maps.Map(mapRef.current, {
        center,
        zoom: selectedLocation ? 14 : 12,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        scrollwheel: false,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new maps.InfoWindow();
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [buildings, selectedLocation]);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const maps = (window as any).google.maps as typeof google.maps;

    const bounds = new maps.LatLngBounds();
    let hasAny = false;

    buildings?.forEach((b) => {
      if (!b.latitude || !b.longitude) return;
      hasAny = true;
      const position = { lat: b.latitude, lng: b.longitude };

      const marker = new maps.Marker({
        position,
        map,
        title: b.nome,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          fillColor: '#3C1361',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 1,
          scale: 8,
        },
        animation: maps.Animation.DROP,
      });

      marker.addListener('click', () => {
        const content = `
          <div style="padding:8px; max-width:260px">
            <div style="font-weight:700; font-size:14px; margin-bottom:4px; color:#3C1361">${b.nome}</div>
            <div style="font-size:12px; color:#444">${b.endereco || ''}${b.bairro ? ', ' + b.bairro : ''}</div>
            <div style="margin-top:6px; font-size:12px; color:#6b7280">${b.visualizacoes_mes || 0} visualizações/mês</div>
          </div>
        `;
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open({ map, anchor: marker });
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Center on selected location or fit bounds
    if (selectedLocation) {
      map.setCenter(selectedLocation);
      map.setZoom(14);
    } else if (hasAny) {
      map.fitBounds(bounds, 40);
    }
  }, [buildings, selectedLocation]);

  return (
    <div ref={mapRef} className="w-full h-full" />
  );
};

export default BuildingMap;
