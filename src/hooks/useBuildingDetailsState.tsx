
import { useState, useCallback } from 'react';

interface BuildingDetailsData {
  actionLogs: any[];
  sales: any[];
  panels: any[];
}

export const useBuildingDetailsState = () => {
  const [actionLogs, setActionLogs] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [panels, setPanels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const updateAllData = useCallback((data: BuildingDetailsData) => {
    console.log('📊 [BUILDING DETAILS STATE] Atualizando dados:', {
      actionLogsCount: data.actionLogs?.length || 0,
      salesCount: data.sales?.length || 0,
      panelsCount: data.panels?.length || 0
    });

    setActionLogs(data.actionLogs || []);
    setSales(data.sales || []);
    setPanels(data.panels || []);
  }, []);

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  const clearData = useCallback(() => {
    console.log('🧹 [BUILDING DETAILS STATE] Limpando dados');
    setActionLogs([]);
    setSales([]);
    setPanels([]);
    setLoading(false);
  }, []);

  return {
    actionLogs,
    sales,
    panels,
    loading,
    updateAllData,
    setLoadingState,
    clearData
  };
};
