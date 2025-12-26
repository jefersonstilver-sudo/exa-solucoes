import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  AlertTriangle,
  Zap,
  Loader2,
  Building2,
  Settings2,
  RotateCcw,
  RotateCw,
  Type,
  MapPinned,
  TramFront,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FancyToggle } from '@/components/ui/fancy-toggle';
import loadGoogleMaps from '@/utils/googleMapsLoader';
import { DEFAULT_MAP_CONFIG } from '@/utils/mapConstants';
import { useBuildingsWithDeviceStatus, BuildingWithDeviceStatus } from '../../hooks/useBuildingsWithDeviceStatus';
import { BuildingDetailCard } from './BuildingDetailCard';
import { toast } from 'sonner';

interface PaineisMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventsMap?: Map<string, number>;
  periodLabel?: string;
}

// Baseline: show roads/water/land, hide labels/POIs/transit.
const BASE_CLEAN_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'all', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  { featureType: 'all', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ visibility: 'on' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ visibility: 'on' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ visibility: 'on' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'on' }] },
  { featureType: 'administrative', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

export const PaineisMapModal: React.FC<PaineisMapModalProps> = ({
  isOpen,
  onClose,
  eventsMap,
  periodLabel = 'hoje',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [selectedBuilding, setSelectedBuilding] = useState<BuildingWithDeviceStatus | null>(null);
  const [showOnlyOffline, setShowOnlyOffline] = useState(false);
  const [showOnlyWithEvents, setShowOnlyWithEvents] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitError, setMapInitError] = useState<string | null>(null);

  // Settings (configuração)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showPois, setShowPois] = useState(false);
  const [showTransit, setShowTransit] = useState(false);

  const { buildings, loading, stats, refetch } = useBuildingsWithDeviceStatus(eventsMap);

  const filteredBuildings = buildings.filter((b) => {
    if (showOnlyOffline && b.status !== 'offline' && b.status !== 'partial') return false;
    if (showOnlyWithEvents && b.eventsCount === 0) return false;
    return true;
  });

  const computedStyles = useMemo(() => {
    const styles: google.maps.MapTypeStyle[] = [...BASE_CLEAN_MAP_STYLES];

    if (showLabels) {
      styles.push(
        { featureType: 'all', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
        { featureType: 'all', elementType: 'labels.icon', stylers: [{ visibility: 'on' }] },
        { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'on' }] },
        { featureType: 'administrative', elementType: 'labels', stylers: [{ visibility: 'on' }] },
      );
    }

    if (showPois) {
      styles.push({ featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'on' }] });
    }

    if (showTransit) {
      styles.push({ featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'on' }] });
    }

    return styles;
  }, [showLabels, showPois, showTransit]);

  const createMarkerElement = useCallback((building: BuildingWithDeviceStatus, sequentialNumber: number) => {
    const pin = document.createElement('div');
    pin.className = 'relative cursor-pointer';

    const isOnline = building.status === 'online';
    const isOffline = building.status === 'offline';
    const primaryColor = isOnline ? '#22C55E' : isOffline ? '#EF4444' : '#F59E0B';
    const darkColor = isOnline ? '#16A34A' : isOffline ? '#DC2626' : '#D97706';
    const glowColor = isOnline
      ? 'rgba(34, 197, 94, 0.5)'
      : isOffline
        ? 'rgba(239, 68, 68, 0.6)'
        : 'rgba(245, 158, 11, 0.5)';

    pin.innerHTML = `
      <div class="relative" style="width:28px;height:36px;">
        ${isOffline
          ? `<div style="position:absolute;inset:-4px;border-radius:50%;background:${glowColor};animation:pulse-offline 1.2s ease-in-out infinite;"></div>`
          : `<div style="position:absolute;inset:-2px;border-radius:50% 50% 50% 50%;background:${glowColor};opacity:0.6;"></div>`}
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
          <path d="M14 0C6.268 0 0 6.268 0 14c0 7.732 14 22 14 22s14-14.268 14-22C28 6.268 21.732 0 14 0z" fill="url(#pinGrad${sequentialNumber})"/>
          <ellipse cx="10" cy="10" rx="6" ry="5" fill="url(#pinHighlight${sequentialNumber})"/>
          <circle cx="14" cy="12" r="8" fill="white"/>
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

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        setMapInitError(null);
        await loadGoogleMaps();

        if (!isMounted || !mapRef.current) return;

        const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
        await google.maps.importLibrary('marker');

        const map = new Map(mapRef.current, {
          center: DEFAULT_MAP_CONFIG.center,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          scrollwheel: true,
          styles: computedStyles,
        });

        // Try to enable tilt/heading if supported by this map mode
        try {
          map.setTilt(45);
        } catch {
          // ignore
        }

        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (error: any) {
        console.error('[PaineisMapModal] Error initializing map:', error);
        setMapReady(false);
        setMapInitError('Esta página não carregou o Google Maps corretamente.');
      }
    };

    initMap();

    return () => {
      isMounted = false;
      markersRef.current = [];
      mapInstanceRef.current = null;
      setMapReady(false);
    };
  }, [isOpen, computedStyles]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setOptions({ styles: computedStyles });
  }, [computedStyles]);

  const handleAddressUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow({ disableAutoPan: true });
    }

    const { AdvancedMarkerElement } = google.maps.marker;
    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

    filteredBuildings.forEach((building, index) => {
      const lat = building.manual_latitude || building.latitude;
      const lng = building.manual_longitude || building.longitude;
      if (!lat || !lng || lat === 0 || lng === 0) return;

      const markerElement = createMarkerElement(building, index + 1);

      const marker = new AdvancedMarkerElement({
        position: { lat, lng },
        map: mapInstanceRef.current,
        content: markerElement,
        title: building.nome,
      });

      const statusColors = {
        online: '#22C55E',
        partial: '#F59E0B',
        offline: '#EF4444',
        unknown: '#6B7280',
      } as const;
      const statusColor = statusColors[building.status];

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

      marker.addListener('click', () => {
        setSelectedBuilding(building);
      });

      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach((m) => {
        if (m.position) bounds.extend(m.position as google.maps.LatLng);
      });
      mapInstanceRef.current.fitBounds(bounds, { top: 80, right: 20, bottom: 60, left: 20 });
    }
  }, [filteredBuildings, mapReady, createMarkerElement]);

  const rotate = useCallback((delta: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const canHeading = typeof (map as any).getHeading === 'function' && typeof (map as any).setHeading === 'function';
    if (!canHeading) {
      toast.error('Rotação não suportada neste modo do Google Maps.');
      return;
    }

    try {
      const current = (map as any).getHeading?.() ?? 0;
      (map as any).setHeading(current + delta);
      try {
        map.setTilt(45);
      } catch {
        // ignore
      }
    } catch {
      toast.error('Não foi possível girar o mapa.');
    }
  }, []);

  if (!isOpen) return null;

  const offlineCount = buildings.filter((b) => b.status === 'offline' || b.status === 'partial').length;
  const eventsCount = buildings.reduce((sum, b) => sum + b.eventsCount, 0);
  const totalPanels = buildings.reduce((sum, b) => sum + b.totalDevices, 0);

  const headerHeight = 'calc(56px + env(safe-area-inset-top))';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Glass Header (safe-area aware) */}
      <div
        className="absolute top-0 left-0 right-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/30 shadow-sm flex items-center justify-between px-4"
        style={{ height: headerHeight, paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-6">
          <FancyToggle
            checked={showOnlyOffline}
            onChange={setShowOnlyOffline}
            color="red"
            size="large"
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
          >
            Problemas
            {offlineCount > 0 && (
              <span className="ml-1 text-[10px] bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                {offlineCount}
              </span>
            )}
          </FancyToggle>

          <FancyToggle
            checked={showOnlyWithEvents}
            onChange={setShowOnlyWithEvents}
            color="orange"
            size="large"
            icon={<Zap className="w-3.5 h-3.5" />}
          >
            Quedas {periodLabel}
            {eventsCount > 0 && (
              <span className="ml-1 text-[10px] bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">
                {eventsCount}
              </span>
            )}
          </FancyToggle>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span className="font-medium">{stats.total}</span>
              <span>prédios</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1">
              <span className="font-medium">{totalPanels}</span>
              <span>painéis</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen((v) => !v)}
            className="h-9 w-9 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80"
            aria-label="Configurações do mapa"
          >
            <Settings2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="w-full h-full" style={{ paddingTop: headerHeight }} />

      {/* Settings panel */}
      {settingsOpen && (
        <div
          className="absolute left-4 right-4 top-[calc(56px+env(safe-area-inset-top)+12px)] z-20 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-xl p-4"
          role="dialog"
          aria-label="Configurações do mapa"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">Configuração</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(false)}
              className="h-8 w-8 rounded-full"
              aria-label="Fechar configurações"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FancyToggle
              checked={showLabels}
              onChange={setShowLabels}
              color="gray"
              size="large"
              icon={<Type className="w-3.5 h-3.5" />}
            >
              Nomes/labels
            </FancyToggle>

            <FancyToggle
              checked={showPois}
              onChange={setShowPois}
              color="gray"
              size="large"
              icon={<MapPinned className="w-3.5 h-3.5" />}
            >
              Pontos/empresas
            </FancyToggle>

            <FancyToggle
              checked={showTransit}
              onChange={setShowTransit}
              color="gray"
              size="large"
              icon={<TramFront className="w-3.5 h-3.5" />}
            >
              Transporte
            </FancyToggle>

            <div className="flex items-center justify-between rounded-2xl border border-white/20 dark:border-gray-700/30 bg-white/60 dark:bg-gray-800/40 px-4 py-3">
              <div className="text-xs text-muted-foreground">
                <div className="font-medium text-foreground text-sm">Girar mapa</div>
                <div className="mt-0.5">Ajuste fino (se suportado)</div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => rotate(-15)}
                  aria-label="Girar para a esquerda"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => rotate(15)}
                  aria-label="Girar para a direita"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">Dica: desmarque tudo para ver apenas ruas + pins de painéis.</div>
        </div>
      )}

      {/* Loading overlay */}
      {(loading || !mapReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-30">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-white/20 shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Carregando mapa...</p>
            {mapInitError && <p className="text-xs text-destructive">{mapInitError}</p>}
          </div>
        </div>
      )}

      {/* Building detail card */}
      {selectedBuilding && (
        <BuildingDetailCard
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
          onAddressUpdate={handleAddressUpdate}
          periodLabel={periodLabel}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/30 px-4 py-2.5 z-10 flex items-center gap-4 shadow-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
          <span className="text-xs text-foreground/80">Online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50" />
          <span className="text-xs text-foreground/80">Parcial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50" />
          <span className="text-xs text-foreground/80">Offline</span>
        </div>
      </div>
    </motion.div>
  );
};
