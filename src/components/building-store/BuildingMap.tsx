import React, { useEffect, useRef } from 'react';
import type { BuildingStore } from '@/services/buildingStoreService';
import loadGoogleMaps from '@/utils/googleMapsLoader';
import useBuildingStore from '@/hooks/building-store/useBuildingStore';
import { useToast } from '@/hooks/use-toast';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

interface BuildingMapProps {
  buildings: BuildingStore[];
  selectedLocation: { lat: number; lng: number } | null;
  scrollwheel?: boolean;
  defaultZoom?: number;
}

const BuildingMap: React.FC<BuildingMapProps> = ({ buildings, selectedLocation, scrollwheel = false, defaultZoom = 14 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const markerByIdRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const { hoveredBuildingId, selectedBuildingId, setHoveredBuilding, setSelectedBuildingId } = useBuildingStore();
  const { toast } = useToast();

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
        zoom: selectedLocation ? defaultZoom : 12,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        scrollwheel: scrollwheel,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new maps.InfoWindow();
      geocoderRef.current = new maps.Geocoder();
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [buildings, selectedLocation]);

  // Update markers (with geocoding fallback)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let cancelled = false;

    async function updateMarkers() {
      // Clear previous markers and cluster
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      markerByIdRef.current.clear();
      if (clustererRef.current) {
        try { clustererRef.current.clearMarkers(); } catch {}
        clustererRef.current = null;
      }

      const maps = (window as any).google.maps as typeof google.maps;
      const bounds = new maps.LatLngBounds();
      let hasAny = false;
      const imprecise: string[] = [];

      const baseIcon = (opts?: { hovered?: boolean; selected?: boolean }) => ({
        path: maps.SymbolPath.CIRCLE,
        fillColor: '#3C1361',
        fillOpacity: 0.95,
        strokeColor: '#ffffff',
        strokeWeight: 1.5,
        scale: opts?.selected ? 11 : opts?.hovered ? 10 : 8,
      } as google.maps.Symbol);

      const addMarker = (position: { lat: number; lng: number }, b: any) => {
        const marker = new maps.Marker({
          position,
          map,
          title: b.nome,
          icon: baseIcon(),
          animation: maps.Animation.DROP,
        });

        // Sync: marker → card
        marker.addListener('mouseover', () => {
          setHoveredBuilding?.(b.id);
          marker.setIcon(baseIcon({ hovered: true }));
        });
        marker.addListener('mouseout', () => {
          setHoveredBuilding?.(null);
          const isSelected = selectedBuildingId === b.id;
          marker.setIcon(baseIcon({ selected: !!isSelected }));
        });
        marker.addListener('click', () => {
          setSelectedBuildingId?.(b.id);
          const el = document.getElementById(`building-${b.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          const content = `
            <div style="padding:8px; max-width:260px">
              <div style="font-weight:700; font-size:14px; margin-bottom:4px; color:#3C1361">${b.nome}</div>
              <div style="font-size:12px; color:#444">${b.endereco || ''}${b.bairro ? ', ' + b.bairro : ''}</div>
            </div>
          `;
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open({ map, anchor: marker });
        });

        markersRef.current.push(marker);
        markerByIdRef.current.set(b.id, marker);
        bounds.extend(position as any);
      };

      const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

      const getCacheKey = (b: any) => {
        const id = (b.id || '').toString();
        if (id) return `geo_cache_${id}`;
        const addr = `${b.nome || ''}-${b.endereco || ''}-${b.bairro || ''}`;
        return `geo_cache_${addr}`;
      };

      const getCached = (b: any): { lat: number; lng: number } | null => {
        try {
          const raw = localStorage.getItem(getCacheKey(b));
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') return parsed;
          return null;
        } catch {
          return null;
        }
      };

      const setCached = (b: any, coords: { lat: number; lng: number }) => {
        try {
          localStorage.setItem(getCacheKey(b), JSON.stringify(coords));
        } catch {}
      };

      for (const b of buildings || []) {
        if (cancelled) break;
        if (b.latitude && b.longitude) {
          hasAny = true;
          addMarker({ lat: b.latitude, lng: b.longitude }, b);
          continue;
        }

        // Try cache first
        const cached = getCached(b);
        if (cached) {
          hasAny = true;
          addMarker(cached, b);
          continue;
        }

        // Build address string
        const parts = [b.endereco, b.bairro, b.cidade || 'Foz do Iguaçu', b.estado || 'PR'].filter(Boolean);
        if (!parts.length || !geocoderRef.current) continue;

        const address = parts.join(', ');
        const result = await new Promise<{ coords: { lat: number; lng: number } | null; precise: boolean }>((resolve) => {
          geocoderRef.current!.geocode({ address }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const r = results[0];
              const lt = r.geometry.location_type;
              const types = r.types || [];
              const isPrecise = lt === 'ROOFTOP' || types.includes('street_address') || types.includes('premise');
              const loc = r.geometry.location;
              resolve({ coords: { lat: loc.lat(), lng: loc.lng() }, precise: isPrecise });
            } else {
              resolve({ coords: null, precise: false });
            }
          });
        });

        if (result.coords && result.precise) {
          setCached(b, result.coords);
          hasAny = true;
          addMarker(result.coords, b);
          await sleep(120); // gentle pacing
        } else {
          imprecise.push(b.nome || address);
        }
      }

      // Apply clustering to avoid overlap
      if (markersRef.current.length > 0) {
        clustererRef.current = new MarkerClusterer({ markers: markersRef.current, map });
      }

      // Center on selected location or fit bounds
      if (selectedLocation) {
        map.setCenter(selectedLocation);
        map.setZoom(defaultZoom);
      } else if (hasAny) {
        map.fitBounds(bounds, 40);
      }

      if (imprecise.length) {
        toast({
          title: 'Endereço impreciso — revise',
          description: `${imprecise.length} endereço(s) não foram mapeados com precisão (ROOFTOP).`,
          variant: 'destructive'
        });
      }
    }

    updateMarkers();

    return () => {
      cancelled = true;
    };
  }, [buildings, selectedLocation, defaultZoom]);

  return (
    <div ref={mapRef} className="w-full h-full" />
  );
};

export default BuildingMap;
