
import { useEffect, useCallback } from 'react';
import { fetchAllBuildingData } from '@/services/buildingDetailsService';
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
      console.log('🏢 [BUILDING DETAILS] Carregando dados completos do prédio:', building.id);
      const data = await fetchAllBuildingData(building.id);
      updateAllData(data);
      console.log('✅ [BUILDING DETAILS] Dados carregados:', {
        actionLogs: data.actionLogs?.length || 0,
        sales: data.sales?.length || 0,
        panels: data.panels?.length || 0
      });
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

  return {
    actionLogs,
    sales,
    panels,
    loading,
    fetchBuildingData
  };
};
