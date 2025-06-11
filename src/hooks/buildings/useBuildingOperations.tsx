import { Building } from '@/types/panel';
import { useBuildingLogger } from './useBuildingLogger';

interface UseBuildingOperationsProps {
  selectedBuilding: Building | null;
  setSelectedBuilding: (building: Building | null) => void;
  isDetailsOpen: boolean;
  setIsDetailsOpen: (open: boolean) => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  isImageManagerOpen: boolean;
  setIsImageManagerOpen: (open: boolean) => void;
  operationLoading: boolean;
  setOperationLoading: (loading: boolean) => void;
  deleteBuilding: (id: string) => Promise<void>;
  refetch: () => void;
}

export const useBuildingOperations = ({
  selectedBuilding,
  setSelectedBuilding,
  isDetailsOpen,
  setIsDetailsOpen,
  isFormOpen,
  setIsFormOpen,
  isImageManagerOpen,
  setIsImageManagerOpen,
  operationLoading,
  setOperationLoading,
  deleteBuilding,
  refetch
}: UseBuildingOperationsProps) => {
  const { logStateChange } = useBuildingLogger();

  const handleDeleteBuilding = async (building: any) => {
    console.log('🔥 [BUILDING OPERATIONS] INÍCIO - handleDeleteBuilding:', building.nome);
    
    if (!window.confirm(`Tem certeza que deseja excluir o prédio "${building.nome}"? Esta ação é irreversível.`)) {
      console.log('🚫 [BUILDING OPERATIONS] Exclusão cancelada pelo usuário.');
      return;
    }

    try {
      setOperationLoading(true);
      logStateChange('DELETE_INITIATED', { operationLoading: true });
      
      await deleteBuilding(building.id);
      
      const newState = {
        selectedBuilding: null,
        isDetailsOpen: false,
        isFormOpen: false,
        isImageManagerOpen: false,
        operationLoading: false
      };

      setSelectedBuilding(null);
      setIsDetailsOpen(false);
      setIsFormOpen(false);
      setIsImageManagerOpen(false);
      
      logStateChange('DELETE_SUCCESS', newState);
    } catch (error) {
      console.error('🚨 [BUILDING OPERATIONS] Erro ao excluir prédio:', error);
      logStateChange('DELETE_FAILED', { operationLoading: false, error });
      alert('Ocorreu um erro ao excluir o prédio. Por favor, tente novamente.');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleNewBuilding = () => {
    console.log('✨ [BUILDING OPERATIONS] INÍCIO - handleNewBuilding');
    
    const newState = {
      selectedBuilding: null,
      isDetailsOpen: false,
      isFormOpen: true,
      isImageManagerOpen: false,
      operationLoading: false
    };

    setSelectedBuilding(null);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
    setIsImageManagerOpen(false);
    
    logStateChange('NEW_BUILDING', newState);
  };

  const handleViewBuilding = (building: any) => {
    console.log('👁️ [BUILDING OPERATIONS] INÍCIO - handleViewBuilding:', building.nome);
    
    const newState = {
      selectedBuilding: building,
      isDetailsOpen: true,
      isFormOpen: false,
      isImageManagerOpen: false,
      operationLoading: false
    };

    setSelectedBuilding(building);
    setIsDetailsOpen(true);
    
    logStateChange('VIEW_BUILDING', newState);
  };

  const handleViewCampaigns = (building: any) => {
    console.log('🎬 [BUILDING OPERATIONS] INÍCIO - handleViewCampaigns:', building.nome);
    
    const newState = {
      selectedBuilding: building,
      isDetailsOpen: true,
      isFormOpen: false,
      isImageManagerOpen: false,
      operationLoading: false
    };

    setSelectedBuilding(building);
    setIsDetailsOpen(true);
    
    logStateChange('VIEW_CAMPAIGNS', newState);
  };

  const handleEditBuilding = (building: any) => {
    console.log('✏️ [BUILDING OPERATIONS] INÍCIO - handleEditBuilding:', building.nome);
    
    const newState = {
      selectedBuilding: building,
      isDetailsOpen: false,
      isFormOpen: true,
      isImageManagerOpen: false,
      operationLoading: false
    };

    setSelectedBuilding(building);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
    setIsImageManagerOpen(false);
    
    logStateChange('EDIT_BUILDING', newState);
  };

  const handleImageManager = (building: any) => {
    console.log('🖼️ [BUILDING OPERATIONS] INÍCIO - handleImageManager:', building.nome);
    
    const newState = {
      selectedBuilding: building,
      isDetailsOpen: false,
      isFormOpen: false,
      isImageManagerOpen: true,
      operationLoading: false
    };

    setSelectedBuilding(building);
    setIsDetailsOpen(false);
    setIsFormOpen(false);
    setIsImageManagerOpen(true);
    
    logStateChange('IMAGE_MANAGER', newState);
  };

  return {
    handleDeleteBuilding,
    handleNewBuilding,
    handleViewBuilding,
    handleViewCampaigns,
    handleEditBuilding,
    handleImageManager
  };
};
