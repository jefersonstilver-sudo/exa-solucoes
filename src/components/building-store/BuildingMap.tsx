import React, { useEffect, useRef, useState } from 'react';
import type { BuildingStore } from '@/services/buildingStoreService';
import loadGoogleMaps from '@/utils/googleMapsLoader';
import useBuildingStore from '@/hooks/building-store/useBuildingStore';
import { useToast } from '@/hooks/use-toast';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { getPersistentGeocode } from '@/services/geocodingCache';
import CustomPinImage from '@/components/maps/CustomPinImage';
import BuildingHoverCard from '@/components/maps/BuildingHoverCard';
import { createRoot } from 'react-dom/client';
import BusinessLocationPin from '@/components/maps/BusinessLocationPin';
import BusinessLocationEditor from '@/components/building-store/BusinessLocationEditor';
import { FOZ_DO_IGUACU_CENTER } from '@/utils/mapConstants';

interface BuildingMapProps {
  buildings: BuildingStore[];
  selectedLocation: { lat: number; lng: number } | null;
  scrollwheel?: boolean;
  defaultZoom?: number;
  requirePreciseGeocode?: boolean;
  enableClustering?: boolean;
  autoFitAllBuildings?: boolean;
  hideDefaultControls?: boolean;
  gestureHandling?: 'cooperative' | 'greedy' | 'auto';
}

