
import { useEffect, useCallback } from 'react';
import { fetchAllBuildingData } from '@/services/buildingDetailsService';
import { fetchBuildingContactInfo, canAccessBuildingContacts } from '@/services/buildingContactService';
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
    contactInfo,
    canAccessContacts,
    loading,
    updateAllData,
    updateContactData,
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
      
      // Check if user can access contact information
      const hasContactAccess = await canAccessBuildingContacts();
      
      // Fetch building data
      const data = await fetchAllBuildingData(building.id);
      updateAllData(data);
      
      // Fetch contact information only if user has access
      let contactData = null;
      if (hasContactAccess) {
        contactData = await fetchBuildingContactInfo(building.id);
      }
      
      updateContactData(contactData, hasContactAccess);
      
      console.log('✅ [BUILDING DETAILS] Dados carregados:', {
        actionLogs: data.actionLogs?.length || 0,
        sales: data.sales?.length || 0,
        panels: data.panels?.length || 0,
        hasContactAccess
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
    contactInfo,
    canAccessContacts,
    loading,
    fetchBuildingData
  };
};
