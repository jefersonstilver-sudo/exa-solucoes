
import { useState, useCallback } from 'react';

interface BuildingDetailsData {
  actionLogs: any[];
  sales: any[];
}

export const useBuildingDetailsState = () => {
  const [actionLogs, setActionLogs] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const updateAllData = useCallback((data: BuildingDetailsData) => {
    console.log('📊 [BUILDING DETAILS STATE] Atualizando dados:', {
      actionLogsCount: data.actionLogs?.length || 0,
      salesCount: data.sales?.length || 0
    });

    setActionLogs(data.actionLogs || []);
    setSales(data.sales || []);
  }, []);

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  const clearData = useCallback(() => {
    console.log('🧹 [BUILDING DETAILS STATE] Limpando dados');
    setActionLogs([]);
    setSales([]);
    setLoading(false);
  }, []);

  return {
    actionLogs,
    sales,
    loading,
    updateAllData,
    setLoadingState,
    clearData
  };
};