const BuildingMap: React.FC<BuildingMapProps> = ({ 
  buildings, 
  selectedLocation, 
  scrollwheel = false, 
  defaultZoom = 14, 
  requirePreciseGeocode = true,
  enableClustering = false,
  autoFitAllBuildings = false,
  hideDefaultControls = false,
  gestureHandling = 'cooperative'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const markerByIdRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const businessMarkerRef = useRef<google.maps.OverlayView | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isEditingLocation, setIsEditingLocation] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [cartVersion, setCartVersion] = useState(0);
  const { hoveredBuildingId, selectedBuildingId, setHoveredBuilding, setSelectedBuildingId, businessLocation, businessAddress, setBusinessLocation } = useBuildingStore();
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    let isMounted = true;

    async function init() {
      console.log('🗺️ [BUILDING MAP] === INICIALIZANDO MAPA ===');
      console.log('🗺️ [BUILDING MAP] Buildings recebidos:', buildings?.length || 0);
      
      try {
        const maps = await loadGoogleMaps();
        if (!isMounted || !mapRef.current) {
          console.log('🗺️ [BUILDING MAP] ❌ Componente desmontado ou ref null');
          return;
        }

      // Determine center - prioritize manual_latitude/manual_longitude
      const defaultCenter = { lat: -25.5469, lng: -54.5882 }; // Foz do Iguaçu - Centro da cidade
      
      // Helper to get valid coordinates (manual takes priority)
      const getValidCoords = (b: any) => {
        if (b.manual_latitude && b.manual_longitude && 
            b.manual_latitude !== 0 && b.manual_longitude !== 0) {
          return { lat: b.manual_latitude, lng: b.manual_longitude };
        }
        if (b.latitude && b.longitude && 
            b.latitude !== 0 && b.longitude !== 0) {
          return { lat: b.latitude, lng: b.longitude };
        }
        return null;
      };
      
      const firstWithCoords = buildings?.find(b => getValidCoords(b) !== null);
      const firstCoords = firstWithCoords ? getValidCoords(firstWithCoords) : null;
      const center = selectedLocation || firstCoords || defaultCenter;

      console.log('🗺️ [BUILDING MAP] Centro do mapa:', center);

        const map = new maps.Map(mapRef.current, {
          center,
          zoom: selectedLocation ? defaultZoom : 13, // Zoom ajustado para mostrar a cidade toda
          mapTypeControl: hideDefaultControls ? false : false,
          fullscreenControl: hideDefaultControls ? false : false,
          streetViewControl: hideDefaultControls ? false : false,
          zoomControl: hideDefaultControls ? false : true,
          scrollwheel: scrollwheel,
          gestureHandling: gestureHandling,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] }
          ],
        });

      // Add click listener for editing business location
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (isEditingLocation && event.latLng) {
          const newLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          setBusinessLocation(newLocation, businessAddress);
          toast({
            title: 'Posição atualizada!',
            description: 'Clique em "Confirmar" para salvar.',
            variant: 'default'
          });
        }
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new maps.InfoWindow();
      geocoderRef.current = new maps.Geocoder();
      setIsReady(true);
      
        console.log('🗺️ [BUILDING MAP] ✅ Mapa inicializado');
        console.log('🗺️ [BUILDING MAP] Geocoder disponível:', !!geocoderRef.current);
        setMapError(null);
      } catch (error) {
        console.error('🗺️ [BUILDING MAP] ❌ Erro ao inicializar:', error);
        setMapError('Erro ao carregar o mapa. Verifique sua conexão.');
      }
    }

    init();

    return () => {
      isMounted = false;
      setIsReady(false);
    };
  }, [buildings, selectedLocation]);

  // Update markers (with geocoding fallback)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isReady) {
      console.log('🗺️ [MARKERS] ⏳ Aguardando mapa ficar pronto...');
      return;
    }

    let cancelled = false;

    async function updateMarkers() {
      console.log('🗺️ [MARKERS] === INICIANDO ATUALIZAÇÃO DE MARCADORES ===');
      console.log('🗺️ [MARKERS] Buildings para processar:', buildings?.length || 0);
      console.log('🗺️ [MARKERS] requirePreciseGeocode:', requirePreciseGeocode);
      console.log('🗺️ [MARKERS] enableClustering:', enableClustering);
      console.log('🗺️ [MARKERS] Geocoder disponível:', !!geocoderRef.current);
      
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

      const getCoordinates = (building: any) => {
        // Priority: manual coordinates > automatic coordinates
        if (building.manual_latitude && building.manual_longitude && 
            building.manual_latitude !== 0 && building.manual_longitude !== 0) {
          return { lat: building.manual_latitude, lng: building.manual_longitude };
        }
        if (building.latitude && building.longitude && 
            building.latitude !== 0 && building.longitude !== 0) {
          return { lat: building.latitude, lng: building.longitude };
        }
        return null;
      };

      const createCustomMarker = (position: { lat: number; lng: number }, building: any) => {
        const mapDiv = document.createElement('div');
        mapDiv.style.position = 'absolute';
        mapDiv.style.cursor = 'pointer';
        mapDiv.style.pointerEvents = 'all';
        
        const root = createRoot(mapDiv);
        
        const isHovered = hoveredBuildingId === building.id;
        const isSelected = selectedBuildingId === building.id;
        
        // Mobile: No HoverCard to avoid click interference
        const isMobile = window.innerWidth <= 768;
        
        const CustomMarkerComponent = () => (
          isMobile ? (
            <div>
              <CustomPinImage
                buildingId={building.id}
                isHovered={isHovered}
                isSelected={isSelected}
              />
            </div>
          ) : (
            <BuildingHoverCard building={building} businessLocation={businessLocation}>
              <div>
                <CustomPinImage
                  buildingId={building.id}
                  isHovered={isHovered}
                  isSelected={isSelected}
                />
              </div>
            </BuildingHoverCard>
          )
        );

        root.render(<CustomMarkerComponent />);
        
        return mapDiv;
      };

      const addMarker = (position: { lat: number; lng: number }, b: any) => {
        const customMarkerDiv = createCustomMarker(position, b);
        
        const marker = new maps.OverlayView();
        marker.onAdd = function() {
          const panes = this.getPanes();
          if (panes?.overlayMouseTarget) {
            panes.overlayMouseTarget.appendChild(customMarkerDiv);
          }
        };
        
        marker.draw = function() {
          const projection = this.getProjection();
          if (projection) {
            const point = projection.fromLatLngToDivPixel(new maps.LatLng(position.lat, position.lng));
            if (point) {
              customMarkerDiv.style.left = (point.x - 24) + 'px';
              customMarkerDiv.style.top = (point.y - 48) + 'px';
            }
          }
        };
        
        marker.onRemove = function() {
          if (customMarkerDiv.parentNode) {
            customMarkerDiv.parentNode.removeChild(customMarkerDiv);
          }
        };

        // Add click handlers to the marker div
        customMarkerDiv.addEventListener('mouseover', () => {
          setHoveredBuilding?.(b.id);
        });
        customMarkerDiv.addEventListener('mouseout', () => {
          setHoveredBuilding?.(null);
        });
        customMarkerDiv.addEventListener('click', () => {
          setSelectedBuildingId?.(b.id);
          const el = document.getElementById(`building-${b.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          
          // Mobile click handler - trigger mobile card
          if (window.innerWidth <= 768) {
            const event = new CustomEvent('showMobileBuildingCard', { 
              detail: { building: b } 
            });
            window.dispatchEvent(event);
          }
        });

        marker.setMap(map);
        markersRef.current.push(marker as any);
        markerByIdRef.current.set(b.id, marker as any);
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
        
        console.log(`🗺️ [MARKERS] Processando prédio: ${b.nome} (ID: ${b.id})`);
        
        // Check for coordinates (manual takes priority)
        const coords = getCoordinates(b);
        if (coords) {
          console.log(`🗺️ [MARKERS] ✅ Coords encontradas: ${coords.lat}, ${coords.lng}`);
          hasAny = true;
          addMarker(coords, b);
          continue;
        }

        // Try cache first
        const cached = getCached(b);
        if (cached) {
          console.log(`🗺️ [MARKERS] ✅ Cache local encontrado: ${cached.lat}, ${cached.lng}`);
          hasAny = true;
          addMarker(cached, b);
          continue;
        }

        // Build address string - Clean and use known addresses for Rio Negro
        const cleanAddress = (addr: string) => addr?.trim().replace(/^\s+|\s+$/g, '');
        
        let parts = [];
        if (b.nome?.includes('Rio Negro')) {
          // Use known address for Rio Negro
          parts = ['R. Mal. Deodoro, 366', 'Centro', 'Foz do Iguaçu', 'PR'];
        } else {
          parts = [
            cleanAddress(b.endereco), 
            cleanAddress(b.bairro), 
            cleanAddress((b as any).cidade) || 'Foz do Iguaçu', 
            cleanAddress((b as any).estado) || 'PR'
          ].filter(Boolean);
        }
        
        if (!parts.length) {
          console.log(`🗺️ [MARKERS] ❌ Sem endereço para ${b.nome}`);
          continue;
        }

        const address = parts.join(', ');
        console.log(`🗺️ [MARKERS] Endereço montado: ${address}`);

        // Try persistent geocode (Supabase Edge + DB cache)
        try {
          console.log(`🗺️ [MARKERS] 🔍 Tentando geocode persistente...`);
          const persisted = await getPersistentGeocode({ address, buildingId: b.id });
          if (persisted?.coords) {
            console.log(`🗺️ [MARKERS] ✅ Geocode persistente: ${persisted.coords.lat}, ${persisted.coords.lng} (preciso: ${persisted.precise})`);
            
            if (persisted.precise || !requirePreciseGeocode) {
              hasAny = true;
              setCached(b, persisted.coords);
              addMarker(persisted.coords, b);
              await sleep(120);
              continue;
            } else {
              console.log(`🗺️ [MARKERS] ⚠️ Geocode impreciso rejeitado (requirePreciseGeocode=true)`);
            }
          } else {
            console.log(`🗺️ [MARKERS] ❌ Geocode persistente falhou`);
          }
        } catch (err) {
          console.log(`🗺️ [MARKERS] ❌ Erro no geocode persistente:`, err);
        }

        // If Google Geocoder available, use as fallback
        if (!geocoderRef.current) {
          console.log(`🗺️ [MARKERS] ❌ Geocoder não disponível para ${b.nome}`);
          continue;
        }
        
        console.log(`🗺️ [MARKERS] 🔍 Tentando Google Geocoder...`);
        const result = await new Promise<{ coords: { lat: number; lng: number } | null; precise: boolean; status: string }>((resolve) => {
          geocoderRef.current!.geocode({ address }, (results, status) => {
            console.log(`🗺️ [MARKERS] Google Geocoder status: ${status}`);
            
            if (status === 'REQUEST_DENIED') {
              console.error(`🗺️ [MARKERS] ❌ REQUEST_DENIED - Verifique: 1) Geocoding API habilitada 2) Billing ativo 3) Restrições de domínio`);
              toast({
                title: 'Google Maps: REQUEST_DENIED',
                description: 'Habilite Geocoding API e Billing no Google Cloud Console',
                variant: 'destructive'
              });
            } else if (status === 'OVER_QUERY_LIMIT') {
              console.error(`🗺️ [MARKERS] ❌ OVER_QUERY_LIMIT - Cota excedida`);
              toast({
                title: 'Google Maps: Cota excedida',
                description: 'Limite de consultas atingido',
                variant: 'destructive'
              });
            }
            
            if (status === 'OK' && results && results[0]) {
              const r = results[0];
              const lt = r.geometry.location_type;
              const types = r.types || [];
              const isPrecise = lt === 'ROOFTOP' || types.includes('street_address') || types.includes('premise');
              const loc = r.geometry.location;
              console.log(`🗺️ [MARKERS] Google result: location_type=${lt}, types=${types.join(',')}, precise=${isPrecise}`);
              resolve({ coords: { lat: loc.lat(), lng: loc.lng() }, precise: isPrecise, status });
            } else {
              resolve({ coords: null, precise: false, status });
            }
          });
        });

        if (result.coords && (result.precise || !requirePreciseGeocode)) {
          console.log(`🗺️ [MARKERS] ✅ Google Geocoder sucesso: ${result.coords.lat}, ${result.coords.lng} (preciso: ${result.precise})`);
          setCached(b, result.coords);
          hasAny = true;
          addMarker(result.coords, b);
          await sleep(120); // gentle pacing
        } else {
          console.log(`🗺️ [MARKERS] ❌ Google Geocoder rejeitado - coords: ${!!result.coords}, precise: ${result.precise}, requirePrecise: ${requirePreciseGeocode}`);
          imprecise.push(b.nome || address);
        }
      }

      console.log(`🗺️ [MARKERS] === FINALIZAÇÃO ===`);
      console.log(`🗺️ [MARKERS] Total de marcadores criados: ${markersRef.current.length}`);
      console.log(`🗺️ [MARKERS] Endereços imprecisos: ${imprecise.length}`);

      // Apply clustering only if markers support getPosition
      if (enableClustering && markersRef.current.length > 0) {
        // Check if markers are compatible with MarkerClusterer (need getPosition method)
        const firstMarker = markersRef.current[0] as any;
        const hasGetPosition = firstMarker && typeof firstMarker.getPosition === 'function';
        
        if (hasGetPosition) {
          try {
            console.log(`🗺️ [MARKERS] ✅ Aplicando clustering com ${markersRef.current.length} markers`);
            clustererRef.current = new MarkerClusterer({ markers: markersRef.current, map });
          } catch (e) {
            console.warn('🗺️ [MARKERS] ⚠️ Clustering falhou:', e);
          }
        } else {
          console.log(`🗺️ [MARKERS] ⚠️ Clustering ignorado - markers são OverlayView (não suportam getPosition)`);
        }
      } else if (markersRef.current.length > 0) {
        console.log(`🗺️ [MARKERS] ⚠️ Clustering desabilitado`);
      }

      // Center on selected location or fit bounds
      if (autoFitAllBuildings && hasAny) {
        console.log(`🗺️ [MARKERS] 📍 Auto-fit: Ajustando bounds para TODOS os ${markersRef.current.length} prédios`);
        // Add padding for mobile UI elements (top header + bottom sheet)
        const padding = window.innerWidth <= 768 
          ? { top: 100, bottom: 300, left: 40, right: 40 }
          : { top: 60, bottom: 60, left: 60, right: 60 };
        map.fitBounds(bounds, padding);
        
        // RETRY: Re-apply fitBounds after delay to ensure map is fully rendered
        setTimeout(() => {
          if (mapInstanceRef.current && !cancelled) {
            console.log(`🗺️ [MARKERS] 🔄 Re-aplicando fitBounds após delay para garantir visualização`);
            mapInstanceRef.current.fitBounds(bounds, padding);
          }
        }, 500);
      } else if (selectedLocation) {
        console.log(`🗺️ [MARKERS] 🎯 Centralizando na localização selecionada`);
        map.setCenter(selectedLocation);
        map.setZoom(defaultZoom);
      } else if (hasAny) {
        console.log(`🗺️ [MARKERS] 📍 Ajustando bounds para todos os marcadores`);
        map.fitBounds(bounds, 40);
      } else {
        console.log(`🗺️ [MARKERS] ❌ Nenhum marcador para exibir - centralizando em Foz do Iguaçu`);
        // Fallback: Center on Foz do Iguaçu when no markers are available
        const FOZ_CENTER = { lat: -25.5163, lng: -54.5854 };
        map.setCenter(FOZ_CENTER);
        map.setZoom(13);
      }

      if (imprecise.length && requirePreciseGeocode) {
        toast({
          title: 'Endereços imprecisos filtrados',
          description: `${imprecise.length} endereço(s) foram filtrados por baixa precisão.`,
          variant: 'destructive'
        });
      }
    }

    updateMarkers();

    // Listen for cart updates to trigger marker re-render
    const handleCartUpdate = () => {
      setCartVersion(v => v + 1);
    };
    window.addEventListener('cart:updated', handleCartUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener('cart:updated', handleCartUpdate);
    };
  }, [buildings, selectedLocation, defaultZoom, requirePreciseGeocode, enableClustering, isReady, cartVersion, businessLocation]);

  // Handle business location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isReady) return;

    // Remove existing business marker
    if (businessMarkerRef.current) {
      businessMarkerRef.current.setMap(null);
      businessMarkerRef.current = null;
    }

    // Add business location marker if we have coordinates
    if (businessLocation) {
      console.log('🗺️ [BUSINESS MARKER] Adicionando pin da empresa:', businessLocation);
      
      const createBusinessMarker = () => {
        const mapDiv = document.createElement('div');
        mapDiv.style.position = 'absolute';
        mapDiv.style.cursor = 'pointer';
        mapDiv.style.pointerEvents = 'all';
        mapDiv.style.zIndex = '1000'; // Higher z-index than building markers
        
        const root = createRoot(mapDiv);
        root.render(
          <BusinessLocationPin 
            isSelected={true}
            address={businessAddress}
          />
        );
        
        return mapDiv;
      };

      const businessMarkerDiv = createBusinessMarker();
      
      const marker = new (window as any).google.maps.OverlayView();
      marker.onAdd = function() {
        const panes = this.getPanes();
        if (panes?.overlayMouseTarget) {
          panes.overlayMouseTarget.appendChild(businessMarkerDiv);
        }
      };
      
      marker.draw = function() {
        const projection = this.getProjection();
        if (projection) {
          const point = projection.fromLatLngToDivPixel(
            new (window as any).google.maps.LatLng(businessLocation.lat, businessLocation.lng)
          );
          if (point) {
            businessMarkerDiv.style.left = (point.x - 16) + 'px';
            businessMarkerDiv.style.top = (point.y - 32) + 'px';
          }
        }
      };
      
      marker.onRemove = function() {
        if (businessMarkerDiv.parentNode) {
          businessMarkerDiv.parentNode.removeChild(businessMarkerDiv);
        }
      };

      marker.setMap(map);
      businessMarkerRef.current = marker;
    }
  }, [businessLocation, businessAddress, isReady]);

  // Sync card → marker visuals (hover/selection)
  useEffect(() => {
    // Re-render custom markers when hover/selection state changes
    // The state is already handled in the React components through the store
    console.log('🗺️ [MARKERS] Estado de hover/seleção atualizado', { hoveredBuildingId, selectedBuildingId });
  }, [hoveredBuildingId, selectedBuildingId]);

  // Handle map container resize (e.g., when expanding dialog)
  useEffect(() => {
    const el = mapRef.current;
    const maps = (window as any).google?.maps as typeof google.maps | undefined;
    if (!el || !maps) return;

    const observer = new ResizeObserver(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      // Trigger internal resize and recenter
      try {
        if ((maps as any).event?.trigger) {
          (maps as any).event.trigger(map, 'resize');
        }
      } catch {}

      if (selectedLocation) {
        map.setCenter(selectedLocation);
      } else if (markersRef.current.length > 0) {
        const b = new maps.LatLngBounds();
        markersRef.current.forEach(m => {
          const getPos = (m as any)?.getPosition;
          if (typeof getPos === 'function') {
            const pos = getPos.call(m);
            if (pos) b.extend(pos as any);
          }
        });
        map.fitBounds(b, 40);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [selectedLocation]);

  // Error display
  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center p-6">
          <div className="text-gray-400 mb-2">📍</div>
          <p className="text-gray-600 text-sm">{mapError}</p>
          <button 
            onClick={() => {
              setMapError(null);
              setIsReady(false);
            }}
            className="mt-2 text-blue-600 text-sm hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-visible">
      {/* Loading indicator */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Carregando mapa...</p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Business Location Editor */}
      {businessLocation && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <BusinessLocationEditor
            businessLocation={businessLocation}
            businessAddress={businessAddress}
          />
        </div>
      )}
    </div>
  );
};

export default BuildingMap;
