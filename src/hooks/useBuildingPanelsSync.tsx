
import { useCallback } from 'react';

interface UseBuildingPanelsSyncProps {
  onRefreshAssignedPanels: () => void;
  onRefreshAvailablePanels: () => void;
}

export const useBuildingPanelsSync = ({
  onRefreshAssignedPanels,
  onRefreshAvailablePanels
}: UseBuildingPanelsSyncProps) => {
  
  const syncPanelsData = useCallback(() => {
    console.log('🔄 [BUILDING PANELS SYNC] Sincronizando dados de painéis');
    onRefreshAssignedPanels();
    onRefreshAvailablePanels();
  }, [onRefreshAssignedPanels, onRefreshAvailablePanels]);

  return {
    syncPanelsData
  };
};
