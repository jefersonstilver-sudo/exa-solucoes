
import { useState, useCallback } from 'react';

export const useBuildingDetailsState = () => {
  const [actionLogs, setActionLogs] = useState([]);
  const [sales, setSales] = useState([]);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);

  const updateActionLogs = useCallback((logs: any[]) => {
    setActionLogs(logs);
  }, []);

  const updateSales = useCallback((salesData: any[]) => {
    setSales(salesData);
  }, []);

  const updatePanels = useCallback((panelsData: any[]) => {
    setPanels(panelsData);
  }, []);

  const updateAllData = useCallback((data: { actionLogs: any[], sales: any[], panels: any[] }) => {
    setActionLogs(data.actionLogs);
    setSales(data.sales);
    setPanels(data.panels);
  }, []);

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  const clearData = useCallback(() => {
    setActionLogs([]);
    setSales([]);
    setPanels([]);
  }, []);

  return {
    actionLogs,
    sales,
    panels,
    loading,
    updateActionLogs,
    updateSales,
    updatePanels,
    updateAllData,
    setLoadingState,
    clearData
  };
};
