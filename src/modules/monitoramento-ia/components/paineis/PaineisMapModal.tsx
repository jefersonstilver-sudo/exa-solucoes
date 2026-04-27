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

// Create SVG marker as data URL (works without mapId)
// Cores seguem o ciclo de vida do prédio (igual à página "Painéis Real"):
//   ativo      → verde
//   instalacao → amarelo
//   inativo    → vermelho
const createMarkerSvgUrl = (
  kind: 'ativo' | 'instalacao' | 'inativo',
  sequentialNumber: number
): string => {
  const colors = {
    ativo:      { primary: '#22C55E', dark: '#16A34A' },
    instalacao: { primary: '#F59E0B', dark: '#D97706' },
    inativo:    { primary: '#EF4444', dark: '#DC2626' },
  };

  const { primary, dark } = colors[kind] || colors.ativo;
  
  const svg = `
    <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${dark};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z" fill="url(#pinGrad)"/>
        <ellipse cx="11" cy="11" rx="7" ry="6" fill="white" fill-opacity="0.3"/>
        <circle cx="16" cy="14" r="9" fill="white"/>
        <text x="16" y="18" text-anchor="middle" font-size="11" font-weight="700" fill="${dark}" font-family="system-ui,-apple-system,sans-serif">${sequentialNumber}</text>
      </g>
    </svg>
  `;
  
  return 'data:image/svg+xml,' + encodeURIComponent(svg.trim());
};

