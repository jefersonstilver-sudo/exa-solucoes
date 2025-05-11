
import { useMapCleanup } from './useMapCleanup';
import { usePanelMarkers } from './usePanelMarkers';
import { useLocationMarker } from './useLocationMarker';
import type { Panel } from '@/types/panel';

interface UseMapMarkersProps {
  onAddToCart?: (panel: Panel, duration?: number) => void;
  instanceId: string;
}

/**
 * Main hook that combines map marker functionality
 */
export const useMapMarkers = ({ onAddToCart, instanceId }: UseMapMarkersProps) => {
  // Use our smaller, more focused hooks
  const { markersRef, infoWindowsRef, clearMarkersAndInfoWindows } = useMapCleanup();
  
  const { addPanelMarkers } = usePanelMarkers({ 
    markersRef, 
    infoWindowsRef, 
    onAddToCart, 
    instanceId 
  });
  
  const { addSelectedLocationMarker } = useLocationMarker({ markersRef });

  return {
    markersRef,
    infoWindowsRef,
    clearMarkersAndInfoWindows,
    addPanelMarkers,
    addSelectedLocationMarker
  };
};
