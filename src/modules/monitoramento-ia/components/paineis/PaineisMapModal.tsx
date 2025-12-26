import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Filter, MapPin, Wifi, WifiOff, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import loadGoogleMaps from '@/utils/googleMapsLoader';
import { DEFAULT_MAP_CONFIG } from '@/utils/mapConstants';
import { useBuildingsWithDeviceStatus, BuildingWithDeviceStatus, PROVIDER_COLORS } from '../../hooks/useBuildingsWithDeviceStatus';
import { BuildingDetailCard } from './BuildingDetailCard';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

interface PaineisMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventsMap?: Map<string, number>;
  periodLabel?: string;
}

export const PaineisMapModal: React.FC<PaineisMapModalProps> = ({
  isOpen,
  onClose,
  eventsMap,
  periodLabel = 'hoje',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  const [selectedBuilding, setSelectedBuilding] = useState<BuildingWithDeviceStatus | null>(null);
  const [showOnlyOffline, setShowOnlyOffline] = useState(false);
  const [showOnlyWithEvents, setShowOnlyWithEvents] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const { buildings, loading, stats } = useBuildingsWithDeviceStatus(eventsMap);

  // Filter buildings based on toggles
  const filteredBuildings = buildings.filter(b => {
    if (showOnlyOffline && b.status !== 'offline' && b.status !== 'partial') return false;
    if (showOnlyWithEvents && b.eventsCount === 0) return false;
    return true;
  });

  // Create marker pin element
  const createMarkerElement = useCallback((building: BuildingWithDeviceStatus) => {
    const pin = document.createElement('div');
    pin.className = 'relative cursor-pointer transform hover:scale-110 transition-transform';

    // Colors based on status
    const colors = {
      online: { bg: '#10B981', border: '#059669', pulse: false },
      partial: { bg: '#F59E0B', border: '#D97706', pulse: false },
      offline: { bg: '#EF4444', border: '#DC2626', pulse: true },
      unknown: { bg: '#6B7280', border: '#4B5563', pulse: false },
    };
    const config = colors[building.status];

    // Provider accent color
    const providerColor = building.provider 
      ? PROVIDER_COLORS[building.provider] || PROVIDER_COLORS.default 
      : undefined;

    pin.innerHTML = `
      <div class="relative">
        ${config.pulse ? `
          <div class="absolute inset-0 rounded-full animate-ping opacity-75" 
               style="background-color: ${config.bg}40;"></div>
        ` : ''}
        <div class="relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2"
             style="background-color: ${config.bg}; border-color: ${config.border};">
          <span class="text-white text-xs font-bold">${building.totalDevices}</span>
        </div>
        ${providerColor ? `
          <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow"
               style="background-color: ${providerColor};"></div>
        ` : ''}
        ${building.eventsCount > 0 ? `
          <div class="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow">
            <span class="text-white text-[10px] font-bold">${building.eventsCount > 99 ? '99+' : building.eventsCount}</span>
          </div>
        ` : ''}
      </div>
    `;

    return pin;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        await loadGoogleMaps();

        if (!isMounted || !mapRef.current) return;

        const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
        await google.maps.importLibrary('marker');

        const map = new Map(mapRef.current, {
          center: DEFAULT_MAP_CONFIG.center,
          zoom: DEFAULT_MAP_CONFIG.zoom,
          mapId: 'paineis-map',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (error) {
        console.error('[PaineisMapModal] Error initializing map:', error);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      markersRef.current = [];
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
    };
  }, [isOpen]);

  // Update markers when buildings change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    const { AdvancedMarkerElement } = google.maps.marker;

    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

    filteredBuildings.forEach(building => {
      const lat = building.manual_latitude || building.latitude;
      const lng = building.manual_longitude || building.longitude;

      if (!lat || !lng || lat === 0 || lng === 0) return;

      const markerElement = createMarkerElement(building);

      const marker = new AdvancedMarkerElement({
        position: { lat, lng },
        map: mapInstanceRef.current,
        content: markerElement,
        title: building.nome,
      });

      marker.addListener('click', () => {
        setSelectedBuilding(building);
      });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

    // Create clusterer
    clustererRef.current = new MarkerClusterer({
      map: mapInstanceRef.current,
      markers: newMarkers,
      renderer: {
        render: ({ count, position }) => {
          const div = document.createElement('div');
          div.className = 'flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold shadow-lg border-2 border-white';
          div.textContent = String(count);
          return new google.maps.marker.AdvancedMarkerElement({
            position,
            content: div,
          });
        },
      },
    });
  }, [filteredBuildings, mapReady, createMarkerElement]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Mapa de Painéis</h2>
              <p className="text-sm text-muted-foreground">
                Foz do Iguaçu • {periodLabel}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 px-4 pb-3 overflow-x-auto">
          <Badge variant="outline" className="gap-1.5 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5" />
            {stats.total} prédios
          </Badge>
          <Badge variant="outline" className="gap-1.5 text-green-600 border-green-300 whitespace-nowrap">
            <Wifi className="w-3.5 h-3.5" />
            {stats.online} online
          </Badge>
          <Badge variant="outline" className="gap-1.5 text-yellow-600 border-yellow-300 whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5" />
            {stats.partial} parcial
          </Badge>
          <Badge variant="outline" className="gap-1.5 text-red-600 border-red-300 whitespace-nowrap">
            <WifiOff className="w-3.5 h-3.5" />
            {stats.offline} offline
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 px-4 pb-3 border-t border-border pt-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Switch
              id="only-offline"
              checked={showOnlyOffline}
              onCheckedChange={setShowOnlyOffline}
            />
            <Label htmlFor="only-offline" className="text-sm cursor-pointer">
              Apenas com problemas
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="with-events"
              checked={showOnlyWithEvents}
              onCheckedChange={setShowOnlyWithEvents}
            />
            <Label htmlFor="with-events" className="text-sm cursor-pointer">
              Com quedas {periodLabel}
            </Label>
          </div>
        </div>
      </div>

      {/* Map container */}
      <div ref={mapRef} className="w-full h-full pt-40" />

      {/* Loading overlay */}
      {(loading || !mapReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-30">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Building detail card */}
      {selectedBuilding && (
        <BuildingDetailCard
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
          periodLabel={periodLabel}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg border border-border p-3 z-10 hidden md:block">
        <p className="text-xs font-medium text-muted-foreground mb-2">Legenda</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs">Todos online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs">Parcialmente online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs">Todos offline</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