export const PaineisMapModal: React.FC<PaineisMapModalProps> = ({
  isOpen,
  onClose,
  eventsMap,
  periodLabel = 'hoje',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
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

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        setMapInitError(null);
        await loadGoogleMaps();

        if (!isMounted || !mapRef.current) return;

        const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;

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

        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (error: any) {
        console.error('[PaineisMapModal] Error initializing map:', error);
        setMapReady(false);
        setMapInitError('Erro ao carregar o mapa. Tente novamente.');
      }
    };

    initMap();

    return () => {
      isMounted = false;
      // Clean up markers
      markersRef.current.forEach((marker) => marker.setMap(null));
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
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow({ disableAutoPan: true });
    }

    const newMarkers: google.maps.Marker[] = [];

    filteredBuildings.forEach((building, index) => {
      const lat = building.manual_latitude || building.latitude;
      const lng = building.manual_longitude || building.longitude;
      if (!lat || !lng || lat === 0 || lng === 0) return;

      const iconUrl = createMarkerSvgUrl(building.status, index + 1);

      // Use classic google.maps.Marker (no mapId required)
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(32, 42),
          anchor: new google.maps.Point(16, 42),
        },
        title: building.nome,
        animation: building.status === 'offline' ? google.maps.Animation.BOUNCE : undefined,
        optimized: true,
      });

      // Stop bounce animation after 2 seconds for offline markers
      if (building.status === 'offline') {
        setTimeout(() => marker.setAnimation(null), 2000);
      }

      const statusColors = {
        online: '#22C55E',
        partial: '#F59E0B',
        offline: '#EF4444',
        unknown: '#6B7280',
      } as const;
      const statusColor = statusColors[building.status];

      marker.addListener('mouseover', () => {
        infoWindowRef.current?.setContent(`
          <div style="padding:8px 12px;font-family:system-ui,-apple-system,sans-serif;min-width:140px;">
            <div style="font-weight:600;font-size:13px;color:#1f2937;">${building.nome}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${statusColor};box-shadow:0 0 4px ${statusColor};"></span>
              <span style="font-size:11px;color:#666;">${building.onlineCount}/${building.totalDevices} painéis online</span>
            </div>
          </div>
        `);
        infoWindowRef.current?.open(mapInstanceRef.current, marker);
      });

      marker.addListener('mouseout', () => {
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
        const pos = m.getPosition();
        if (pos) bounds.extend(pos);
      });
      mapInstanceRef.current.fitBounds(bounds, { top: 80, right: 20, bottom: 80, left: 20 });
    }
  }, [filteredBuildings, mapReady]);

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
    } catch {
      toast.error('Não foi possível girar o mapa.');
    }
  }, []);

  if (!isOpen) return null;

  const offlineCount = buildings.filter((b) => b.status === 'offline' || b.status === 'partial').length;
  const eventsCount = buildings.reduce((sum, b) => sum + b.eventsCount, 0);
  const totalPanels = buildings.reduce((sum, b) => sum + b.totalDevices, 0);

  const headerHeight = 64;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background overflow-hidden"
      style={{ isolation: 'isolate' }}
    >
      {/* Glass Header */}
      <div
        className="absolute top-0 left-0 right-0 z-20 
          bg-gradient-to-b from-white/95 to-white/85 
          dark:from-gray-900/95 dark:to-gray-900/85 
          backdrop-blur-2xl 
          border-b border-gray-200/50 dark:border-gray-700/50 
          shadow-lg shadow-black/5
          flex items-center justify-between px-4"
        style={{ 
          height: headerHeight, 
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="flex items-center gap-4 sm:gap-6">
          <FancyToggle
            checked={showOnlyOffline}
            onChange={setShowOnlyOffline}
            color="red"
            size="large"
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Problemas</span>
            {offlineCount > 0 && (
              <span className="ml-1 text-[10px] bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">
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
            <span className="hidden sm:inline">Quedas {periodLabel}</span>
            {eventsCount > 0 && (
              <span className="ml-1 text-[10px] bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-medium">
                {eventsCount}
              </span>
            )}
          </FancyToggle>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground bg-white/50 dark:bg-gray-800/50 rounded-full px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span className="font-semibold text-foreground">{stats.total}</span>
              <span>prédios</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground">{totalPanels}</span>
              <span>painéis</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen((v) => !v)}
            className="h-9 w-9 rounded-full bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
            aria-label="Configurações do mapa"
          >
            <Settings2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="absolute inset-0"
        style={{ top: headerHeight }}
      />

      {/* Settings panel */}
      {settingsOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-30
            bg-white/90 dark:bg-gray-900/90 
            backdrop-blur-2xl 
            border border-gray-200/50 dark:border-gray-700/50 
            rounded-2xl shadow-2xl shadow-black/10 
            p-4"
          style={{ top: headerHeight + 12 }}
          role="dialog"
          aria-label="Configurações do mapa"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-foreground">Configurações</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(false)}
              className="h-7 w-7 rounded-full"
              aria-label="Fechar configurações"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-2">
            <FancyToggle
              checked={showLabels}
              onChange={setShowLabels}
              color="gray"
              size="large"
              icon={<Type className="w-3.5 h-3.5" />}
            >
              Nomes e labels
            </FancyToggle>

            <FancyToggle
              checked={showPois}
              onChange={setShowPois}
              color="gray"
              size="large"
              icon={<MapPinned className="w-3.5 h-3.5" />}
            >
              Pontos de interesse
            </FancyToggle>

            <FancyToggle
              checked={showTransit}
              onChange={setShowTransit}
              color="gray"
              size="large"
              icon={<TramFront className="w-3.5 h-3.5" />}
            >
              Transporte público
            </FancyToggle>

            <div className="flex items-center justify-between rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2.5">
              <div>
                <div className="font-medium text-sm text-foreground">Girar mapa</div>
                <div className="text-xs text-muted-foreground">Se suportado</div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => rotate(-15)}
                  aria-label="Girar para a esquerda"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => rotate(15)}
                  aria-label="Girar para a direita"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Dica: desmarque tudo para ver apenas ruas + pins.
          </p>
        </motion.div>
      )}

      {/* Loading overlay */}
      {(loading || !mapReady) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-40"
        >
          <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <Loader2 className="w-10 h-10 animate-spin text-primary relative" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Carregando mapa...</p>
              <p className="text-sm text-muted-foreground mt-1">Aguarde um momento</p>
            </div>
            {mapInitError && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-full">
                {mapInitError}
              </p>
            )}
          </div>
        </motion.div>
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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 
        bg-white/90 dark:bg-gray-900/90 
        backdrop-blur-2xl 
        rounded-2xl 
        border border-gray-200/50 dark:border-gray-700/50 
        px-5 py-3 z-20 
        flex items-center gap-5 
        shadow-xl shadow-black/10"
      >
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-md shadow-green-500/40" />
          <span className="text-xs font-medium text-foreground">Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-md shadow-yellow-500/40" />
          <span className="text-xs font-medium text-foreground">Parcial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse shadow-md shadow-red-500/40" />
          <span className="text-xs font-medium text-foreground">Offline</span>
        </div>
      </div>
    </motion.div>
  );
};
