import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import loadGoogleMaps from '@/utils/googleMapsLoader';
import { DEFAULT_MAP_CONFIG, MAP_STYLES } from '@/utils/mapConstants';
import { useBuildingsWithDeviceStatus, BuildingWithDeviceStatus } from '../../hooks/useBuildingsWithDeviceStatus';
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

  // Create small 3D numbered pin element
  const createMarkerElement = useCallback((building: BuildingWithDeviceStatus, sequentialNumber: number) => {
    const pin = document.createElement('div');
    pin.className = 'relative cursor-pointer';

    // Colors based on status
    const isOnline = building.status === 'online';
    const isOffline = building.status === 'offline';
    const primaryColor = isOnline ? '#22C55E' : isOffline ? '#EF4444' : '#F59E0B';
    const darkColor = isOnline ? '#16A34A' : isOffline ? '#DC2626' : '#D97706';
    const glowColor = isOnline ? 'rgba(34, 197, 94, 0.5)' : isOffline ? 'rgba(239, 68, 68, 0.6)' : 'rgba(245, 158, 11, 0.5)';

    pin.innerHTML = `
      <div class="relative" style="width:28px;height:36px;">
        ${isOffline ? `
          <div style="position:absolute;inset:-4px;border-radius:50%;background:${glowColor};animation:pulse-offline 1.2s ease-in-out infinite;"></div>
        ` : `
          <div style="position:absolute;inset:-2px;border-radius:50% 50% 50% 50%;background:${glowColor};opacity:0.6;"></div>
        `}
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <defs>
            <linearGradient id="pinGrad${sequentialNumber}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${darkColor};stop-opacity:1" />
            </linearGradient>
            <linearGradient id="pinHighlight${sequentialNumber}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:white;stop-opacity:0.4" />
              <stop offset="50%" style="stop-color:white;stop-opacity:0" />
            </linearGradient>
          </defs>
          <!-- Pin body -->
          <path d="M14 0C6.268 0 0 6.268 0 14c0 7.732 14 22 14 22s14-14.268 14-22C28 6.268 21.732 0 14 0z" fill="url(#pinGrad${sequentialNumber})"/>
          <!-- Highlight -->
          <ellipse cx="10" cy="10" rx="6" ry="5" fill="url(#pinHighlight${sequentialNumber})"/>
          <!-- White circle for number -->
          <circle cx="14" cy="12" r="8" fill="white"/>
          <!-- Number -->
          <text x="14" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="${darkColor}" font-family="system-ui,-apple-system,sans-serif">${sequentialNumber}</text>
        </svg>
      </div>
      <style>
        @keyframes pulse-offline {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.15); }
        }
      </style>
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
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          scrollwheel: true,
          styles: MAP_STYLES,
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

  // InfoWindow ref for hover tooltips
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

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

    // Create InfoWindow for hover if not exists
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow({
        disableAutoPan: true,
      });
    }

    const { AdvancedMarkerElement } = google.maps.marker;

    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

    filteredBuildings.forEach((building, index) => {
      const lat = building.manual_latitude || building.latitude;
      const lng = building.manual_longitude || building.longitude;

      if (!lat || !lng || lat === 0 || lng === 0) return;

      const sequentialNumber = index + 1;
      const markerElement = createMarkerElement(building, sequentialNumber);

      const marker = new AdvancedMarkerElement({
        position: { lat, lng },
        map: mapInstanceRef.current,
        content: markerElement,
        title: building.nome,
      });

      // Status color for InfoWindow
      const statusColors = {
        online: '#22C55E',
        partial: '#F59E0B', 
        offline: '#EF4444',
        unknown: '#6B7280',
      };
      const statusColor = statusColors[building.status];

      // Hover - show simple name tooltip
      markerElement.addEventListener('mouseenter', () => {
        infoWindowRef.current?.setContent(`
          <div style="padding:6px 10px;font-family:system-ui,-apple-system,sans-serif;">
            <div style="font-weight:600;font-size:13px;color:#1f2937;">${building.nome}</div>
            <div style="display:flex;align-items:center;gap:4px;margin-top:3px;">
              <span style="width:6px;height:6px;border-radius:50%;background:${statusColor};"></span>
              <span style="font-size:11px;color:#666;">${building.onlineCount}/${building.totalDevices} painéis</span>
            </div>
          </div>
        `);
        infoWindowRef.current?.open(mapInstanceRef.current, marker);
      });

      markerElement.addEventListener('mouseleave', () => {
        infoWindowRef.current?.close();
      });

      // Click - show detail card
      marker.addListener('click', () => {
        setSelectedBuilding(building);
      });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

    // Create clusterer with enhanced styling
    clustererRef.current = new MarkerClusterer({
      map: mapInstanceRef.current,
      markers: newMarkers,
      renderer: {
        render: ({ count, position }) => {
          const div = document.createElement('div');
          div.className = 'flex items-center justify-center w-14 h-14 rounded-full text-white font-bold shadow-xl border-3 border-white';
          div.style.background = 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)';
          div.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.4), 0 2px 6px rgba(0,0,0,0.2)';
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
      {/* Minimalist Header - 48px */}
      <div className="absolute top-0 left-0 right-0 z-10 h-12 bg-card/90 backdrop-blur-sm border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="only-offline"
              checked={showOnlyOffline}
              onCheckedChange={setShowOnlyOffline}
              className="scale-90"
            />
            <Label htmlFor="only-offline" className="text-xs cursor-pointer flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              Problemas
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="with-events"
              checked={showOnlyWithEvents}
              onCheckedChange={setShowOnlyWithEvents}
              className="scale-90"
            />
            <Label htmlFor="with-events" className="text-xs cursor-pointer flex items-center gap-1">
              <Zap className="w-3 h-3 text-orange-500" />
              Quedas {periodLabel}
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{stats.total} prédios</span>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map container - full screen with small top padding */}
      <div ref={mapRef} className="w-full h-full pt-12" />

      {/* Loading overlay */}
      {(loading || !mapReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-30">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Carregando mapa...</p>
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

      {/* Compact Legend - bottom right */}
      <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm rounded-lg border border-border px-3 py-2 z-10 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-[10px] text-muted-foreground">Online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="text-[10px] text-muted-foreground">Parcial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-muted-foreground">Offline</span>
        </div>
      </div>
    </motion.div>
  );
};
