import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, Zap, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FancyToggle } from '@/components/ui/fancy-toggle';
import loadGoogleMaps from '@/utils/googleMapsLoader';
import { DEFAULT_MAP_CONFIG } from '@/utils/mapConstants';
import { useBuildingsWithDeviceStatus, BuildingWithDeviceStatus } from '../../hooks/useBuildingsWithDeviceStatus';
import { BuildingDetailCard } from './BuildingDetailCard';

interface PaineisMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventsMap?: Map<string, number>;
  periodLabel?: string;
}

// Clean map styles - hide ALL POIs, labels, company names
const CLEAN_MAP_STYLES: google.maps.MapTypeStyle[] = [
  // Hide ALL points of interest
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  // Hide ALL labels/text
  { featureType: "all", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "all", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  // Hide transit
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  // Keep roads visible but no labels
  { featureType: "road", elementType: "geometry", stylers: [{ visibility: "on" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  // Keep water and landscape visible
  { featureType: "water", elementType: "geometry", stylers: [{ visibility: "on" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ visibility: "on" }] },
  // Administrative boundaries
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "on" }] },
  { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
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

  const [selectedBuilding, setSelectedBuilding] = useState<BuildingWithDeviceStatus | null>(null);
  const [showOnlyOffline, setShowOnlyOffline] = useState(false);
  const [showOnlyWithEvents, setShowOnlyWithEvents] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const { buildings, loading, stats, refetch } = useBuildingsWithDeviceStatus(eventsMap);

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
          zoom: 14, // More zoomed in for horizontal view
          // NO mapId - this allows styles to work
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          scrollwheel: true,
          styles: CLEAN_MAP_STYLES,
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
    };
  }, [isOpen]);

  // InfoWindow ref for hover tooltips
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Handle address update from BuildingDetailCard
  const handleAddressUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  // Update markers when buildings change - NO CLUSTERER
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];

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

    // Fit bounds to show all markers if we have markers
    if (newMarkers.length > 0 && mapInstanceRef.current) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        if (marker.position) {
          bounds.extend(marker.position as google.maps.LatLng);
        }
      });
      mapInstanceRef.current.fitBounds(bounds, { top: 80, right: 20, bottom: 60, left: 20 });
    }
  }, [filteredBuildings, mapReady, createMarkerElement]);

  if (!isOpen) return null;

  // Count stats for display
  const offlineCount = buildings.filter(b => b.status === 'offline' || b.status === 'partial').length;
  const eventsCount = buildings.reduce((sum, b) => sum + b.eventsCount, 0);
  const totalPanels = buildings.reduce((sum, b) => sum + b.totalDevices, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Glassmorphism Header */}
      <div className="absolute top-0 left-0 right-0 z-10 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/30 shadow-sm flex items-center justify-between px-4">
        {/* Left: Toggles */}
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

        {/* Right: Stats & Close */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
            onClick={onClose} 
            className="h-9 w-9 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map container - full screen with header offset */}
      <div ref={mapRef} className="w-full h-full pt-14" />

      {/* Loading overlay */}
      {(loading || !mapReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-30">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-white/20 shadow-xl">
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
          onAddressUpdate={handleAddressUpdate}
          periodLabel={periodLabel}
        />
      )}

      {/* Compact Legend - bottom right glassmorphism */}
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
