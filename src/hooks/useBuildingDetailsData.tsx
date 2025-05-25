
import { useEffect, useCallback } from 'react';
import { fetchAllBuildingData } from '@/services/buildingDetailsService';
import { syncPanel, viewPanelDetails } from '@/services/buildingPanelOperations';
import { useBuildingDetailsState } from './useBuildingDetailsState';

interface UseBuildingDetailsDataProps {
  building?: any;
  open: boolean;
}

export const useBuildingDetailsData = ({ building, open }: UseBuildingDetailsDataProps) => {
  const {
    actionLogs,
    sales,
    panels,
    loading,
    updateAllData,
    setLoadingState,
    clearData
  } = useBuildingDetailsState();

  const fetchBuildingData = useCallback(async () => {
    if (!building?.id) {
      console.error('❌ [BUILDING DETAILS] ID do prédio não encontrado');
      return;
    }
    
    setLoadingState(true);
    try {
      const data = await fetchAllBuildingData(building.id);
      updateAllData(data);
    } catch (error) {
      console.error('💥 [BUILDING DETAILS] Erro ao carregar dados:', error);
    } finally {
      setLoadingState(false);
    }
  }, [building?.id, updateAllData, setLoadingState]);

  useEffect(() => {
    if (building && open) {
      console.log('🏢 [BUILDING DETAILS] Carregando dados do prédio:', building.nome);
      fetchBuildingData();
    } else if (!open) {
      // Clear data when dialog closes to prevent stale data
      clearData();
    }
  }, [building, open, fetchBuildingData, clearData]);

  const handleSyncPanel = useCallback(async (panelId: string) => {
    try {
      await syncPanel(panelId);
      fetchBuildingData();
    } catch (error) {
      // Error already handled in syncPanel
    }
  }, [fetchBuildingData]);

  const handleViewPanelDetails = useCallback((panelId: string) => {
    viewPanelDetails(panelId);
  }, []);

  return {
    actionLogs,
    sales,
    panels,
    loading,
    fetchBuildingData,
    handleSyncPanel,
    handleViewPanelDetails
  };
};
